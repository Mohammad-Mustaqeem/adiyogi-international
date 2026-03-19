# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adiyogi International is a full-stack e-commerce platform for a wholesale/retail goods business. It has a React/Vite frontend and an Express.js/MongoDB backend. Key features include product catalog browsing, cart management, order placement with automatic PDF invoice generation, and WhatsApp notifications to customers and admin.

## Commands

### Backend

```bash
cd backend
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
```

### Frontend

```bash
cd frontend
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

> The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000` (backend). The backend `.env` has `PORT=5001` — verify these match.

## Architecture

### Backend (`backend/src/`)

The backend was recently reorganized from a flat structure into `backend/src/`. The entry point is `backend/server.js`, which connects to MongoDB, seeds the "New Arrivals" system collection if absent, and initializes the WhatsApp service.

- **Models:** `Product`, `Order`, `Admin`, `Collection` — all MongoDB/Mongoose schemas
- **Routes:** `/api/products`, `/api/orders`, `/api/collections`, `/api/admin`
- **Auth:** JWT middleware in `middleware/auth.js` — protects all admin write routes
- **Services:** `whatsapp.js` uses the Baileys library to send order notifications and PDF invoices via WhatsApp Web automation
- **Utils:** `generateInvoicePDF.js` creates PDF invoices using PDFKit, saved to `uploads/invoices/`

### Frontend (`frontend/src/`)

- **Routing:** React Router v6 in `App.jsx` — five main routes: `/`, `/product/:id`, `/checkout`, `/order-success`, `/admin`
- **State:** Cart state managed via React Context (`context/CartContext.jsx`), persisted to `localStorage` key `adiyogi_cart`
- **HTTP:** Axios instance in `api.js` with base URL `/api`; attaches JWT from `localStorage` key `adiyogi_admin_token`; clears token on 401
- **Styling:** Tailwind CSS with a custom theme — primary color navy `#1B3A6B`, accent gold `#C9A84C`, background ivory `#F7F4EF`; custom fonts Playfair Display + DM Sans via Google Fonts

### Key Workflows

**Customer order flow:** Browse → add to cart (localStorage) → checkout form (customer info, delivery address, payment mode) → server creates order, generates PDF invoice, sends WhatsApp notifications → order success page with invoice download.

**Admin flow:** First-time setup at `POST /api/admin/setup` (only works if no admin exists) → login returns JWT → manage products/collections/orders via protected routes → WhatsApp setup by scanning QR code.

### Environment Variables (backend/.env)

```
MONGODB_URI=mongodb://localhost:27017/adiyogi
JWT_SECRET=...
PORT=5001
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5001
ADMIN_WHATSAPP=91XXXXXXXXXX
WHATSAPP_ENABLED=false   # Set true to enable WhatsApp notifications
```

### Notable Patterns

- **Soft deletes:** Products and collections are marked `isActive: false`, not removed from the database.
- **System collections:** The "New Arrivals" collection has `isSystem: true` and cannot be deleted.
- **Product multi-collection:** Products hold an array of `Collection` ObjectIds.
- **Order IDs:** Auto-generated in the format `ADI-XXXX` (zero-padded sequential).
- **WhatsApp session:** Stored in `backend/wa_auth/`; the service handles reconnection with up to 5 retries.
- **File uploads:** Multer stores images in `backend/src/uploads/`; served statically at `/uploads`.
