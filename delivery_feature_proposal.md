# Delivery Partner System: Architectural & UI Design Proposal

This document outlines the phased implementation plan for adding the Delivery Partner system to Daykart without disrupting existing workflows.

---

## Phase 1: Registration, Approval, and Role Handling

### Database Schema Updates
1. **User Schema (`User.js`)**:
   - Add `deliveryStatus`: `{ type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' }`.
   - By default, delivery partners register with `role: 'customer'` and `deliveryStatus: 'pending'`. This satisfies the requirement that **until approved, they are treated as standard customers** and cannot access the delivery dashboard.

2. **Order Schema (`Order.js`)**:
   - Add `deliveryOtp`: `{ type: String, default: null }` (6-digit secure delivery validation code).

### Frontend Registration UI ([register/page.js](file:///c:/Users/kvenk/Documents/SRM PROJECTS/FULL STACK PROJECTS/Daykart/frontend/src/app/register/page.js))
- Add a segmented control or drop-down to select the account type: **Customer**, **Seller**, or **Delivery Partner**.
- If registering as a **Delivery Partner**:
  - Upon signup, route them to a success screen explaining that their application is under review.
  - Set their initial role to `customer` so they can navigate the client site normally.

### Admin Approval UI ([admin/dashboard/page.js](file:///c:/Users/kvenk/Documents/SRM PROJECTS/FULL STACK PROJECTS/Daykart/frontend/src/app/admin/dashboard/page.js))
- Create a **Manage Delivery** tab in the Admin Control Panel.
- Display a list of pending applications with a quick toggle to **Approve** or **Reject**.
- Approving an application automatically updates the user's role in the DB to `delivery_partner` and sets `deliveryStatus` to `approved`.

---

## Phase 2: Order Assignment & Seller Handover

### Admin Order Assignment
- In the **Customer Orders** tab of the Admin Dashboard:
  - Add an action button next to processed orders: **Assign Delivery Partner**.
  - Clicking this opens a dropdown/modal displaying all active, approved delivery partners.
  - Triggers the existing `PATCH /api/v1/orders/:id/assign` endpoint.

### Seller Pickup Interface ([seller/dashboard/page.js](file:///c:/Users/kvenk/Documents/SRM PROJECTS/FULL STACK PROJECTS/Daykart/frontend/src/app/seller/dashboard/page.js))
- In the Seller Orders list:
  - If a delivery guy is assigned, display a **Delivery Partner Info** card showing their Name and Phone number.
  - Add a **Handover Package** button.
  - When the seller clicks this (once the delivery guy picks up the package), it updates the order status to `shipped` (or `out_for_delivery`).

---

## Phase 3: Delivery Portal (`/delivery/dashboard`)

Create a dedicated dashboard route `/delivery/dashboard` utilizing the same glassmorphic theme as the Admin and Seller portals.

### Key Layout Features:
1. **Active Deliveries Tab**:
   - Lists assigned orders divided into **Pending Pickup** (from Seller) and **Out for Delivery** (to Customer).
   - Display target seller store address, customer shipping address, and cash collection requirements (if COD).
2. **Customer Contact Card**:
   - Provide quick-action buttons for the customer's phone number and email address (with `tel:` and `mailto:` protocols) for easy coordination.
3. **Earnings & Stats Overview**:
   - Show metrics like Completed Deliveries, Pending Tasks, and Total Tips/Earnings.

---

## Phase 4: OTP Verification & Delivery Completion

### Customer Portal OTP Display ([orders/[id]/page.js](file:///c:/Users/kvenk/Documents/SRM PROJECTS/FULL STACK PROJECTS/Daykart/frontend/src/app/orders/%5Bid%5D/page.js))
- When an order status is `shipped` or `out_for_delivery`, display a prominent **Secure Delivery OTP** card on the order detail page.
- Show the 6-digit OTP code with a warning banner: *"Please share this OTP with your delivery agent only when you receive your package."*

### OTP Verification Flow
- In the Delivery Dashboard:
  - Clicking **Complete Delivery** opens an OTP verification modal.
  - The delivery partner inputs the 6-digit code.
  - The backend validates the input:
    - If valid, updates status to `delivered`, registers it in the tracking timeline, and credits seller/delivery metrics.
    - Sends automated socket/in-app notifications to the **Seller** and **Admin** immediately.
