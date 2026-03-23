from fastapi import APIRouter
from app.models.schemas import ChatRequest, ChatResponse
from app.services.llm_service import process_query

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    return process_query(request.query)
