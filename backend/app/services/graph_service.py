import networkx as nx
from app.db.database import get_db
from app.models.schemas import GraphNode, GraphEdge, GraphData, NodeDetail

_graph: nx.DiGraph | None = None


def _build_graph() -> nx.DiGraph:
    G = nx.DiGraph()

    with get_db() as conn:
        # Business Partners (Customers)
        for row in conn.execute("SELECT businessPartner, businessPartnerName FROM business_partners").fetchall():
            nid = f"BP:{row[0]}"
            G.add_node(nid, type="Customer", label=row[1] or row[0], businessPartner=row[0], name=row[1])

        # Products with descriptions
        for row in conn.execute("""
            SELECT p.product, p.productType, p.productGroup, p.baseUnit,
                   pd.productDescription
            FROM products p
            LEFT JOIN product_descriptions pd ON p.product = pd.product AND pd.language = 'EN'
        """).fetchall():
            nid = f"PRD:{row[0]}"
            G.add_node(nid, type="Product", label=row[4] or row[0],
                       product=row[0], productType=row[1], productGroup=row[2], baseUnit=row[3])

        # Plants
        for row in conn.execute("SELECT plant, plantName FROM plants").fetchall():
            nid = f"PLT:{row[0]}"
            G.add_node(nid, type="Plant", label=row[1] or row[0], plant=row[0], plantName=row[1])

        # Sales Order Headers
        for row in conn.execute("""
            SELECT salesOrder, soldToParty, totalNetAmount, transactionCurrency,
                   creationDate, overallDeliveryStatus, salesOrderType
            FROM sales_order_headers
        """).fetchall():
            nid = f"SO:{row[0]}"
            G.add_node(nid, type="SalesOrder", label=f"SO {row[0]}",
                       salesOrder=row[0], totalNetAmount=row[2], currency=row[3],
                       creationDate=row[4], deliveryStatus=row[5], orderType=row[6])
            bp_nid = f"BP:{row[1]}"
            if G.has_node(bp_nid):
                G.add_edge(bp_nid, nid, relationship="PLACED_ORDER")

        # Sales Order Items -> link to SO and Product
        for row in conn.execute("""
            SELECT salesOrder, salesOrderItem, material, netAmount, requestedQuantity, productionPlant
            FROM sales_order_items
        """).fetchall():
            so_nid = f"SO:{row[0]}"
            item_nid = f"SOI:{row[0]}-{row[1]}"
            G.add_node(item_nid, type="SalesOrderItem", label=f"Item {row[1]} of SO {row[0]}",
                       salesOrder=row[0], item=row[1], material=row[2],
                       netAmount=row[3], quantity=row[4])
            if G.has_node(so_nid):
                G.add_edge(so_nid, item_nid, relationship="CONTAINS_ITEM")
            prd_nid = f"PRD:{row[2]}"
            if G.has_node(prd_nid):
                G.add_edge(item_nid, prd_nid, relationship="REFERENCES_PRODUCT")
            plt_nid = f"PLT:{row[5]}"
            if row[5] and G.has_node(plt_nid):
                G.add_edge(item_nid, plt_nid, relationship="PRODUCED_AT")

        # Delivery Headers
        for row in conn.execute("""
            SELECT deliveryDocument, creationDate, overallGoodsMovementStatus,
                   shippingPoint, actualGoodsMovementDate
            FROM outbound_delivery_headers
        """).fetchall():
            nid = f"DLV:{row[0]}"
            G.add_node(nid, type="Delivery", label=f"Delivery {row[0]}",
                       deliveryDocument=row[0], creationDate=row[1],
                       goodsMovementStatus=row[2], shippingPoint=row[3],
                       actualGoodsMovementDate=row[4])

        # Delivery Items -> link Delivery to Sales Order
        for row in conn.execute("""
            SELECT deliveryDocument, deliveryDocumentItem, referenceSdDocument,
                   referenceSdDocumentItem, plant, actualDeliveryQuantity, material
            FROM outbound_delivery_items
        """).fetchall():
            dlv_nid = f"DLV:{row[0]}"
            so_nid = f"SO:{row[2]}"
            if G.has_node(dlv_nid) and G.has_node(so_nid):
                if not G.has_edge(so_nid, dlv_nid):
                    G.add_edge(so_nid, dlv_nid, relationship="FULFILLED_BY")
            plt_nid = f"PLT:{row[4]}"
            if row[4] and G.has_node(dlv_nid) and G.has_node(plt_nid):
                if not G.has_edge(dlv_nid, plt_nid):
                    G.add_edge(dlv_nid, plt_nid, relationship="SHIPPED_FROM")

        # Billing Document Headers
        for row in conn.execute("""
            SELECT billingDocument, billingDocumentType, totalNetAmount,
                   transactionCurrency, billingDocumentDate, accountingDocument,
                   soldToParty, billingDocumentIsCancelled
            FROM billing_document_headers
        """).fetchall():
            nid = f"BIL:{row[0]}"
            G.add_node(nid, type="BillingDocument", label=f"Billing {row[0]}",
                       billingDocument=row[0], docType=row[1], totalNetAmount=row[2],
                       currency=row[3], billingDate=row[4], accountingDocument=row[5],
                       isCancelled=bool(row[7]))

        # Billing Document Items -> link Billing to Delivery
        for row in conn.execute("""
            SELECT billingDocument, billingDocumentItem, referenceSdDocument, material
            FROM billing_document_items
        """).fetchall():
            bil_nid = f"BIL:{row[0]}"
            dlv_nid = f"DLV:{row[2]}"
            if G.has_node(bil_nid) and G.has_node(dlv_nid):
                if not G.has_edge(dlv_nid, bil_nid):
                    G.add_edge(dlv_nid, bil_nid, relationship="BILLED_IN")

        # Journal Entry Items -> link to Billing
        seen_je = set()
        for row in conn.execute("""
            SELECT accountingDocument, referenceDocument, amountInTransactionCurrency,
                   transactionCurrency, postingDate, customer, accountingDocumentType
            FROM journal_entry_items
        """).fetchall():
            nid = f"JE:{row[0]}"
            if nid not in seen_je:
                seen_je.add(nid)
                G.add_node(nid, type="JournalEntry", label=f"JE {row[0]}",
                           accountingDocument=row[0], amount=row[2], currency=row[3],
                           postingDate=row[4], customer=row[5], docType=row[6])
            bil_nid = f"BIL:{row[1]}"
            if row[1] and G.has_node(bil_nid) and G.has_node(nid):
                if not G.has_edge(bil_nid, nid):
                    G.add_edge(bil_nid, nid, relationship="POSTED_AS")

        # Payments -> link to Customer
        seen_pay = set()
        for row in conn.execute("""
            SELECT accountingDocument, amountInTransactionCurrency, transactionCurrency,
                   customer, postingDate, clearingAccountingDocument
            FROM payments
        """).fetchall():
            nid = f"PAY:{row[0]}"
            if nid not in seen_pay:
                seen_pay.add(nid)
                G.add_node(nid, type="Payment", label=f"Payment {row[0]}",
                           accountingDocument=row[0], amount=row[1], currency=row[2],
                           customer=row[3], postingDate=row[4])
            bp_nid = f"BP:{row[3]}"
            if row[3] and G.has_node(bp_nid) and G.has_node(nid):
                if not G.has_edge(nid, bp_nid):
                    G.add_edge(nid, bp_nid, relationship="PAID_BY")
            # Link payment to journal entry via clearing document
            if row[5]:
                je_nid = f"JE:{row[5]}"
                if G.has_node(je_nid) and G.has_node(nid):
                    if not G.has_edge(je_nid, nid):
                        G.add_edge(je_nid, nid, relationship="CLEARED_BY")

    return G


