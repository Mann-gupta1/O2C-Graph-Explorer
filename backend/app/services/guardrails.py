import re
import sqlparse

ALLOWED_TABLES = {
    "sales_order_headers", "sales_order_items", "sales_order_schedule_lines",
    "outbound_delivery_headers", "outbound_delivery_items",
    "billing_document_headers", "billing_document_items", "billing_document_cancellations",
    "journal_entry_items", "payments",
    "business_partners", "business_partner_addresses",
    "customer_company_assignments", "customer_sales_area_assignments",
    "products", "product_descriptions", "plants",
}

OFF_TOPIC_PATTERNS = [
    r"(?i)(write|compose|create)\s+(a\s+)?(poem|story|essay|song|joke|letter)",
    r"(?i)(what\s+is|explain|tell\s+me\s+about)\s+(the\s+)?(meaning\s+of\s+life|universe|weather|politics|news)",
    r"(?i)(translate|convert)\s+.+\s+(to|into)\s+(french|spanish|german|hindi|chinese)",
    r"(?i)who\s+(is|was|are)\s+(the\s+)?(president|prime\s+minister|ceo|founder)",
    r"(?i)(recipe|cook|bake|ingredient)",
    r"(?i)(play|game|movie|music|sport)",
    r"(?i)(how\s+to\s+)(hack|break|bypass|crack)",
    r"(?i)(ignore|forget|override)\s+(previous|all|your)\s+(instructions|rules|prompt)",
]

DOMAIN_KEYWORDS = [
    "sales order", "delivery", "billing", "invoice", "payment", "journal entry",
    "customer", "product", "material", "plant", "order", "shipped", "billed",
    "amount", "quantity", "document", "cancelled", "status", "flow",
    "o2c", "order to cash", "account", "receivable", "net amount",
    "shipping", "goods movement", "schedule", "currency", "company code",
]


def is_off_topic(query: str) -> bool:
    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, query):
            return True
    return False


def has_domain_relevance(query: str) -> bool:
    query_lower = query.lower()
    return any(kw in query_lower for kw in DOMAIN_KEYWORDS)


def validate_sql(sql: str) -> tuple[bool, str]:
    if not sql or not sql.strip():
        return False, "Empty SQL generated"

    sql_upper = sql.upper().strip()
    if any(sql_upper.startswith(kw) for kw in ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE"]):
        return False, "Only SELECT queries are allowed"

    try:
        parsed = sqlparse.parse(sql)
        if not parsed:
            return False, "Could not parse SQL"
    except Exception:
        return False, "SQL parsing failed"

    table_pattern = re.findall(r'(?:FROM|JOIN)\s+\[?(\w+)\]?', sql, re.IGNORECASE)
    for table in table_pattern:
        if table.lower() not in ALLOWED_TABLES:
            return False, f"Referenced unknown table: {table}"

    return True, "Valid"


def get_rejection_message() -> str:
    return (
        "I'm designed to answer questions about the SAP Order-to-Cash dataset only. "
        "This includes sales orders, deliveries, billing documents, journal entries, "
        "payments, customers, products, and plants. "
        "Please ask a question related to this data."
    )
