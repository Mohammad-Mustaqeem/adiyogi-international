# Adiyogi International 🛍️

A production-grade full-stack e-commerce platform built for a wholesale/retail business.
Features automatic PDF invoice generation, WhatsApp order notifications, and a full admin dashboard.

> ⚠️ This is a **forked & actively contributed** repository. I own the backend invoice system, 
> product card UI, and deployment pipeline.

---

## 🔥 Key Features

- **Product Catalog** — Browse products by collection with image CDN via ImageKit
- **Cart System** — Persistent cart using localStorage with real-time updates
- **Order Flow** — Checkout → auto PDF invoice generated → WhatsApp notification sent to customer & admin
- **Admin Dashboard** — JWT-protected panel to manage products, collections, and orders
- **WhatsApp Automation** — Baileys-powered WhatsApp Web integration with auto-reconnect (5 retries)
- **Dockerized** — Full Docker + docker-compose setup for production deployment via Coolify

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Axios |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Auth | JWT (JSON Web Tokens) |
| PDF | PDFKit — auto invoice generation |
| WhatsApp | Baileys library — WhatsApp Web automation |
| CDN | ImageKit — product & collection images |
| DevOps | Docker, docker-compose, Coolify, Nginx |

---

## 🏗 Architecture
adiyogi-international/
├── frontend/          # React + Vite app
│   └── src/
│       ├── context/   # CartContext (localStorage persistence)
│       ├── pages/     # Home, Product, Checkout, OrderSuccess, Admin
│       └── api.js     # Axios instance with JWT interceptor
├── backend/
│   └── src/
│       ├── models/    # Product, Order, Admin, Collection (Mongoose)
│       ├── routes/    # /api/products, /api/orders, /api/collections, /api/admin
│       ├── services/  # whatsapp.js — Baileys WhatsApp automation
│       └── utils/     # generateInvoicePDF.js — PDFKit invoice engine
└── docker-compose.yml

---

## ⚙️ Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB
- Docker (for production)

### Local Development

```bash
# Backend
cd backend
cp .env.example .env   # Fill in your env vars
npm run dev            # Starts on :5001

# Frontend
cd frontend
npm run dev            # Starts on :5173 (proxies /api to backend)
```

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/adiyogi
JWT_SECRET=your_strong_secret
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5001
ADMIN_WHATSAPP=91XXXXXXXXXX
WHATSAPP_ENABLED=false
IMAGEKIT_PUBLIC_KEY=your_key
IMAGEKIT_PRIVATE_KEY=your_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

### Production (Docker)

```bash
docker-compose up -d
```

---

## 📋 Order Flow

Customer browses → adds to cart → fills checkout form
→ Backend creates order (ADI-XXXX format)
→ PDFKit generates invoice → saved to /uploads/invoices
→ Baileys sends WhatsApp to customer + admin
→ Order success page with invoice download link

---

## 🔐 Admin Flow

1. First-time setup: `POST /api/admin/setup` (only works if no admin exists)
2. Login returns JWT token
3. Manage products, collections, orders via protected routes
4. WhatsApp activation by scanning QR code

---

## My Contributions

- Built invoice PDF generation system (`utils/generateInvoicePDF.js`)
- Implemented product card UI and collection browsing
- Fixed deployment configuration for Coolify/Docker proxy
- Database pool optimization (`maxPoolSize` config)
- Address validation and form cleanup

---

## 📄 License

Private client project — forked for contribution purposes.
