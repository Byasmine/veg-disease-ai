import axios, { AxiosInstance } from 'axios';
import { SHOP_API_BASE_URL } from '../config';
import type { ShopCart, ShopCategory, ShopOrder, ShopProduct } from '../types/shop';

const DEMO_USER_ID = 'demo_user_mobile';

const shopClient: AxiosInstance = axios.create({
  baseURL: `${SHOP_API_BASE_URL}/api/shop`,
  timeout: 30000,
  headers: { Accept: 'application/json' },
});

function authHeader(userId: string = DEMO_USER_ID) {
  return { 'x-user-id': userId };
}

export async function getShopCategories(): Promise<ShopCategory[]> {
  const { data } = await shopClient.get<ShopCategory[]>('/categories');
  return Array.isArray(data) ? data : [];
}

export async function getShopProducts(params?: { categoryId?: string; q?: string }): Promise<ShopProduct[]> {
  const { data } = await shopClient.get<ShopProduct[]>('/products', { params });
  return Array.isArray(data) ? data : [];
}

export async function getShopCart(userId?: string): Promise<ShopCart> {
  const { data } = await shopClient.get<ShopCart>('/cart', { headers: authHeader(userId) });
  return data;
}

export async function addShopCartItem(productId: string, quantity = 1, userId?: string): Promise<ShopCart> {
  const { data } = await shopClient.post<ShopCart>(
    '/cart/items',
    { productId, quantity },
    { headers: authHeader(userId) }
  );
  return data;
}

export async function updateShopCartItem(itemId: string, quantity: number, userId?: string): Promise<ShopCart> {
  const { data } = await shopClient.patch<ShopCart>(
    `/cart/items/${itemId}`,
    { quantity },
    { headers: authHeader(userId) }
  );
  return data;
}

export async function removeShopCartItem(itemId: string, userId?: string): Promise<ShopCart> {
  const { data } = await shopClient.delete<ShopCart>(`/cart/items/${itemId}`, {
    headers: authHeader(userId),
  });
  return data;
}

export async function clearShopCart(userId?: string): Promise<ShopCart> {
  const { data } = await shopClient.delete<ShopCart>('/cart', { headers: authHeader(userId) });
  return data;
}

export async function checkoutShop(paymentMethod = 'simulated-card', userId?: string): Promise<ShopOrder> {
  const { data } = await shopClient.post<ShopOrder>(
    '/checkout',
    { paymentMethod },
    { headers: authHeader(userId) }
  );
  return data;
}

export async function getShopOrders(userId?: string): Promise<ShopOrder[]> {
  const { data } = await shopClient.get<ShopOrder[]>('/orders', { headers: authHeader(userId) });
  return Array.isArray(data) ? data : [];
}
