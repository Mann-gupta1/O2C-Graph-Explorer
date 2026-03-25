# SAP O2C Graph Explorer

A graph-based data modeling and natural language query system for SAP Order-to-Cash (O2C) data. Visualize interconnected business entities and query them using conversational AI.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  React Frontend                       │
│  ┌─────────────────────┐  ┌────────────────────────┐ │
│  │  Force-Directed      │  │  Chat Panel            │ │
│  │  Graph Visualization │  │  (NL Query Interface)  │ │
│  │  (react-force-graph) │  │                        │ │
│  └────────┬────────────┘  └───────────┬────────────┘ │
└───────────┼───────────────────────────┼──────────────┘
            │ GET /api/graph            │ POST /api/chat
            ▼                           ▼
┌──────────────────────────────────────────────────────┐
│                 FastAPI Backend                        │
│  ┌────────────────┐  ┌──────────────────────────────┐│
│  │  Graph Service  │  │  LLM Service                 ││
│  │  (NetworkX)     │  │  ┌────────────┐ ┌──────────┐││
│  │  - Build graph  │  │  │ Guardrails │→│ Groq /   │││
│  │  - Traverse     │  │  │ - Classify │ │ Gemini   │││
│  │  - Expand nodes │  │  │ - Validate │ │ (NL→SQL) │││
│  └───────┬────────┘  │  └────────────┘ └─────┬────┘││
│          │           │                        │      ││
│          ▼           │                        ▼      ││
│  ┌───────────────────┴────────────────────────────┐  ││
│  │              SQLite Database                    │  ││
│  │  17 tables · ~21K records · O2C business data   │  ││
│  └─────────────────────────────────────────────────┘  ││
└──────────────────────────────────────────────────────┘
```

## Key Decisions

### Database: SQLite

**Why SQLite over PostgreSQL/Neo4j:**

- **Zero infrastructure**: No database server to provision, configure, or maintain. The database is a single file embedded in the application.
- **Portability**: The entire dataset ships with the application and is built deterministically from the raw JSONL files at startup.
- **SQL for LLM integration**: LLMs generate better SQL than Cypher or other graph query languages. SQLite's SQL dialect is well-represented in training data, leading to more accurate query generation.
- **Performance**: For a dataset of ~21K records, SQLite provides sub-millisecond query times with proper indexing. No network latency to a database server.
- **Graph layer on top**: NetworkX provides the in-memory graph model for visualization and traversal. The relational data feeds the graph, giving us the best of both worlds.

**Trade-offs accepted**: No concurrent writes (not needed for a read-heavy analytics tool), no full-text search (could add FTS5 if needed).

### Graph Model: NetworkX (in-memory)

The graph is built at startup from the SQLite database and held in memory:

- **Nodes** represent business entities: Customers, Sales Orders, Deliveries, Billing Documents, Journal Entries, Payments, Products, Plants
- **Edges** represent relationships derived from foreign key chains in the O2C flow:
  - `Customer ─PLACED_ORDER→ SalesOrder`
  - `SalesOrder ─CONTAINS_ITEM→ SalesOrderItem ─REFERENCES_PRODUCT→ Product`
  - `SalesOrder ─FULFILLED_BY→ Delivery ─SHIPPED_FROM→ Plant`
  - `Delivery ─BILLED_IN→ BillingDocument ─POSTED_AS→ JournalEntry`
  - `JournalEntry ─CLEARED_BY→ Payment ─PAID_BY→ Customer`

The summary graph (default view) shows only entity-level nodes (no line items) to keep the visualization readable. Double-clicking a node expands it to show its 1-hop neighbors including items.

### LLM: Groq (Llama 3.3 70B) / Google Gemini (fallback)

The system supports two LLM providers with automatic selection:

**Primary — Groq (Llama 3.3 70B Versatile):**

- **Most reliable free tier**: 30 requests/minute, 14,400 requests/day — no surprise quota issues
- **Excellent SQL generation**: Llama 3.3 70B produces highly accurate SQLite-compatible SQL
- **Very fast inference**: Groq's LPU hardware delivers sub-second response times

**Fallback — Google Gemini 2.0 Flash:**

- Available if Groq is unavailable; auto-detected based on which API key is set
- Retry logic with exponential backoff handles transient rate limits

**Provider selection** is automatic: if `GROQ_API_KEY` is set, Groq is used. If only `GEMINI_API_KEY` is set, Gemini is used. You can override with `LLM_PROVIDER=groq` or `LLM_PROVIDER=gemini`.

**Prompting Strategy:**

1. **Schema-aware system prompt**: The full DDL, sample data, and relationship descriptions are injected into the prompt so the LLM understands the data model
2. **Two-phase approach**: First call generates SQL, SQL is executed, then a second call formats the results as natural language — ensuring answers are always grounded in actual data
3. **Structured output**: The LLM returns JSON `{sql, explanation}` which is parsed and validated before execution
4. **Few-shot guidance**: The system prompt includes relationship descriptions and JOIN patterns to guide correct query construction

### Guardrails

Multiple layers prevent misuse:

1. **Pattern-based rejection**: Regex patterns detect obviously off-topic queries (creative writing, general knowledge, prompt injection attempts) before hitting the LLM
2. **Domain keyword check**: Queries lacking any dataset-relevant keywords are flagged as potentially off-topic
3. **LLM-level classification**: The system prompt instructs the LLM to return `REJECTED` for non-dataset queries
4. **SQL validation**: Generated SQL is parsed to ensure:
  - Only `SELECT` statements (no mutations)
  - Only references to known tables in the schema
5. **Polite rejection**: Off-topic queries receive a helpful message directing users to ask dataset-related questions

### Frontend: React + react-force-graph-2d

- **Dark theme** with color-coded nodes by entity type for visual clarity
- **Interactive graph**: Click to inspect node metadata, double-click to expand connections
- **Entity type filters**: Toggle visibility of specific entity types in the top bar
- **Chat panel**: Markdown-rendered responses with expandable SQL view
- **Node highlighting**: Query results highlight referenced nodes in the graph for 8 seconds

## Tech Stack


| Layer      | Technology                                                     |
| ---------- | -------------------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, react-force-graph-2d |
| Backend    | Python, FastAPI, NetworkX, SQLite                              |
| LLM        | Groq (Llama 3.3 70B) / Google Gemini 2.0 Flash (free tier)     |
| Deployment | Docker, Render                                                 |


## Running Locally

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your GROQ_API_KEY (recommended) or GEMINI_API_KEY
python -m app.db.ingest  # Ingest dataset into SQLite
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:5173, proxies /api to :8000
```

