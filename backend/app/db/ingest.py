import json
import glob
import sqlite3
from pathlib import Path
from app.config import DATA_DIR, DB_PATH


ENTITY_TABLE_MAP = {
    "sales_order_headers": {
        "table": "sales_order_headers",
        "columns": {
            "salesOrder": "TEXT PRIMARY KEY",
            "salesOrderType": "TEXT",
            "salesOrganization": "TEXT",
            "distributionChannel": "TEXT",
            "organizationDivision": "TEXT",
            "soldToParty": "TEXT",
            "creationDate": "TEXT",
            "totalNetAmount": "REAL",
            "overallDeliveryStatus": "TEXT",
            "overallOrdReltdBillgStatus": "TEXT",
            "transactionCurrency": "TEXT",
            "requestedDeliveryDate": "TEXT",
            "headerBillingBlockReason": "TEXT",
            "deliveryBlockReason": "TEXT",
            "incotermsClassification": "TEXT",
            "customerPaymentTerms": "TEXT",
        },
    },
    "sales_order_items": {
        "table": "sales_order_items",
        "columns": {
            "salesOrder": "TEXT",
            "salesOrderItem": "TEXT",
            "salesOrderItemCategory": "TEXT",
            "material": "TEXT",
            "requestedQuantity": "REAL",
            "requestedQuantityUnit": "TEXT",
            "transactionCurrency": "TEXT",
            "netAmount": "REAL",
            "materialGroup": "TEXT",
            "productionPlant": "TEXT",
            "storageLocation": "TEXT",
        },
        "primary_key": "(salesOrder, salesOrderItem)",
    },
    "sales_order_schedule_lines": {
        "table": "sales_order_schedule_lines",
        "columns": {
            "salesOrder": "TEXT",
            "salesOrderItem": "TEXT",
            "scheduleLine": "TEXT",
            "confirmedDeliveryDate": "TEXT",
            "orderQuantityUnit": "TEXT",
            "confdOrderQtyByMatlAvailCheck": "REAL",
        },
        "primary_key": "(salesOrder, salesOrderItem, scheduleLine)",
    },
    "outbound_delivery_headers": {
        "table": "outbound_delivery_headers",
        "columns": {
            "deliveryDocument": "TEXT PRIMARY KEY",
            "actualGoodsMovementDate": "TEXT",
            "creationDate": "TEXT",
            "deliveryBlockReason": "TEXT",
            "overallGoodsMovementStatus": "TEXT",
            "overallPickingStatus": "TEXT",
            "shippingPoint": "TEXT",
            "headerBillingBlockReason": "TEXT",
        },
    },
    "outbound_delivery_items": {
        "table": "outbound_delivery_items",
        "columns": {
            "deliveryDocument": "TEXT",
            "deliveryDocumentItem": "TEXT",
            "actualDeliveryQuantity": "REAL",
            "deliveryQuantityUnit": "TEXT",
            "plant": "TEXT",
            "referenceSdDocument": "TEXT",
            "referenceSdDocumentItem": "TEXT",
            "storageLocation": "TEXT",
            "material": "TEXT",
        },
        "primary_key": "(deliveryDocument, deliveryDocumentItem)",
    },
    "billing_document_headers": {
        "table": "billing_document_headers",
        "columns": {
            "billingDocument": "TEXT PRIMARY KEY",
            "billingDocumentType": "TEXT",
            "creationDate": "TEXT",
            "billingDocumentDate": "TEXT",
            "billingDocumentIsCancelled": "INTEGER",
            "cancelledBillingDocument": "TEXT",
            "totalNetAmount": "REAL",
            "transactionCurrency": "TEXT",
            "companyCode": "TEXT",
            "fiscalYear": "INTEGER",
            "accountingDocument": "TEXT",
            "soldToParty": "TEXT",
        },
    },
    "billing_document_items": {
        "table": "billing_document_items",
        "columns": {
            "billingDocument": "TEXT",
            "billingDocumentItem": "TEXT",
            "material": "TEXT",
            "billingQuantity": "REAL",
            "billingQuantityUnit": "TEXT",
            "netAmount": "REAL",
            "transactionCurrency": "TEXT",
            "referenceSdDocument": "TEXT",
            "referenceSdDocumentItem": "TEXT",
        },
        "primary_key": "(billingDocument, billingDocumentItem)",
    },
    "billing_document_cancellations": {
        "table": "billing_document_cancellations",
        "columns": {
            "billingDocument": "TEXT PRIMARY KEY",
            "billingDocumentType": "TEXT",
            "creationDate": "TEXT",
            "billingDocumentDate": "TEXT",
            "billingDocumentIsCancelled": "INTEGER",
            "cancelledBillingDocument": "TEXT",
            "totalNetAmount": "REAL",
            "transactionCurrency": "TEXT",
            "companyCode": "TEXT",
            "fiscalYear": "INTEGER",
            "accountingDocument": "TEXT",
            "soldToParty": "TEXT",
        },
    },
    "journal_entry_items_accounts_receivable": {
        "table": "journal_entry_items",
        "columns": {
            "companyCode": "TEXT",
            "fiscalYear": "INTEGER",
            "accountingDocument": "TEXT",
            "accountingDocumentItem": "TEXT",
            "glAccount": "TEXT",
            "referenceDocument": "TEXT",
            "profitCenter": "TEXT",
            "transactionCurrency": "TEXT",
            "amountInTransactionCurrency": "REAL",
            "postingDate": "TEXT",
            "documentDate": "TEXT",
            "accountingDocumentType": "TEXT",
            "customer": "TEXT",
            "financialAccountType": "TEXT",
            "clearingDate": "TEXT",
            "clearingAccountingDocument": "TEXT",
        },
        "primary_key": "(accountingDocument, accountingDocumentItem)",
    },
    "payments_accounts_receivable": {
        "table": "payments",
        "columns": {
            "companyCode": "TEXT",
            "fiscalYear": "INTEGER",
            "accountingDocument": "TEXT",
            "accountingDocumentItem": "TEXT",
            "amountInTransactionCurrency": "REAL",
            "transactionCurrency": "TEXT",
            "customer": "TEXT",
            "invoiceReference": "TEXT",
            "postingDate": "TEXT",
            "documentDate": "TEXT",
            "glAccount": "TEXT",
            "profitCenter": "TEXT",
            "clearingDate": "TEXT",
            "clearingAccountingDocument": "TEXT",
        },
        "primary_key": "(accountingDocument, accountingDocumentItem)",
    },
    "business_partners": {
        "table": "business_partners",
        "columns": {
            "businessPartner": "TEXT PRIMARY KEY",
            "customer": "TEXT",
            "businessPartnerCategory": "TEXT",
            "businessPartnerFullName": "TEXT",
            "businessPartnerName": "TEXT",
            "creationDate": "TEXT",
            "businessPartnerIsBlocked": "INTEGER",
        },
    },
    "business_partner_addresses": {
        "table": "business_partner_addresses",
        "columns": {
            "businessPartner": "TEXT",
            "addressId": "TEXT",
            "cityName": "TEXT",
            "country": "TEXT",
            "postalCode": "TEXT",
            "region": "TEXT",
            "streetName": "TEXT",
        },
        "primary_key": "(businessPartner, addressId)",
    },
    "customer_company_assignments": {
        "table": "customer_company_assignments",
        "columns": {
            "customer": "TEXT",
            "companyCode": "TEXT",
            "reconciliationAccount": "TEXT",
            "paymentTerms": "TEXT",
            "customerAccountGroup": "TEXT",
        },
        "primary_key": "(customer, companyCode)",
    },
    "customer_sales_area_assignments": {
        "table": "customer_sales_area_assignments",
        "columns": {
            "customer": "TEXT",
            "salesOrganization": "TEXT",
            "distributionChannel": "TEXT",
            "division": "TEXT",
            "currency": "TEXT",
            "customerPaymentTerms": "TEXT",
            "incotermsClassification": "TEXT",
            "shippingCondition": "TEXT",
        },
        "primary_key": "(customer, salesOrganization, distributionChannel, division)",
    },
    "products": {
        "table": "products",
        "columns": {
            "product": "TEXT PRIMARY KEY",
            "productType": "TEXT",
            "creationDate": "TEXT",
            "grossWeight": "REAL",
            "weightUnit": "TEXT",
            "netWeight": "REAL",
            "productGroup": "TEXT",
            "baseUnit": "TEXT",
            "division": "TEXT",
            "industrySector": "TEXT",
        },
    },
    "product_descriptions": {
        "table": "product_descriptions",
        "columns": {
            "product": "TEXT",
            "language": "TEXT",
            "productDescription": "TEXT",
        },
        "primary_key": "(product, language)",
    },
    "plants": {
        "table": "plants",
        "columns": {
            "plant": "TEXT PRIMARY KEY",
            "plantName": "TEXT",
            "salesOrganization": "TEXT",
            "plantCategory": "TEXT",
            "distributionChannel": "TEXT",
            "division": "TEXT",
            "language": "TEXT",
        },
    },
}