def get_graph() -> nx.DiGraph:
    global _graph
    if _graph is None:
        _graph = _build_graph()
    return _graph


def rebuild_graph():
    global _graph
    _graph = _build_graph()
    return _graph


def get_full_graph_data() -> GraphData:
    G = get_graph()
    nodes = []
    for nid, data in G.nodes(data=True):
        node_type = data.pop("type", "Unknown")
        label = data.pop("label", nid)
        nodes.append(GraphNode(id=nid, type=node_type, label=label, metadata=data))

    links = []
    for src, tgt, data in G.edges(data=True):
        links.append(GraphEdge(source=src, target=tgt, relationship=data.get("relationship", "")))

    return GraphData(nodes=nodes, links=links)


def get_summary_graph_data() -> GraphData:
    """Return a simplified graph with only the core O2C entities (no items)."""
    G = get_graph()
    core_types = {"Customer", "SalesOrder", "Delivery", "BillingDocument", "JournalEntry", "Payment", "Product", "Plant"}

    nodes = []
    node_ids = set()
    for nid, data in G.nodes(data=True):
        if data.get("type") in core_types:
            node_type = data.get("type", "Unknown")
            label = data.get("label", nid)
            meta = {k: v for k, v in data.items() if k not in ("type", "label")}
            nodes.append(GraphNode(id=nid, type=node_type, label=label, metadata=meta))
            node_ids.add(nid)

    links = []
    for src, tgt, data in G.edges(data=True):
        if src in node_ids and tgt in node_ids:
            links.append(GraphEdge(source=src, target=tgt, relationship=data.get("relationship", "")))

    return GraphData(nodes=nodes, links=links)


