from pydantic import BaseModel
from typing import Any


class ChatRequest(BaseModel):
    query: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    sql: str | None = None
    referenced_nodes: list[str] = []
    is_rejected: bool = False


class GraphNode(BaseModel):
    id: str
    type: str
    label: str
    metadata: dict[str, Any] = {}


class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str


class GraphData(BaseModel):
    nodes: list[GraphNode]
    links: list[GraphEdge]


class NodeDetail(BaseModel):
    node: GraphNode
    neighbors: list[GraphNode]
    edges: list[GraphEdge]
