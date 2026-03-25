import axios, { AxiosInstance } from 'axios';
import { SHOP_API_BASE_URL } from '../config';
import type { ShopCart, ShopCategory, ShopOrder, ShopProduct } from '../types/shop';
import { getAccessToken } from './authSession';

const shopClient: AxiosInstance = axios.create({
  baseURL: `${SHOP_API_BASE_URL}/api/shop`,
  timeout: 30000,
  headers: { Accept: 'application/json' },
});

shopClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getShopCategories(): Promise<ShopCategory[]> {
  const { data } = await shopClient.get<ShopCategory[]>('/categories');
  return Array.isArray(data) ? data : [];
}

export async function getShopProducts(params?: { categoryId?: string; q?: string }): Promise<ShopProduct[]> {
  const { data } = await shopClient.get<ShopProduct[]>('/products', { params });
  return Array.isArray(data) ? data : [];
}

export async function getShopCart(): Promise<ShopCart> {
  const { data } = await shopClient.get<ShopCart>('/cart');
  return data;
}

export async function addShopCartItem(productId: string, quantity = 1): Promise<ShopCart> {
  const { data } = await shopClient.post<ShopCart>('/cart/items', { productId, quantity });
  return data;
}

export async function updateShopCartItem(itemId: string, quantity: number): Promise<ShopCart> {
  const { data } = await shopClient.patch<ShopCart>(`/cart/items/${itemId}`, { quantity });
  return data;
}

export async function removeShopCartItem(itemId: string): Promise<ShopCart> {
  const { data } = await shopClient.delete<ShopCart>(`/cart/items/${itemId}`);
  return data;
}

export async function clearShopCart(): Promise<ShopCart> {
  const { data } = await shopClient.delete<ShopCart>('/cart');
  return data;
}

export type CheckoutShippingPayload = {
  shippingName?: string;
  shippingPhone?: string;
  shippingLine1?: string;
  shippingLine2?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
};

export async function checkoutShop(
  paymentMethod = 'simulated-card',
  shipping?: CheckoutShippingPayload
): Promise<ShopOrder> {
  const { data } = await shopClient.post<ShopOrder>('/checkout', { paymentMethod, shipping });
  return data;
}

export async function getShopOrders(): Promise<ShopOrder[]> {
  const { data } = await shopClient.get<ShopOrder[]>('/orders');
  return Array.isArray(data) ? data : [];
}
