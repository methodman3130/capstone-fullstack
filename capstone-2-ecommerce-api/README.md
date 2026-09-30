# Capstone 2 — E-Commerce REST API

A RESTful product management API built with Node.js, Express, MongoDB, and Mongoose.
Supports full product CRUD, keyword search, category filtering, schema validation,
JWT authentication with role-based access control, and consistent JSON error handling.

A React + Tailwind front end for this API lives in `capstone-2-ecommerce-client`.

---

## Technologies

- **Node.js** — runtime
- **Express.js** — HTTP server and routing
- **MongoDB** — database
- **Mongoose** — ODM and schema validation
- **jsonwebtoken** — JWT signing and verification
- **bcryptjs** — password hashing
- **dotenv** — environment variables
- **cors** — cross-origin access for browser clients
- **nodemon** — auto-restart in development
- **Postman** — API testing

---

## Project Structure

```
capstone-2-ecommerce-api/
├── src/
│   ├── config/
│   │   └── db.js                  MongoDB connection
│   ├── controllers/
│   │   ├── productController.js   Product business logic
│   │   └── authController.js      Register, login, current user
│   ├── middleware/
│   │   ├── auth.js                protect (JWT) + authorize (roles)
│   │   ├── errorHandler.js        Central error handler (must be last)
│   │   └── notFound.js            JSON 404 for unmatched routes
│   ├── models/
│   │   ├── Product.js             Mongoose schema + validation
│   │   └── User.js                Users, bcrypt hashing, roles
│   ├── routes/
│   │   ├── productRoutes.js       The product API map
│   │   └── authRoutes.js          The auth API map
│   ├── utils/
│   │   └── generateToken.js       Signs the JWT
│   ├── app.js                     Express app (middleware + routes)
│   └── server.js                  Env, DB connection, port
├── postman/
│   └── MSTCONNECT-Capstone-2-API.postman_collection.json
├── .env                           NEVER COMMITTED
├── .env.example                   Placeholders only
├── .gitignore
├── package.json
└── README.md
```

---

## Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd capstone-2-ecommerce-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create your `.env` file** in the project root:

   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_long_random_secret_here
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```

   Generate a real secret — do not type `secret123`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Copy `.env.example` as a starting point. Never commit the real `MONGO_URI`
   or `JWT_SECRET`. Anyone holding your `JWT_SECRET` can forge a valid admin token.

4. **Run the server**

   ```bash
   npm run dev     # development, auto-restarts on save
   npm start       # production
   ```

   You should see:

   ```
   MongoDB connected: <host>
   Server running on port 5000
   ```

---

## Base URL

```
http://localhost:5000
```

---

## Response Format

Every response — success or failure — uses the same envelope, so a front end never
has to guess at the shape.

**Success**

```json
{
  "success": true,
  "data": { }
}
```

**Failure**

```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## Status Codes

| Code | Meaning | When it is returned |
|------|---------|---------------------|
| 200 | OK | GET, PATCH, DELETE succeeded |
| 201 | Created | POST created a new product or account |
| 400 | Bad Request | Missing/invalid input, malformed ID, negative price |
| 401 | Unauthorized | No token, bad token, or expired token — *"I don't know who you are"* |
| 403 | Forbidden | Valid token, insufficient role — *"I know you, and you're not allowed"* |
| 404 | Not Found | Product or route does not exist |
| 500 | Server Error | Unexpected backend failure |

> 401 and 403 are different failures. Collapsing both into 401 is a common
> mistake and a fair question at defense.

---

## Authentication

This API uses **JWT (JSON Web Token)** bearer authentication.

```
POST /api/auth/register  or  /api/auth/login
        │
        ▼
{ "success": true, "token": "eyJhbGci...", "data": { user } }
        │
        ▼
Send it on every protected request:
        Authorization: Bearer eyJhbGci...
```

| Method | Endpoint | Purpose | Access | Success |
|--------|----------|---------|--------|---------|
| POST | `/api/auth/register` | Create an account, receive a token | Public | 201 |
| POST | `/api/auth/login` | Exchange credentials for a token | Public | 200 |
| GET | `/api/auth/me` | Get the current user | Private | 200 |

