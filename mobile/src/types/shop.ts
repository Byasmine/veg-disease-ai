export interface ShopCategory {
  id: string;
  name: string;
  description?: string;
}

export interface ShopProduct {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  currency?: string;
  imageUrl?: string;
}

export interface ShopCartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: ShopProduct;
}

export interface ShopCart {
  userId: string;
  items: ShopCartItem[];
  total: number;
  currency: string;
}

export interface ShopOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ShopOrder {
  id: string;
  userId: string;
  status: string;
  paymentMethod: string;
  items: ShopOrderItem[];
  total: number;
  currency: string;
  createdAt: string;
}
