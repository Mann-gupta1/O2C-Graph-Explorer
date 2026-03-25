import type { EntityType } from '../types';

export const ENTITY_COLORS: Record<EntityType, string> = {
  Customer: '#6366f1',
  SalesOrder: '#3b82f6',
  SalesOrderItem: '#93c5fd',
  Delivery: '#10b981',
  BillingDocument: '#f59e0b',
  JournalEntry: '#8b5cf6',
  Payment: '#ec4899',
  Product: '#ef4444',
  Plant: '#14b8a6',
  Unknown: '#9ca3af',
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  Customer: 'Customers',
  SalesOrder: 'Sales Orders',
  SalesOrderItem: 'Order Items',
  Delivery: 'Deliveries',
  BillingDocument: 'Billing',
  JournalEntry: 'Journals',
  Payment: 'Payments',
  Product: 'Products',
  Plant: 'Plants',
  Unknown: 'Other',
};

export function getNodeColor(type: string): string {
  return ENTITY_COLORS[type as EntityType] || ENTITY_COLORS.Unknown;
}

export function getNodeSize(type: string): number {
  const sizes: Record<string, number> = {
    Customer: 8,
    SalesOrder: 6,
    Delivery: 6,
    BillingDocument: 6,
    JournalEntry: 5,
    Payment: 5,
    Product: 4,
    Plant: 4,
  };
  return sizes[type] || 4;
}
