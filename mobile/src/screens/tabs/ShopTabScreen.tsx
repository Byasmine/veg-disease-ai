import React from 'react';
import { TabPlaceholder } from './TabPlaceholder';

export function ShopTabScreen() {
  return (
    <TabPlaceholder
      title="Shop"
      subtitle="Agricultural products marketplace for disease prevention, treatment, and crop growth."
      icon="storefront-outline"
      hint="Next integration: products, categories, product details, cart, and checkout flow."
      ctaLabel="Explore products"
    />
  );
}
