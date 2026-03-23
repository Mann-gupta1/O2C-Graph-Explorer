from fastapi import APIRouter, HTTPException, Query
from app.services.graph_service import get_full_graph_data, get_summary_graph_data, get_node_detail, get_neighbors
from app.models.schemas import GraphData, NodeDetail

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("", response_model=GraphData)
def get_graph(summary: bool = Query(True, description="Return simplified graph without item-level nodes")):
    if summary:
        return get_summary_graph_data()
    return get_full_graph_data()


@router.get("/node/{node_id:path}", response_model=NodeDetail)
def get_node(node_id: str):
    detail = get_node_detail(node_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")
    return detail


@router.get("/neighbors/{node_id:path}", response_model=GraphData)
def get_node_neighbors(node_id: str, depth: int = Query(1, ge=1, le=3)):
    data = get_neighbors(node_id, depth=depth)
    if not data:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")
    return data
