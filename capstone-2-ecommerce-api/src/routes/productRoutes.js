const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const { protect, authorize } = require('../middleware/auth');

/**
 * This file is the API map. It should be readable at a glance.
 * All database logic lives in the controller.
 *
 * The URL says WHAT resource. The HTTP method says WHAT action.
 *
 * Access policy:
 *   Reads  (GET)              - public, anyone can browse the catalog
 *   Writes (POST/PATCH)       - any authenticated user
 *   Delete (DELETE)           - admin only
 *
 * Middleware runs left to right: protect sets req.user,
 * then authorize reads it. Swap that order and authorize sees undefined.
 */

// Collection: /api/products
router
  .route('/')
  .get(getProducts) // 200 - public
  .post(protect, createProduct); // 201 - requires login

// Single resource: /api/products/:id
router
  .route('/:id')
  .get(getProductById) // 200 / 400 / 404 - public
  .patch(protect, updateProduct) // 200 - requires login
  .delete(protect, authorize('admin'), deleteProduct); // 200 - admin only

module.exports = router;
