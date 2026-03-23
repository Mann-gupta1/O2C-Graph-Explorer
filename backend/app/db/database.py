import sqlite3
from contextlib import contextmanager
from app.config import DB_PATH


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def execute_query(sql: str, params: tuple = ()) -> list[dict]:
    with get_db() as conn:
        cursor = conn.execute(sql, params)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_schema_ddl() -> str:
    with get_db() as conn:
        cursor = conn.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL ORDER BY name"
        )
        return "\n\n".join(row[0] for row in cursor.fetchall())


def get_table_sample(table: str, limit: int = 3) -> list[dict]:
    with get_db() as conn:
        cursor = conn.execute(f"SELECT * FROM [{table}] LIMIT ?", (limit,))
        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