def _parse_value(val):
    if val is None:
        return None
    if isinstance(val, bool):
        return int(val)
    if isinstance(val, dict):
        return json.dumps(val)
    return val


def _load_jsonl_files(folder_path: Path) -> list[dict]:
    records = []
    for fpath in sorted(folder_path.glob("*.jsonl")):
        with open(fpath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    records.append(json.loads(line))
    return records


def ingest_all():
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")

    for folder_name, spec in ENTITY_TABLE_MAP.items():
        folder_path = DATA_DIR / folder_name
        if not folder_path.exists():
            print(f"  Skipping {folder_name}: folder not found")
            continue

        table = spec["table"]
        columns = spec["columns"]
        pk = spec.get("primary_key")

        col_defs = ", ".join(f"{col} {dtype}" for col, dtype in columns.items())
        if pk:
            col_defs += f", PRIMARY KEY {pk}"

        conn.execute(f"DROP TABLE IF EXISTS [{table}]")
        conn.execute(f"CREATE TABLE [{table}] ({col_defs})")

        records = _load_jsonl_files(folder_path)
        if not records:
            print(f"  {table}: 0 records")
            continue

        col_names = list(columns.keys())
        placeholders = ", ".join(["?"] * len(col_names))
        insert_sql = f"INSERT OR IGNORE INTO [{table}] ({', '.join(col_names)}) VALUES ({placeholders})"

        rows = []
        for rec in records:
            row = tuple(_parse_value(rec.get(col)) for col in col_names)
            rows.append(row)

        conn.executemany(insert_sql, rows)
        conn.commit()
        print(f"  {table}: {len(rows)} records ingested")

    _create_indexes(conn)
    conn.close()
    print(f"Database created at {DB_PATH}")


def _create_indexes(conn: sqlite3.Connection):
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_soi_order ON sales_order_items(salesOrder)",
        "CREATE INDEX IF NOT EXISTS idx_soi_material ON sales_order_items(material)",
        "CREATE INDEX IF NOT EXISTS idx_odi_delivery ON outbound_delivery_items(deliveryDocument)",
        "CREATE INDEX IF NOT EXISTS idx_odi_refsd ON outbound_delivery_items(referenceSdDocument)",
        "CREATE INDEX IF NOT EXISTS idx_bdi_billing ON billing_document_items(billingDocument)",
        "CREATE INDEX IF NOT EXISTS idx_bdi_refsd ON billing_document_items(referenceSdDocument)",
        "CREATE INDEX IF NOT EXISTS idx_jei_accdoc ON journal_entry_items(accountingDocument)",
        "CREATE INDEX IF NOT EXISTS idx_jei_refdoc ON journal_entry_items(referenceDocument)",
        "CREATE INDEX IF NOT EXISTS idx_pay_accdoc ON payments(accountingDocument)",
        "CREATE INDEX IF NOT EXISTS idx_soh_soldto ON sales_order_headers(soldToParty)",
        "CREATE INDEX IF NOT EXISTS idx_bdh_soldto ON billing_document_headers(soldToParty)",
        "CREATE INDEX IF NOT EXISTS idx_bdh_accdoc ON billing_document_headers(accountingDocument)",
        "CREATE INDEX IF NOT EXISTS idx_pd_product ON product_descriptions(product)",
    ]
    for idx_sql in indexes:
        conn.execute(idx_sql)
    conn.commit()


if __name__ == "__main__":
    ingest_all()