### Register

`POST /api/auth/register`

```json
{
  "name": "Juan Dela Cruz",
  "email": "juan@example.com",
  "password": "secret123",
  "role": "admin"
}
```

`role` is optional and defaults to `"user"`. It is accepted here **only so you can
create an admin during the demo**. A real product never lets a client choose its own
role — that is instant privilege escalation. Remove it before production.

**Errors:** `400` — missing field, duplicate email, invalid email format,
password shorter than 6 characters.

### Login

`POST /api/auth/login`

```json
{ "email": "juan@example.com", "password": "secret123" }
```

**Errors:** `400` (missing field), `401` (wrong password *or* unknown email — the
message is deliberately identical for both, so an attacker cannot discover which
emails are registered).

### Get Current User

`GET /api/auth/me` — requires `Authorization: Bearer <token>`.

The front end calls this on page load to turn a stored token back into a session.

**Errors:** `401` — no token, malformed header, tampered signature, expired token,
or a valid token whose user has since been deleted.

---

## Access Control

| Endpoint | Guest | User | Admin |
|----------|-------|------|-------|
| `GET /api/products` | ✅ | ✅ | ✅ |
| `GET /api/products/:id` | ✅ | ✅ | ✅ |
| `POST /api/products` | ❌ 401 | ✅ | ✅ |
| `PATCH /api/products/:id` | ❌ 401 | ✅ | ✅ |
| `DELETE /api/products/:id` | ❌ 401 | ❌ 403 | ✅ |

Reads are public so the catalog can be browsed without an account. Writes require a
token. Deletes require the `admin` role.

```js
// Middleware runs left to right: protect sets req.user, authorize reads it.
// Swap the order and authorize sees undefined.
router.delete('/:id', protect, authorize('admin'), deleteProduct);
```

### Password Security

- Passwords are hashed with **bcrypt** (10 salt rounds) in a `pre('save')` hook.
- The hook checks `isModified('password')` — without it, every profile update would
  re-hash the already-hashed password and lock the user out.
- The schema sets `select: false` on `password`, so it is never returned by a normal
  query. Login asks for it explicitly with `.select('+password')`.
- Comparison uses `bcrypt.compare`, which is timing-safe. Never compare with `===`.

> A JWT payload is **base64-encoded, not encrypted**. Anyone can paste a token into
> jwt.io and read it. Never put a password or anything secret in the payload — the
> signature is what proves the token wasn't tampered with, not secrecy.

---

## Product Endpoints

| Method | Endpoint | Purpose | Access | Success |
|--------|----------|---------|--------|---------|
| POST | `/api/products` | Create a product | Private | 201 |
| GET | `/api/products` | List / search / filter products | Public | 200 |
| GET | `/api/products/:id` | View one product | Public | 200 |
| PATCH | `/api/products/:id` | Partially update a product | Private | 200 |
| DELETE | `/api/products/:id` | Delete a product | Admin | 200 |

---

### Create Product

`POST /api/products`

**Purpose:** Create a product.

**Body:**

```json
{
  "name": "Mechanical Keyboard",
  "description": "RGB mechanical keyboard with hot-swappable switches",
  "price": 1850,
  "category": "Accessories",
  "stock": 12
}
```

Optional fields: `imageUrl` (string), `isActive` (boolean, defaults to `true`).

**Success:** `201 Created`

```json
{
  "success": true,
  "message": "Product created",
  "data": {
    "_id": "66f1c2a9e1b2c3d4e5f60789",
    "name": "Mechanical Keyboard",
    "description": "RGB mechanical keyboard with hot-swappable switches",
    "price": 1850,
    "category": "Accessories",
    "stock": 12,
    "imageUrl": "",
    "isActive": true,
    "createdAt": "2026-09-29T02:14:31.442Z",
    "updatedAt": "2026-09-29T02:14:31.442Z"
  }
}
```

**Possible errors:** `400 Bad Request` — missing required field, non-numeric price or
stock, negative price or stock, empty body.

---

### List Products

`GET /api/products`

