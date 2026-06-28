# Daykart: Multi-Vendor E-Commerce Platform

Daykart is a multi-vendor e-commerce platform built on the MERN stack. It includes caching, database seeding, a market basket recommendation engine (Apriori algorithm), and a responsive user interface with dark mode support.

## Live Deployments

- **Frontend Client (Vercel)**: [https://daykart.vercel.app](https://daykart.vercel.app)
- **Backend API (Render)**: [https://daykart-backend.onrender.com](https://daykart-backend.onrender.com)

---

## Local Development Setup

Follow these steps to run the application locally.

### 1. Prerequisites
You need Docker installed to spin up local database and caching containers. Run the following command to start MongoDB, Redis, and Mailhog:

```bash
docker-compose up -d
```

### 2. Environment Configurations
Create `.env` files in both the backend and frontend folders using the templates provided:
- **Backend**: Rename `backend/.env.example` to `backend/.env`
- **Frontend**: Rename `frontend/.env.example` to `frontend/.env`

### 3. Run the Backend Server
Open a terminal inside the `backend` directory and run:

```bash
npm install
npm run dev
```

*Note: On startup, the server automatically seeds the database with mock categories, brands, products, and default accounts if they are not already present.*

### 4. Run the Frontend Client
Open a separate terminal inside the `frontend` directory and run:

```bash
npm install
npm run dev
```

The storefront will be available at [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts for Testing

Use these pre-seeded accounts to sign in and test different user roles:

| Role | Email | Password | Description |
|---|---|---|---|
| **Super Admin** | `admin@daykart.com` | `AdminPassword123!` | Manages product approvals and verify sellers |
| **Seller** | `seller@daykart.com` | `SellerPassword123!` | Manages catalog items and bulk CSV imports |
| **Customer** | `customer@daykart.com` | `CustomerPassword123!` | Shop, add to bag, checkout, and apply coupons |
| **Delivery Partner** | `delivery@daykart.com` | `DeliveryPassword123!` | Manages delivery status of orders |

---

## Testing

To run the integration tests for verification and routes, make sure your local MongoDB container is running and execute the following inside the `backend` folder:

```bash
npm run test
```
