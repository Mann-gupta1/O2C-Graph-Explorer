import type { EntityType } from '../types';

export const ENTITY_COLORS: Record<EntityType, string> = {
  Customer: '#6366f1',
  SalesOrder: '#3b82f6',
  SalesOrderItem: '#60a5fa',
  Delivery: '#22c55e',
  BillingDocument: '#f59e0b',
  JournalEntry: '#a855f7',
  Payment: '#ec4899',
  Product: '#f97316',
  Plant: '#14b8a6',
  Unknown: '#6b7280',
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  Customer: 'Customers',
  SalesOrder: 'Sales Orders',
  SalesOrderItem: 'Order Items',
  Delivery: 'Deliveries',
  BillingDocument: 'Billing Docs',
  JournalEntry: 'Journal Entries',
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
    Customer: 10,
    SalesOrder: 7,
    Delivery: 7,
    BillingDocument: 7,
    JournalEntry: 6,
    Payment: 6,
    Product: 5,
    Plant: 5,
  };
  return sizes[type] || 5;
}
