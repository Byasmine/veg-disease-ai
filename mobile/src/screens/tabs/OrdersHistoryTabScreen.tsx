import React from 'react';
import { TabPlaceholder } from './TabPlaceholder';

export function OrdersHistoryTabScreen() {
  return (
    <TabPlaceholder
      title="Orders History"
      subtitle="Track previous purchases, statuses, and delivery timelines in one place."
      icon="receipt-outline"
      hint="Next integration: order list, order details, and shipment tracking timeline."
      ctaLabel="View recent orders"
    />
  );
}
