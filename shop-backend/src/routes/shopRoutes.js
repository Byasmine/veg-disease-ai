const express = require('express');
const { requireAuth } = require('../middleware/auth');
const shop = require('../services/shopService');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'shop-backend' });
});

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await shop.getCategories();
    res.json(categories);
  } catch (e) {
    next(e);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const products = await shop.getProducts({
      categoryId: req.query.categoryId,
      q: req.query.q,
    });
    res.json(products);
  } catch (e) {
    next(e);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await shop.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product);
  } catch (e) {
    return next(e);
  }
});

router.get('/cart', requireAuth, async (req, res, next) => {
  try {
    const cart = await shop.getCart(req.user.id);
    res.json(cart);
  } catch (e) {
    next(e);
  }
});

router.post('/cart/items', requireAuth, async (req, res, next) => {
  try {
    const { productId, quantity } = req.body || {};
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    const cart = await shop.addCartItem(req.user.id, productId, quantity);
    return res.status(201).json(cart);
  } catch (e) {
    return next(e);
  }
});

router.patch('/cart/items/:itemId', requireAuth, async (req, res, next) => {
  try {
    const cart = await shop.updateCartItem(req.user.id, req.params.itemId, req.body?.quantity);
    res.json(cart);
  } catch (e) {
    next(e);
  }
});

router.delete('/cart/items/:itemId', requireAuth, async (req, res, next) => {
  try {
    const cart = await shop.removeCartItem(req.user.id, req.params.itemId);
    res.json(cart);
  } catch (e) {
    next(e);
  }
});

router.delete('/cart', requireAuth, async (req, res, next) => {
  try {
    const cart = await shop.clearCart(req.user.id);
    res.json(cart);
  } catch (e) {
    next(e);
  }
});

router.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const order = await shop.checkout(req.user.id, req.body?.paymentMethod, req.body?.shipping || {});
    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
});

router.get('/orders', requireAuth, async (req, res, next) => {
  try {
    const orders = await shop.getOrders(req.user.id);
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

router.get('/orders/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await shop.getOrderById(req.user.id, req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(order);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
