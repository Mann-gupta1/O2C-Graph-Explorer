import type { GraphData, NodeDetail, ChatResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function fetchGraph(summary = true): Promise<GraphData> {
  return fetchJSON<GraphData>(`/api/graph?summary=${summary}`);
}

export async function fetchNodeDetail(nodeId: string): Promise<NodeDetail> {
  return fetchJSON<NodeDetail>(`/api/graph/node/${encodeURIComponent(nodeId)}`);
}

export async function fetchNeighbors(nodeId: string, depth = 1): Promise<GraphData> {
  return fetchJSON<GraphData>(`/api/graph/neighbors/${encodeURIComponent(nodeId)}?depth=${depth}`);
}

export async function sendChatMessage(query: string): Promise<ChatResponse> {
  return fetchJSON<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}
