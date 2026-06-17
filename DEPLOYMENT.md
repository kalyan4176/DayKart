# Daykart Platform Architecture & Production Deployment Guide

This document contains instructions for configuring, securing, and deploying the **Daykart Multi-Vendor E-Commerce Platform** under high-traffic production workloads.

---

## 1. System ER Diagram Description

The data relations are implemented in MongoDB schemas inside `backend/src/models/`:

* **User & Seller (1:1/1:N)**: A base User document has credentials. If the user joins as a vendor, a matching `Seller` document is created storing bank accounts, GSTIN, PAN, and store revenue data.
* **Product Catalog (N:1)**: Products are owned by a `Seller`, referencing a hierarchical `Category` tree (supporting nested child links) and a manufacturer `Brand`.
* **Checkout Flow (1:N:1)**: An `Order` tracks checking out multiple products from different vendors in a single list. The payment gateway assigns a unified internal `Payment` transaction record for status hooks and auditing.
* **Coupons (N:1)**: Active promotions discount orders, restricted by expiration dates, total usage counts, and individual shopper limits.
* **Reviews (N:1)**: Customers post ratings and text reviews. Purchase validation checks ensure only buyers who have a `'delivered'` order for a product can get the verified purchaser badge.

---

## 2. Docker Setup

To orchestrate local testing services, run:
```bash
docker-compose up -d
```

For production deployments, the backend and frontend include standalone Dockerfile specifications:

### Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/server.js"]
```

### Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 3. Nginx Reverse Proxy Config

Place this Nginx configuration inside `/etc/nginx/sites-available/daykart` to route client queries, apply Gzip compression, and enforce SSL requirements:

```nginx
server {
    listen 80;
    server_name daykart.com www.daykart.com;
    return 301 https://$server_name$request_uri; # Redirect HTTP to HTTPS
}

server {
    listen 443 ssl http2;
    server_name daykart.com;

    ssl_certificate /etc/letsencrypt/live/daykart.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/daykart.com/privkey.pem;

    # Gzip Compression
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;

    # Frontend Next.js Client
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend Express API Server
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 4. Redis Caching Architecture

To achieve zero lags, we use Redis for three primary categories of data:
1. **User Authentication Sessions**: Checked in `/middlewares/auth.js` to skip MongoDB queries on every request. Session keys are formatted as `user:${userId}` (15-min expiration).
2. **Product Detail Pages (PDP)**: Cached under `product:detail:${productId}` (10-min expiration) to bypass heavy DB lookups. Cleared instantly on seller edits or moderation approvals.
3. **Trending Products**: Cached under `trending:products` (2-hour expiration), calculated using a weekly sales aggregation pipeline over the Order collection.

---

## 5. Security Hardening Checklist

* [x] **Secure JWT Storage**: Cookies configured with `HttpOnly`, `Secure`, and `SameSite=Strict` flags.
* [x] **Express rate limiters**: 150 requests per 15 mins globally, and a strict limit of 15 attempts for auth/login paths.
* [x] **Helmet middleware**: Enforces secure CSP headers and restricts cross-origin resources.
* [x] **MongoDB Sanitize**: `express-mongo-sanitize` sanitizes inputs against NoSQL injections.
* [x] **Audit Logging**: Logs all high-privilege operations (price modifications, seller registrations, checkout actions) to an `AuditLog` collection.

---

## 6. Performance Optimization Checklist (100k+ Users)

* [x] **Database Indexing**: Compound query indices configured on Product (`category + status + price`) and Order (`customer + status`).
* [x] **Search Autocomplete Offloading**: High-frequency keyword lookups offloaded to Elasticsearch fuzzy analyzers.
* [x] **Market Basket Rules Caching**: Apriori calculations run on a weekly interval and results are cached as a single rule-array inside Redis.
* [x] **Local Storage Media fallback**: Configured to prevent cloud upload timeouts from locking request threads.
