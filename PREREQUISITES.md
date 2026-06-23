# Daykart Platform Dependencies & Prerequisites Guide

This document lists all system requirements, database services, and NPM package dependencies needed to compile, run, and test the **Daykart Multi-Vendor E-Commerce Platform**.

---

## 1. System-Level Prerequisites

Before running the application, make sure the following runtimes and services are installed on your machine:

| Prerequisite | Recommended Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v18.x` or `v20.x` | JavaScript server runtime environment |
| **NPM** | `v10.x` or higher | Package manager for managing dependencies |
| **Docker Desktop** | Latest Stable | Containerized infrastructure services |
| **Docker Compose** | `v2.x` or higher | Multi-container orchestration tool |

---

## 2. Infrastructure Services (Docker)

Daykart uses Docker to spin up pre-configured services for databases, cache, search index, and mail sandboxing. These are defined in [docker-compose.yml](file:///c:/Users/kvenk/Documents/SRM%20PROJECTS/FULL%20STACK%20PROJECTS/Daykart/docker-compose.yml):

* **MongoDB**: Document database for persistent storage (users, products, orders, tickets, notifications).
* **Redis**: In-memory data structure store used for PDP caching and session authentication checks.
* **Elasticsearch**: Distributed search engine for fast, fuzzy auto-complete catalog searches.
* **Mailhog**: Sandbox SMTP server with web console (`http://localhost:8025`) to inspect sent emails (like signup verification codes).

To start all infrastructure services:
```bash
docker-compose up -d
```

---

## 3. NPM Package Dependencies

The project is split into two packages: a REST API server (`backend`) and a Next.js web application (`frontend`). Here is the list of key package requirements.

### A. Backend Package Dependencies (`/backend/package.json`)
* **Core Framework**:
  * `express` - HTTP framework
  * `cors`, `cookie-parser` - Request and session parser middlewares
* **Database & Search**:
  * `mongoose` - MongoDB object modeling tool
  * `redis` - Redis database client
  * `@elastic/elasticsearch` - Elasticsearch client for indexing and catalog lookup
* **Security & Auth**:
  * `bcryptjs` - Password hashing function
  * `jsonwebtoken` - Token generation and payload encryption
  * `helmet` - Security headers
  * `express-rate-limit` - DDoS protection
  * `express-mongo-sanitize` - NoSQL injection prevention
* **Utilities & Uploads**:
  * `zod` - Runtime request body validator schema
  * `multer` - Multipart file uploader
  * `cloudinary` - Cloud media hosting client
  * `@aws-sdk/client-s3` - Amazon Simple Storage Service client
  * `nodemailer` - Transactional email transporter
  * `winston` - Production-ready logging framework
* **Developer Tools & Testing**:
  * `jest` & `supertest` - Test runner and mock agent for routing unit/integration tests
  * `nodemon` - Hot-reload tool

### B. Frontend Package Dependencies (`/frontend/package.json`)
* **Core Runtimes**:
  * `next` (v16.x) - React framework (compiled with Next.js Turbopack)
  * `react` & `react-dom` (v19.x) - Component rendering libraries
* **State Management**:
  * `@reduxjs/toolkit` - Toolset for efficient Redux state logic
  * `react-redux` - Redux bindings for React hooks
* **Styling & UI**:
  * `tailwindcss` (v4) - Utility-first styling engine
  * `@tailwindcss/postcss` - PostCSS engine integration
  * `framer-motion` - Animations and micro-transitions engine
  * `lucide-react` - Scalable interface icon library
* **Utilities**:
  * `zod` - Frontend client form validator schemas
  * `react-hook-form` & `@hookform/resolvers` - Form handling logic
  * `jspdf` & `jspdf-autotable` - Client-side invoice and PDF generator engines
  * `socket.io-client` - WebSocket communication link

---

## 4. How to Install Everything in One Command

Instead of running `npm install` separately in each directory, a workspace runner is configured in the root [package.json](file:///c:/Users/kvenk/Documents/SRM%20PROJECTS/FULL%20STACK%20PROJECTS/Daykart/package.json).

From the root directory of the project, run:
```bash
npm run install-all
```
This will automatically:
1. Perform clean dependency installation for the Express backend.
2. Perform clean dependency installation for the Next.js frontend.

---

## 5. Startup Commands Reference

To spin up the local development sandbox:

```bash
# 1. Start database/redis/mailhog containers
docker-compose up -d

# 2. Run backend & frontend dev servers concurrently
npm run dev
```
Once run, the resources will be available at:
* **Storefront Interface**: `http://localhost:3000`
* **Backend API Documentation (Swagger)**: `http://localhost:5005/api-docs`
* **Mailhog Web Sandbox**: `http://localhost:8525` (or check your custom port)
