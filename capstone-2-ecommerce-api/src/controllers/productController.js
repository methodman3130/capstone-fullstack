const Product = require('../models/Product');

/**
 * Escapes regex metacharacters so a search for "(sale)" does not
 * crash or behave like a regular expression.
 */
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Small helper for consistent 400 responses.
 */
function badRequest(res, message, errors) {
  return res.status(400).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

/**
 * @desc    Create a product
 * @route   POST /api/products
 * @access  Public
 * @success 201 Created
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, imageUrl, isActive } = req.body || {};

    // Guard against express.json() not running, or an empty body being sent.
    if (!req.body || Object.keys(req.body).length === 0) {
      return badRequest(
        res,
        'Request body is empty. Send raw JSON and set Content-Type: application/json.'
      );
    }

    // NOTE: price === undefined, not !price.
    // 0 is a legitimate price (a freebie) and 0 is a legitimate stock (sold out),
    // but both are falsy in JavaScript. !price would wrongly reject them.
    const missing = [];
    if (name === undefined || String(name).trim() === '') missing.push('name');
    if (description === undefined || String(description).trim() === '') missing.push('description');
    if (price === undefined) missing.push('price');
    if (category === undefined || String(category).trim() === '') missing.push('category');
    if (stock === undefined) missing.push('stock');

    if (missing.length > 0) {
      return badRequest(res, `Missing required field(s): ${missing.join(', ')}`, missing);
    }

    // Reject "1850abc" and true/null before they reach Mongoose,
    // so the client gets a precise message instead of a generic cast failure.
    if (typeof price !== 'number' || Number.isNaN(price)) {
      return badRequest(res, 'Price must be a number');
    }
    if (typeof stock !== 'number' || Number.isNaN(stock)) {
      return badRequest(res, 'Stock must be a number');
    }
    if (price < 0 || stock < 0) {
      return badRequest(res, 'Price and stock cannot be negative');
    }

    // Build the document explicitly instead of passing req.body straight through.
    // This is a whitelist: a client cannot inject _id, createdAt, or any
    // field you did not intend to accept.
    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      imageUrl,
      isActive,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List products, with optional search and filtering
 * @route   GET /api/products
 * @access  Public
 * @success 200 OK
 *
 * Supported query parameters:
 *   ?category=Accessories        exact category match (case-insensitive)
 *   ?search=wireless             keyword match on name or description
 *   ?minPrice=100&maxPrice=2000  price range
 *   ?isActive=true               active/inactive products
 *   ?sort=price / -price / newest
 *   ?page=1&limit=10             pagination
 */
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, minPrice, maxPrice, isActive, sort, page, limit } = req.query;

    const filter = {};

    if (category) {
      // Anchored + case-insensitive so "accessories" matches "Accessories"
      // without matching "Accessories & More".
      filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    if (search) {
      const keyword = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: keyword }, { description: keyword }];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        const min = Number(minPrice);
        if (Number.isNaN(min)) return badRequest(res, 'minPrice must be a number');
        filter.price.$gte = min;
      }
      if (maxPrice !== undefined) {
        const max = Number(maxPrice);
        if (Number.isNaN(max)) return badRequest(res, 'maxPrice must be a number');
        filter.price.$lte = max;
      }
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const sortMap = {
      price: { price: 1 },
      '-price': { price: -1 },
      name: { name: 1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };
    const sortBy = sortMap[sort] || { createdAt: -1 };

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const skip = (pageNumber - 1) * pageSize;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortBy).skip(skip).limit(pageSize),
      Product.countDocuments(filter),
    ]);

    // An empty result is still a successful request: 200 with an empty array,
    // never 404. 404 means "this URL/resource does not exist".
    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize) || 1,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 * @success 200 OK
 * @error   400 invalid ID format, 404 not found
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    // A malformed ObjectId throws a CastError here; the central
    // error handler turns it into a clean 400.
    next(error);
  }
};

/**
 * @desc    Partially update a product
 * @route   PATCH /api/products/:id
 * @access  Public
 * @success 200 OK
 *
 * PATCH is partial by design: send only the fields you want to change.
 * Fields you omit must stay exactly as they were.
 */
exports.updateProduct = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return badRequest(
        res,
        'Request body is empty. Send at least one field to update as raw JSON.'
      );
    }

    // Whitelist of fields a client is allowed to change.
    const allowedFields = [
      'name',
      'description',
      'price',
      'category',
      'stock',
      'imageUrl',
      'isActive',
    ];

    const updates = {};
    const rejected = [];

    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key)) {
        updates[key] = value;
      } else {
        rejected.push(key);
      }
    }

    if (rejected.length > 0) {
      return badRequest(
        res,
        `Field(s) not updatable: ${rejected.join(', ')}`,
        rejected
      );
    }

    if (Object.keys(updates).length === 0) {
      return badRequest(res, 'No valid fields provided to update');
    }

    // Again: === undefined, so { "price": 0 } and { "stock": 0 } are
    // treated as real updates rather than as "field not sent".
    if (updates.price !== undefined) {
      if (typeof updates.price !== 'number' || Number.isNaN(updates.price)) {
        return badRequest(res, 'Price must be a number');
      }
      if (updates.price < 0) {
        return badRequest(res, 'Price cannot be negative');
      }
    }

    if (updates.stock !== undefined) {
      if (typeof updates.stock !== 'number' || Number.isNaN(updates.stock)) {
        return badRequest(res, 'Stock must be a number');
      }
      if (updates.stock < 0) {
        return badRequest(res, 'Stock cannot be negative');
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true, // return the document AFTER the update, not before
      runValidators: true, // WITHOUT this, schema rules are skipped on update
      context: 'query', // needed for custom/conditional validators to run correctly
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Public
 * @success 200 OK
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted',
      data: { id: product._id },
    });
  } catch (error) {
    next(error);
  }
};
