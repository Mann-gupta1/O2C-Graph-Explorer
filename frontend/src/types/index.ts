export interface GraphNode {
  id: string;
  type: string;
  label: string;
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

export interface NodeDetail {
  node: GraphNode;
  neighbors: GraphNode[];
  edges: GraphEdge[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string | null;
  referencedNodes?: string[];
  isRejected?: boolean;
  timestamp: Date;
}

export interface ChatResponse {
  answer: string;
  sql: string | null;
  referenced_nodes: string[];
  is_rejected: boolean;
}

export type EntityType =
  | 'Customer'
  | 'SalesOrder'
  | 'SalesOrderItem'
  | 'Delivery'
  | 'BillingDocument'
  | 'JournalEntry'
  | 'Payment'
  | 'Product'
  | 'Plant'
  | 'Unknown';