def get_node_detail(node_id: str) -> NodeDetail | None:
    G = get_graph()
    if node_id not in G:
        return None

    data = dict(G.nodes[node_id])
    node_type = data.pop("type", "Unknown")
    label = data.pop("label", node_id)
    node = GraphNode(id=node_id, type=node_type, label=label, metadata=data)

    neighbors = []
    edges = []
    for neighbor_id in set(list(G.successors(node_id)) + list(G.predecessors(node_id))):
        ndata = dict(G.nodes[neighbor_id])
        ntype = ndata.pop("type", "Unknown")
        nlabel = ndata.pop("label", neighbor_id)
        neighbors.append(GraphNode(id=neighbor_id, type=ntype, label=nlabel, metadata=ndata))

    for src, tgt, edata in G.out_edges(node_id, data=True):
        edges.append(GraphEdge(source=src, target=tgt, relationship=edata.get("relationship", "")))
    for src, tgt, edata in G.in_edges(node_id, data=True):
        edges.append(GraphEdge(source=src, target=tgt, relationship=edata.get("relationship", "")))

    return NodeDetail(node=node, neighbors=neighbors, edges=edges)


def get_neighbors(node_id: str, depth: int = 1) -> GraphData | None:
    G = get_graph()
    if node_id not in G:
        return None

    visited = {node_id}
    frontier = [node_id]
    for _ in range(depth):
        next_frontier = []
        for nid in frontier:
            for neighbor in set(list(G.successors(nid)) + list(G.predecessors(nid))):
                if neighbor not in visited:
                    visited.add(neighbor)
                    next_frontier.append(neighbor)
        frontier = next_frontier

    nodes = []
    for nid in visited:
        data = dict(G.nodes[nid])
        node_type = data.pop("type", "Unknown")
        label = data.pop("label", nid)
        nodes.append(GraphNode(id=nid, type=node_type, label=label, metadata=data))

    links = []
    for src, tgt, data in G.edges(data=True):
        if src in visited and tgt in visited:
            links.append(GraphEdge(source=src, target=tgt, relationship=data.get("relationship", "")))

    return GraphData(nodes=nodes, links=links)