**Purpose:** List products, with optional search and filtering. All filtering happens
on this one route through query parameters — do not create a separate route per filter.

**Query parameters:**

| Parameter | Example | Effect |
|-----------|---------|--------|
| `category` | `?category=Accessories` | Exact category match, case-insensitive |
| `search` | `?search=wireless` | Keyword match on name or description |
| `minPrice` | `?minPrice=500` | Price at or above |
| `maxPrice` | `?maxPrice=2000` | Price at or below |
| `isActive` | `?isActive=true` | Active or inactive products only |
| `sort` | `?sort=price` | `price`, `-price`, `name`, `newest`, `oldest` |
| `page` | `?page=2` | Page number (default 1) |
| `limit` | `?limit=10` | Items per page (default 50, max 100) |

Parameters combine: `?category=Accessories&search=wireless&sort=price`

**Success:** `200 OK`

```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "pages": 1,
  "data": [ ]
}
```

> A search that matches nothing returns `200` with an empty `data` array — **not 404**.
> The collection exists; it just has no matching members.

---

### View Product by ID

`GET /api/products/:id`

**Purpose:** Retrieve one product.

**Success:** `200 OK`

**Possible errors:**

- `400 Bad Request` — `:id` is not a valid MongoDB ObjectId (e.g. `/api/products/abc`)
- `404 Not Found` — well-formed ID, but no product owns it

---

### Update Product

`PATCH /api/products/:id`

**Purpose:** Partially update a product. Send only the fields you want to change;
omitted fields keep their current values.

**Body:**

```json
{
  "price": 1700,
  "stock": 8
}
```

**Success:** `200 OK` — returns the product *after* the update.

**Possible errors:** `400` (invalid ID, negative/non-numeric values, empty body,
field not updatable), `404` (product does not exist).

Updatable fields: `name`, `description`, `price`, `category`, `stock`, `imageUrl`,
`isActive`. Anything else is rejected with `400`.

---

### Delete Product

`DELETE /api/products/:id`

**Purpose:** Permanently remove a product.

**Success:** `200 OK`

```json
{
  "success": true,
  "message": "Product deleted",
  "data": { "id": "66f1c2a9e1b2c3d4e5f60789" }
}
```

**Possible errors:** `400` (invalid ID), `404` (product does not exist).

---

## Search / Filter Examples

```
GET /api/products
GET /api/products?category=Accessories
GET /api/products?search=mouse
GET /api/products?category=Accessories&search=wireless
GET /api/products?minPrice=500&maxPrice=2000&sort=price
```

---

## Validation Rules

| Field | Rules |
|-------|-------|
| `name` | Required, trimmed, 2–120 characters |
| `description` | Required, trimmed, max 1000 characters |
| `price` | Required, number, minimum 0 |
| `category` | Required, trimmed |
| `stock` | Required, whole number, minimum 0 |
| `imageUrl` | Optional string |
| `isActive` | Optional boolean, defaults to `true` |

`timestamps: true` adds `createdAt` and `updatedAt` automatically.

Updates run with `{ new: true, runValidators: true }`. Without `runValidators`,
Mongoose skips schema rules on update and a negative price would save silently.

---

## Testing

A complete Postman collection is included at:

```
postman/MSTCONNECT-Capstone-2-API.postman_collection.json
```

**To use it:**

1. Postman → **Import** → select that file.
2. The collection variable `baseUrl` is already set to `http://localhost:5000`.
3. Run **Create Product** first — it saves the new `_id` into the `productId`
   variable automatically, so View / Update / Delete work without copy-pasting IDs.
4. Or open the **Collection Runner** and run the whole suite at once.

Every request has assertions attached, including the failure cases.

### CRUD proof chain

```
POST /api/products          -> 201, copy the _id
GET  /api/products/:id      -> 200
PATCH /api/products/:id     -> 200
GET  /api/products/:id      -> 200, changed fields differ, others unchanged
DELETE /api/products/:id    -> 200
GET  /api/products/:id      -> 404
```

### Failure cases covered