### Docker (Full Stack)

```bash
docker build -t sap-o2c-explorer .
docker run -p 8000:8000 -e GROQ_API_KEY=your_key sap-o2c-explorer
```

## Example Queries

- "Which products are associated with the highest number of billing documents?"
- "Trace the full flow of billing document 90504248"
- "Show sales orders that have been delivered but not billed"
- "What is the total billing amount per customer?"
- "List all deliveries shipped from plant 1920"
- "Which customers have the most sales orders?"

## API Endpoints


| Method | Path                        | Description                  |
| ------ | --------------------------- | ---------------------------- |
| `GET`  | `/api/graph?summary=true`   | Graph data (summary or full) |
| `GET`  | `/api/graph/node/{id}`      | Node details with neighbors  |
| `GET`  | `/api/graph/neighbors/{id}` | Expand node (1-hop BFS)      |
| `POST` | `/api/chat`                 | Natural language query       |
| `GET`  | `/api/schema`               | Database schema DDL          |
| `GET`  | `/api/health`               | Health check                 |


## Dataset

SAP Order-to-Cash (O2C) data consisting of 17 entity types:


| Entity                    | Records | Description                      |
| ------------------------- | ------- | -------------------------------- |
| Sales Order Headers       | 100     | Sales orders placed by customers |
| Sales Order Items         | 167     | Line items within sales orders   |
| Outbound Delivery Headers | 86      | Delivery documents               |
| Outbound Delivery Items   | 137     | Items within deliveries          |
| Billing Document Headers  | 163     | Invoices/billing documents       |
| Billing Document Items    | 245     | Line items within billing docs   |
| Journal Entry Items       | 123     | Accounting journal entries       |
| Payments                  | 120     | Customer payments                |
| Business Partners         | 8       | Customer master data             |
| Products                  | 69      | Product/material master          |
| Plants                    | 44      | Manufacturing/shipping plants    |


