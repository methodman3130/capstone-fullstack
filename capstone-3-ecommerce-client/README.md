# Capstone 3 — E-Commerce Front End

A React single-page app for the Capstone 2 E-Commerce REST API. JWT authentication,
product CRUD, live search and filtering, role-based UI.

Built with **React 18 + Vite + Tailwind CSS v4 + React Router 6 + Axios**.

---

## Prerequisites

The API must be running first. See the `capstone-2-ecommerce-api` project.

```bash
# in the API folder
npm run dev      # http://localhost:5000
npm run seed     # optional: load 6 sample products
```

---

## Installation

```bash
cd capstone-2-ecommerce-client
npm install
```

Create a `.env` file in the project root:

```
VITE_API_URL=http://localhost:5000/api
```

Then:

```bash
npm run dev       # http://localhost:5173
npm run build     # production bundle into dist/
npm run preview   # serve the built bundle locally
```

> Vite only exposes variables that begin with `VITE_`. Naming it `API_URL`
> silently gives you `undefined` at runtime.

---

## Project Structure

```
src/
├── api/
│   ├── client.js          axios instance + JWT interceptors
│   ├── auth.js            register / login / me
│   └── products.js        product CRUD calls
├── components/
│   ├── ui.jsx             Button, Input, Badge, Spinner, EmptyState…
│   ├── Navbar.jsx
│   ├── ProductCard.jsx
│   ├── FilterBar.jsx
│   ├── Pagination.jsx
│   ├── ConfirmDialog.jsx
│   └── ProtectedRoute.jsx
├── context/
│   ├── AuthContext.jsx    session state, login/logout
│   └── ToastContext.jsx   notifications
├── hooks/
│   └── useDebounce.js
├── pages/
│   ├── ProductList.jsx    grid + search + filters + pagination
│   ├── ProductDetail.jsx
│   ├── ProductForm.jsx    create AND edit (one component, two modes)
│   ├── Login.jsx
│   ├── Register.jsx
│   └── NotFound.jsx
├── App.jsx                routes
├── main.jsx
└── index.css              Tailwind import + theme tokens
```

---

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Product list, search, filters | Public |
| `/products/:id` | Product detail | Public |
| `/products/new` | Create product | Logged in |
| `/products/:id/edit` | Edit product | Logged in |
| `/login` | Log in | Public |
| `/register` | Sign up | Public |
| `*` | 404 | Public |

---

## How Authentication Works

```
Register/Login  ──POST──▶  API returns { token, data: user }
                              │
                    token saved to localStorage
                              │
axios request interceptor attaches:  Authorization: Bearer <token>
                              │
        API's protect middleware verifies the signature
                              │
      401 back ──▶ response interceptor clears token + logs out
```

**On page reload,** `AuthContext` finds the stored token and calls `GET /api/auth/me`
to rebuild the session. It does *not* decode the token for user details — a JWT payload
is base64, not encrypted, and anyone can edit it. The server is the only source of truth.

**`ProtectedRoute` is a UX guard, not security.** Anyone can edit JavaScript in their
browser and reach `/products/new`. The real protection is `protect` and `authorize`
on the server, which is why the delete button being hidden and the API returning 403
are two separate, independent defences.

---

## Role-Based UI

| Action | Guest | User | Admin |
|--------|-------|------|-------|
| Browse and search products | ✅ | ✅ | ✅ |
| View product detail | ✅ | ✅ | ✅ |
| Create a product | ❌ | ✅ | ✅ |
| Edit a product | ❌ | ✅ | ✅ |
| Delete a product | ❌ | ❌ | ✅ |

The delete button only renders for admins — but if a non-admin forged the request
anyway, the API returns **403 Forbidden**, and the toast shows that message.

---

## Notable Implementation Details

**One axios instance with interceptors.** The base URL and the `Authorization`
header are defined once in `api/client.js`. No component builds a URL or attaches
a token by hand. The response interceptor also normalises every failure so components
can always read `error.message`, whether the API replied with JSON or the network died.

**Debounced search.** Typing "keyboard" would otherwise fire eight requests, one per
keystroke, and they can resolve out of order — the results for "keyb" overwriting the
results for "keyboard". `useDebounce` waits 400ms, and a `requestId` ref discards any
response that is no longer the latest.

**PATCH sends only what changed.** The edit form diffs the current values against the
values it loaded and sends just the difference. Sending the whole object would work,
but it would be a PUT wearing a PATCH costume.

**The zero problem, again.** Loading a product into the form uses `String(p.price)`,
not `p.price || ''`. A free product has `price: 0`, and `0 || ''` is `''` — the price
box would load empty and the user would "fix" it by accident. Validation compares
against `''` rather than using a falsy check, for the same reason the API uses
`price === undefined` instead of `!price`.

**Empty results are not errors.** A search with no matches renders an empty state, not
an error state — the API returned `200` with an empty array, which is correct.

---

## Demo Flow

1. `npm run seed` in the API folder → 6 products across 3 categories.
2. Open `http://localhost:5173` — products load without logging in.
3. Type in the search box; watch it debounce, then filter.
4. Click **Sign up**, create an account with role **admin**.
5. **Add product** → try submitting an empty form (client-side errors appear),
   then a negative price (blocked before it even reaches the API).
6. Create a product with **price 0 and stock 0** — it saves, proving the zero case.
7. Open a product → **Edit** → change only the price → the network tab shows a
   PATCH body containing only `{ "price": ... }`.
8. **Delete** → confirm dialog → product disappears.
9. Log out, log back in as a non-admin: the delete button is gone.

---

## Troubleshooting

| Problem | Likely reason | Check first |
|---------|---------------|-------------|
| "Cannot reach the API" | Server not running | `npm run dev` in the API folder, port 5000 |
| CORS error in console | Origin not allowed | `CLIENT_URL=http://localhost:5173` in the API's `.env` |
| `import.meta.env.VITE_API_URL` is undefined | Wrong prefix or no restart | Variable must start with `VITE_`; restart the dev server after editing `.env` |
| Logged out on every refresh | Token not persisted | Check `localStorage` for `capstone2_token`; private-mode windows block storage |
| 401 on every protected call | Token expired or missing | Log in again; check the `Authorization` header in the Network tab |
| 403 on delete | Account is not admin | Register a new account with role `admin` |
| Blank page after build | Router needs a fallback | Configure your host to rewrite all routes to `index.html` |

---

## Deployment Notes

The app is a static bundle (`npm run build` → `dist/`). Any static host works —
Netlify, Vercel, GitHub Pages — but the host must rewrite unknown paths to
`index.html`, or refreshing on `/products/abc123` returns a 404 from the host
before React Router ever sees it.

Set `VITE_API_URL` to your deployed API URL at build time, and add that deployed
front-end origin to `CLIENT_URL` in the API's environment.

> **Security note for the defense:** this app stores the JWT in `localStorage`,
> which is the standard bootcamp approach and is fine for a demo. It is readable by
> any JavaScript on the page, so a production app would prefer an httpOnly cookie.
> Know the trade-off — you may well be asked.
