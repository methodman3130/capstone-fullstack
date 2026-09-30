const express = require('express');
const cors = require('cors');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

/* ------------------------------------------------------------------ *
 * MIDDLEWARE ORDER MATTERS. This is the #1 source of beginner bugs.
 *
 *   1. cors()            - allow browser clients
 *   2. express.json()    - parses the JSON body into req.body
 *   3. routes            - read req.body / req.params / req.query
 *   4. notFound          - nothing matched
 *   5. errorHandler      - LAST, catches everything passed to next(err)
 *
 * If express.json() runs AFTER your routes, req.body is undefined.
 * If errorHandler is registered BEFORE your routes, it never fires.
 * ------------------------------------------------------------------ */

// CLIENT_URL lets you lock CORS down to just your React app instead of "*".
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger - comment this out when it gets noisy.
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Health check / root
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-commerce API is running',
    docs: { auth: '/api/auth', products: '/api/products' },
  });
});

// Resource routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// 404 for unmatched routes, then the central error handler.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
