# Daykart Platform Architecture & Product Specifications

Daykart is a production-ready, high-performance **Multi-Vendor E-Commerce Marketplace**. The platform coordinates seamless interactions between four distinct user roles: **Administrators**, **Sellers/Vendors**, **Customers**, and **Delivery Partners**. 

This document outlines the system architecture, technology stack, unique selling points (USPs), database metrics, rate-limiting limits, and API specifications.

---

## 1. System Technology Stack

The platform is designed around a decoupled, service-oriented architecture:

| Tier | Component | Technology / Library | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | Core Framework | `Next.js` (App Router) | Client interface & server-side rendering |
| | Render Engine | `React` | Declarative UI component library |
| | State Management | `Redux Toolkit` & `React-Redux` | Global store, caching, and RTK Query requests |
| | Styling Engine | `TailwindCSS` | Responsive utility-first style sheet compilation |
| | Iconography | `Lucide React` | High-quality vector interface icons |
| | Animations | `Framer Motion` | Fluid micro-interactions and sliding panels |
| **Backend** | Server Runtime | `Node.js` (LTS) | Fast, asynchronous JavaScript runtime |
| | API Framework | `Express.js` | REST endpoint routing and middleware stack |
| | Primary Database | `MongoDB` & `Mongoose` | Document database for transactional datasets |
| | Cache Layer | `Redis` | In-memory key-value database for caches & sessions |
| | Search Core | `Elasticsearch` | Fuzzy text catalog indexing and autocomplete searches |
| **Integrations** | Authentication | `Google Identity Services` | Secure client OAuth Google Login popup |
| | Image Hosting | `Cloudinary` / `AWS S3` | Media content delivery networks (CDNs) |
| | Notifications | `Server-Sent Events` (SSE) | Real-time event streaming directly to clients |
| | Mail Sandbox | `Nodemailer` & `Mailhog` | Sandbox mail service for OTP code delivery |

---

## 2. Key Numeric Configurations & Metrics

The codebase defines exact parameters to manage security, caching, database seeding, and shipping:

### A. Authentication & Security Parameters
* **Verification OTP**: Exactly **6 digits** (e.g. `123456`) sent via Nodemailer.
* **JWT Access Token Expiry**: **`15m`** (15 minutes).
* **JWT Refresh Token Expiry**: **`7d`** (7 days) stored securely in HttpOnly browser cookies.
* **File Upload Limit**: Max size of **`5MB`** per image payload in `multer`.
* **Global Rate Limiter (Production)**: **1000 requests per 1 minute** per IP address.
* **Global Rate Limiter (Development)**: **5000 requests per 1 minute** per IP address.
* **Auth Endpoint Rate Limiter**: **150 login attempts per 15 minutes** per IP address.

### B. Seeding Defaults (Preloaded Resources)
* **Default User Accounts**: Exactly **4 accounts** pre-configured for testing:
  - Admin: `admin@daykart.com`
  - Seller: `seller@daykart.com`
  - Customer: `customer@daykart.com`
  - Delivery Partner: `delivery@daykart.com`
* **Default Product Categories**: Exactly **4 categories**:
  - `mobiles`
  - `laptops`
  - `fashion`
  - `home-kitchen`
* **Default Products**: Exactly **4 sample products** pre-loaded with Unsplash image links.
* **Default Promotional Slides**: Exactly **4 slideshow panels** displayed in the homepage carousel.

### C. Recommendation & Caching Metrics (Apriori Algorithm)
* **Minimum Support Rate ($MinSup$)**: **`0.02`** (2%). A product pair must appear in at least 2% of total transactions to be analyzed.
* **Minimum Confidence Rate ($MinConf$)**: **`0.20`** (20%). If product A is bought, there must be at least a 20% probability that product B is also bought.
* **Lift Threshold**: Must be **`> 1.0`** (verifies a positive correlation between items, filtering out random occurrences).

### D. Shipping Rates & Tiers
* **Cart Total $\le$ ₹150**: Delivery charge is **`₹50`**.
* **Cart Total ₹151 – ₹299**: Delivery charge is **`₹20`**.
* **Cart Total $\ge$ ₹300**: Delivery charge is **`₹0`** (Free Shipping).

### E. Financial & Referral Parameters
* **Referral Signup Reward**: **`₹50`** credited automatically to the referee's wallet upon account validation.
* **Coupon Limits**:
  - `DAYKART10`: **10% discount** (up to **₹1000**) on a minimum order of **₹500**. Max **2 usages** per user.
  - `FLAT500`: **Flat ₹500 discount** on a minimum order of **₹10000**. Max **1 usage** per user.