| Test | Request | Expected |
|------|---------|----------|
| Missing required field | POST without `name` | 400 |
| Negative price | POST/PATCH `price: -500` | 400 |
| Malformed ID | GET `/api/products/abc` | 400 |
| Missing product | GET valid but nonexistent ID | 404 |
| Delete missing product | DELETE nonexistent ID | 404 |
| Empty PATCH body | PATCH `{}` | 400 |
| Unknown route | GET `/api/nothing-here` | 404 JSON |
| Price of 0 | POST `price: 0, stock: 0` | **201** — zero is valid |
| No token | POST a product with no header | 401 |
| Invalid token | GET `/api/auth/me` with garbage token | 401 |
| Expired token | Any protected route | 401 |
| Non-admin delete | DELETE with a `user` token | **403**, not 401 |
| Wrong password | POST login, bad password | 401 |
| Duplicate email | POST register, existing email | 400 |

---

## Notable Implementation Details

**`price === undefined`, not `!price`.** JavaScript treats `0` as falsy, so a check
like `if (!price)` would reject a free product as "missing a price". Checking
`=== undefined` distinguishes *not sent* from *the number zero*. Same for `stock: 0`
on a sold-out item.

**Field whitelisting.** Create and update build the document from named fields rather
than passing `req.body` straight through, so a client cannot inject `_id`, `createdAt`,
or any field the schema did not intend to accept.

**Middleware order.** `express.json()` is registered before the routes (otherwise
`req.body` is `undefined`); `errorHandler` is registered after them (otherwise it
never fires).

**Regex escaping in search.** Search terms are escaped before becoming a regular
expression, so a query like `?search=(sale)` cannot crash the endpoint.

---

## Security

- `.env` is listed in `.gitignore` and is never committed.
- `.env.example` contains placeholder values only.
- No connection strings, passwords, secrets, or tokens appear anywhere in source or docs.
- Passwords are bcrypt-hashed and never returned in any response.
- `JWT_SECRET` must be a long random string — anyone who has it can forge an admin token.
- CORS is restricted to `CLIENT_URL` rather than left open to `*`.

Before your first push:

```bash
git status          # confirm .env is NOT staged
git check-ignore .env   # should print: .env
```

---

## Git Workflow

```bash
git init
git status
git add .
git status          # verify .env and node_modules are absent
git commit -m "Build product REST API with validation"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

---

## Troubleshooting

| Problem | Likely reason | Check first |
|---------|---------------|-------------|
| `req.body` is undefined | JSON middleware or body type | `app.use(express.json())` runs before routes; Postman set to Body → raw → JSON |
| Cannot GET /api/products | Route mount or path mismatch | `app.use('/api/products', productRoutes)` and the router's own paths |
| MongoDB connection failed | URI, credentials, or network | `MONGO_URI` value and Atlas IP allowlist |
| CastError | Malformed ObjectId | The ID in the URL |
| Validation not working on PATCH | Missing update validation | `runValidators: true` in `findByIdAndUpdate` |
| Port already in use | Another server process | Stop the old process or change `PORT` |
| CORS browser error | Cross-origin restriction | `CLIENT_URL` matches your React dev server exactly |
| 401 on every protected route | Missing or malformed header | Header must be `Authorization: Bearer <token>` — the space matters |
| `secretOrPrivateKey must have a value` | `JWT_SECRET` not loaded | It is in `.env`, and `dotenv.config()` runs first in `server.js` |
| 403 instead of 200 on delete | Account role is `user` | Register a new account with `"role": "admin"` |
| Token works then suddenly 401 | Token expired | Log in again; `JWT_EXPIRES_IN` controls the lifetime |
| Login always fails | `select: false` on password | Login must use `.select('+password')` |

**Debugging routine**

1. Read the terminal stack trace — the top line names the file and line.
2. Confirm the server and MongoDB are both running.
3. Verify the request method and URL.
4. Verify headers and body format.
5. Temporarily log `req.params`, `req.query`, or `req.body`.
6. Test one endpoint at a time.
7. Change one thing, then retest the same request.

---

## Author

Built for MSTCONNECT PH — Session 11, Capstone 2.
