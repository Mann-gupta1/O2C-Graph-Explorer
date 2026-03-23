import json
import re
import google.generativeai as genai
from app.config import GEMINI_API_KEY, GEMINI_MODEL
from app.db.database import get_schema_ddl, get_table_sample, execute_query
from app.services.guardrails import is_off_topic, has_domain_relevance, validate_sql, get_rejection_message
from app.models.schemas import ChatResponse

_model = None
_schema_context = None


def _get_model():
    global _model
    if _model is None:
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel(GEMINI_MODEL)
    return _model


def _get_schema_context() -> str:
    global _schema_context
    if _schema_context is not None:
        return _schema_context

    ddl = get_schema_ddl()

    sample_tables = [
        "sales_order_headers", "sales_order_items", "outbound_delivery_headers",
        "outbound_delivery_items", "billing_document_headers", "billing_document_items",
        "journal_entry_items", "payments", "business_partners", "products",
        "product_descriptions", "plants",
    ]
    samples = ""
    for table in sample_tables:
        try:
            rows = get_table_sample(table, limit=2)
            if rows:
                samples += f"\n-- Sample from {table}:\n{json.dumps(rows, indent=2, default=str)}\n"
        except Exception:
            pass

    _schema_context = f"""## Database Schema (SQLite)

{ddl}

## Sample Data
{samples}

## Key Relationships
- sales_order_headers.soldToParty -> business_partners.businessPartner (Customer who placed the order)
- sales_order_items.salesOrder -> sales_order_headers.salesOrder
- sales_order_items.material -> products.product
- outbound_delivery_items.referenceSdDocument -> sales_order_headers.salesOrder (Delivery for a sales order)
- outbound_delivery_items.deliveryDocument -> outbound_delivery_headers.deliveryDocument
- billing_document_items.referenceSdDocument -> outbound_delivery_headers.deliveryDocument (Billing for a delivery)
- billing_document_items.billingDocument -> billing_document_headers.billingDocument
- billing_document_headers.accountingDocument -> journal_entry_items.accountingDocument (Accounting entry for billing)
- journal_entry_items.referenceDocument -> billing_document_headers.billingDocument (Journal entry references billing)
- payments.clearingAccountingDocument links payments to journal entries
- product_descriptions.product -> products.product (product name lookup)

## O2C Flow
Sales Order -> Delivery -> Billing Document -> Journal Entry -> Payment
"""
    return _schema_context


SYSTEM_PROMPT = """You are a data analyst assistant for an SAP Order-to-Cash (O2C) dataset.
You ONLY answer questions related to this dataset. You must REFUSE any off-topic questions.

Your job:
1. Understand the user's natural language question
2. Generate a valid SQLite SQL query to answer it
3. The SQL will be executed and results returned to you
4. You will then provide a clear natural language answer based on the results

IMPORTANT RULES:
- Only generate SELECT queries. Never INSERT, UPDATE, DELETE, DROP, etc.
- Only reference tables that exist in the schema provided
- Always use proper JOIN conditions based on the relationships
- For product names, JOIN with product_descriptions (language='EN')
- For customer names, JOIN with business_partners
- Use meaningful column aliases
- Limit results to 50 rows max unless the user asks for all
- When tracing O2C flows, use the chain: sales_order_headers -> outbound_delivery_items (referenceSdDocument) -> outbound_delivery_headers -> billing_document_items (referenceSdDocument=deliveryDocument) -> billing_document_headers -> journal_entry_items (accountingDocument)

Respond ONLY with a JSON object in this exact format:
{
  "sql": "YOUR SQL QUERY HERE",
  "explanation": "Brief explanation of what the query does"
}

If the question is not related to the dataset, respond with:
{
  "sql": null,
  "explanation": "REJECTED: This question is not related to the SAP O2C dataset."
}
"""


def _extract_json(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks."""
    text = text.strip()
    json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if json_match:
        text = json_match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        raise


def process_query(query: str) -> ChatResponse:
    if is_off_topic(query):
        return ChatResponse(answer=get_rejection_message(), is_rejected=True)

    model = _get_model()
    schema_context = _get_schema_context()

    sql_prompt = f"""{SYSTEM_PROMPT}

{schema_context}

User question: {query}"""

    try:
        response = model.generate_content(sql_prompt)
        result = _extract_json(response.text)
    except Exception as e:
        if not has_domain_relevance(query):
            return ChatResponse(answer=get_rejection_message(), is_rejected=True)
        return ChatResponse(answer=f"I encountered an error processing your query. Please try rephrasing. Error: {str(e)}")

    sql = result.get("sql")
    explanation = result.get("explanation", "")

    if not sql or "REJECTED" in explanation:
        return ChatResponse(answer=get_rejection_message(), is_rejected=True)

    is_valid, validation_msg = validate_sql(sql)
    if not is_valid:
        return ChatResponse(
            answer=f"Generated query failed validation: {validation_msg}. Please try rephrasing your question.",
            sql=sql,
        )

    try:
        query_results = execute_query(sql)
    except Exception as e:
        return ChatResponse(
            answer=f"Query execution failed: {str(e)}. The generated SQL may have an error. Please try rephrasing.",
            sql=sql,
        )

    referenced_nodes = _extract_node_refs(query_results)

    answer_prompt = f"""Based on the following SQL query results, provide a clear, concise natural language answer to the user's question.

User question: {query}

SQL query used: {sql}

Query results (JSON):
{json.dumps(query_results[:50], indent=2, default=str)}

Total rows returned: {len(query_results)}

Provide a helpful, data-backed answer. Use specific numbers and values from the results.
Format important data in a readable way. If there are many results, summarize the key findings.
Do NOT include the SQL query in your answer. Do NOT mention technical details about the database."""

    try:
        answer_response = model.generate_content(answer_prompt)
        answer = answer_response.text
    except Exception:
        if query_results:
            answer = f"Query returned {len(query_results)} results. Here are the first few:\n\n"
            for row in query_results[:10]:
                answer += str(row) + "\n"
        else:
            answer = "The query returned no results."

    return ChatResponse(answer=answer, sql=sql, referenced_nodes=referenced_nodes)


def _extract_node_refs(results: list[dict]) -> list[str]:
    """Extract graph node IDs from query results."""
    refs = []
    key_mapping = {
        "salesOrder": "SO",
        "deliveryDocument": "DLV",
        "billingDocument": "BIL",
        "accountingDocument": "JE",
        "businessPartner": "BP",
        "customer": "BP",
        "soldToParty": "BP",
        "product": "PRD",
        "material": "PRD",
        "plant": "PLT",
    }

    for row in results[:50]:
        for key, prefix in key_mapping.items():
            if key in row and row[key]:
                ref = f"{prefix}:{row[key]}"
                if ref not in refs:
                    refs.append(ref)
    return refs