---

## 3. Unique Selling Points (USPs) & Specialties

1. **Market Basket Recommendation Engine (Apriori)**:
   The backend runs an Apriori association mining algorithm in the background on startup. It extracts shopping patterns from transactions, identifies item correlations, and caches them in Redis. The frontend displays these as dynamic **"Frequently Bought Together"** recommendations on the Product Detail Page (PDP).

2. **Self-Healing Referral System**:
   When users load their profile, a background check detects if they are missing a referral code. If so, it instantly generates a unique alphanumeric code, registers it in MongoDB, and flushes the Redis session cache. This self-healing fallback ensures zero database anomalies.

3. **Resilient Cross-Domain Session Management**:
   The logout endpoint clears cookies unconditionally. If a user tries to log out with an expired JWT access token, standard authentication middleware would block the request and return a 401 error, preventing the browser from receiving the cookie deletion headers. Daykart bypasses this by placing the logout route outside auth checks, ensuring session files are always cleared from the client's cache.

4. **Fuzzy Search & Autocomplete**:
   Daykart integrates Elasticsearch to perform fuzzy text searches (tolerating typos and spelling errors). If the Elasticsearch container goes offline, the system catches the connection error and falls back to MongoDB regex search queries, ensuring the website never crashes.

5. **Dynamic Wallet System**:
   Customers can purchase items using points from their store wallet. If a user cancels an order, the system processes refunds directly back into the wallet ledger instantly.

6. **Client-Side Invoice Generator**:
   Customers can click "Download Invoice" inside their order details to generate custom corporate PDFs locally in their browser using `jspdf` and `jspdf-autotable` layouts, saving server CPU resources.

---

## 4. API Endpoints Catalog

Here is the REST API blueprint of the platform:

### Authentication & Sessions (`/api/v1/auth`)
* `POST /register` - Registers a new user account.
* `POST /login` - Local email/password login (sets HttpOnly cookies).
* `POST /google-login` - Verifies Google OAuth JWT `idToken` against Google's OAuth API.
* `POST /verify-otp` - Verifies the 6-digit signup OTP.
* `POST /logout` - Clears session cookies unconditionally.
* `POST /refresh-token` - Silently regenerates access tokens using refresh cookies.

### User Profiles & Accounts (`/api/v1/users`)
* `GET /profile` - Fetches user profile data (triggers self-healing referral check).
* `PATCH /profile` - Updates profile details (name, phone, address).
* `GET /cart` / `POST /cart` - Manages persistent customer cart items.
* `GET /wishlist` / `POST /wishlist` - Toggles items in user wishlists.
* `GET /wallet` - Retrieves current wallet balance and transaction logs.
* `GET /seller-profile` / `POST /seller-profile` - Retrieves or creates a vendor configuration.

### Product Catalog & Media (`/api/v1/products`)
* `GET /` - Fetches products list (with search, category, and brand filters).
* `GET /categories` - Returns active categories.
* `GET /brands` - Returns active brands.
* `GET /:id` - Returns detailed product metadata.
* `POST /` / `PATCH /:id` / `DELETE /:id` - Admin/Seller routes to manage products.
* `POST /upload-image` - Uploads product image file to Cloudinary/S3.
* `POST /import-csv` - Seller route to bulk-import items via CSV.

### Transactions & Orders (`/api/v1/orders`)
* `POST /checkout` - Deducts wallet balance/processes checkouts and splits orders by vendor.
* `GET /my-orders` - Customer's personal order history.
* `GET /seller-orders` - Filtered orders for products owned by the vendor.
* `GET /:id` - Specific order layout.
* `POST /:id/cancel` - Cancels order and processes wallet refund.
* `PATCH /:id/status` - Updates order delivery step (Processing ➔ Shipped ➔ Delivered).
* `POST /:id/return` - Requests return and refund.

### Support & Tickets (`/api/v1/support`)
* `POST /` - Opens a new support ticket.
* `GET /my-tickets` - Customer's active tickets.
* `GET /admin-tickets` - Dashboard ticket log (Admin).
* `POST /:id/reply` - Appends messages to ticket threads.
* `POST /:id/resolve` - Resolves and closes ticket status.

### Recommendations (`/api/v1/recommendations`)
* `GET /frequently-bought/:productId` - Retrieves Apriori cached suggestions from Redis.
* `GET /similar/:productId` - Category-matching items.
* `GET /trending` - Populates popular storefront items.
* `GET /recent` / `POST /recent` - Manages user's recent browsing history.
