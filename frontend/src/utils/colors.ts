import type { EntityType } from '../types';

export const ENTITY_COLORS: Record<EntityType, string> = {
  Customer: '#818cf8',
  SalesOrder: '#60a5fa',
  SalesOrderItem: '#93c5fd',
  Delivery: '#34d399',
  BillingDocument: '#fbbf24',
  JournalEntry: '#c084fc',
  Payment: '#f472b6',
  Product: '#fb923c',
  Plant: '#2dd4bf',
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
    Customer: 11,
    SalesOrder: 8,
    Delivery: 8,
    BillingDocument: 8,
    JournalEntry: 7,
    Payment: 7,
    Product: 6,
    Plant: 6,
  };
  return sizes[type] || 5;
}
