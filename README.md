# Daykart: Multi-Vendor E-Commerce Platform

Daykart is an enterprise-ready, high-performance, and secure e-commerce platform built on the MERN stack with Redis caching and Elasticsearch. 

It features sub-5ms session/PDP caching response layers, full-text fuzzy catalog searching, automated database seeding, an Apriori Market Basket bundle recommendation engine, and custom modern styling (slate-cyan theme with glassmorphism overlays and dark mode support).

---

## How to Run the Code (Local Development)

### 1. Prerequisite Services
Ensure you have Docker installed and running. Start the local MongoDB, Redis, Elasticsearch, and Mailhog services by running:
```bash
docker-compose up -d
```

### 2. Configure Environment Files
Copy the templates to `.env` files in both directories:
- **Backend**: Rename `backend/.env.example` to `backend/.env`
- **Frontend**: Rename `frontend/.env.example` to `frontend/.env`

### 3. Initialize & Start Backend
Open a terminal in the `backend` folder and run:
```bash
npm install
npm run dev
```
*Note: On startup, the database auto-seeding service detects if collections are blank and automatically imports mock categories, premium brands, sample products with variants, and default user accounts.*

### 4. Initialize & Start Frontend Next.js client
Open another terminal in the `frontend` folder and run:
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser to browse the storefront.

---

## Pre-Seeded Accounts for Testing

| Role | Email | Password | Details |
|---|---|---|---|
| **Super Admin** | `admin@daykart.com` | `AdminPassword123!` | Manages product approvals and merchant verification |
| **Seller** | `seller@daykart.com` | `SellerPassword123!` | Manages catalog items and imports bulk CSV lists |
| **Customer** | `customer@daykart.com` | `CustomerPassword123!` | Shop, add to bag, apply coupons, checkout |
| **Delivery Partner** | `delivery@daykart.com` | `DeliveryPassword123!` | Manages assigned parcels and updates ship statuses |

---

## Running Automated Integration Tests

To verify auth routes and database sanitizations:
1. Ensure the local MongoDB container is active.
2. Inside the `backend` folder, run:
```bash
npm run test
```

---

## Required Production Tools & Services (Production Checklist)

To move Daykart from this local sandbox into a live production website, you will need the following tools, accounts, and subscriptions:

### 1. Domain & DNS
- **Domain Name**: Purchase a domain (e.g., `daykart.com`) via a registrar like GoDaddy, Namecheap, or AWS Route 53.
- **SSL Certificate**: Set up a free wildcard SSL certificate via Let's Encrypt Certbot or purchase one through a CA to ensure all endpoints use HTTPS (`https://api.daykart.com`).

### 2. Managed Databases & Cache (Scalability)
- **MongoDB Atlas**: Upgrade from local database to a managed MongoDB Atlas Cluster (M10 or higher) for automatic backups, scaling, and replica sets.
- **Redis Enterprise Cloud or AWS ElastiCache**: Set up a managed Redis instance to run caching servers with automatic failover.
- **Elasticsearch (Elastic Cloud)**: Set up a cluster on Elastic Cloud (or AWS OpenSearch) to host product search indexes.

### 3. Cloud Storage (Media Uploads)
- **AWS S3 Bucket**: Create an S3 bucket and obtain `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_S3_BUCKET_NAME` to store product images, seller store banners, and review videos.
- **CDN (Content Delivery Network)**: Connect Cloudflare or AWS CloudFront to your S3 bucket to serve product media instantly with edge-caching.

### 4. Transactional E-mail Service
- **SMTP Provider**: Swap out the development sandbox Mailhog container for a production email delivery service such as **Resend**, **SendGrid**, **Mailgun**, or **AWS SES**. You will need to verify your domain DNS records (SPF, DKIM) to ensure verification OTP emails don't hit spam folder.

### 5. Payment Gateway Merchant Accounts
- **Stripe, Razorpay, & PayPal Developer Accounts**: Register active merchant accounts to get production API keys.
- **Webhook Subscriptions**: Register your API webhook URL (e.g., `https://api.daykart.com/api/v1/orders/webhook`) in the payment dashboards to receive automatic payment completion payloads.

### 6. Social Sign-In Credentials
- **Google Cloud Console**: Set up an OAuth 2.0 Client ID and client secret to activate Google Login.

### 7. Hosting & CI/CD Pipelines
- **Compute Servers**: Deploy backend Docker containers on AWS EC2, AWS ECS (Fargate), or DigitalOcean Droplets.
- **Frontend Hosting**: Deploy the Next.js frontend on Vercel or AWS Amplify for global speed.
- **CI/CD pipeline**: Link GitHub repository with GitHub Actions to automate build checks and container deployments on push events.
