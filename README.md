# 🚨 ResQLink Lanka — Smart Disaster Early-Warning & Emergency Coordination System

[![Next.js 16](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Clean_Arch-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Modern_Dark_UI-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_ODM-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Leaflet GIS](https://img.shields.io/badge/Leaflet-Real_GIS_Maps-green?style=for-the-badge&logo=leaflet)](https://leafletjs.com/)
[![Jest Tests](https://img.shields.io/badge/Jest_Tests-40_Passed-brightgreen?style=for-the-badge&logo=jest)](https://jestjs.io/)
[![NextAuth.js](https://img.shields.io/badge/Auth-NextAuth.js_v4-purple?style=for-the-badge&logo=next.js)](https://next-auth.js.org/)

> A national-scale Smart Disaster Early-Warning and Emergency Coordination Platform tailored for Sri Lanka's Disaster Management Centre (DMC), District Secretariats, Tri-Forces & Emergency Rescue Squads, IoT Telemetry Sensor Networks, and Citizens.

---

## 📋 System Overview & Architecture

**ResQLink Lanka** is built upon **Clean Architecture (Hexagonal Architecture)** and an **Event-Driven Architecture (EDA)**. It unites real-time IoT sensor telemetry streams, GIS geofenced emergency broadcasting, citizen hazard reporting, emergency rescue team dispatching, and humanitarian relief inventory tracking into a resilient national dashboard.

```
                                  ┌───────────────────────────────────────────────┐
                                  │           Next.js 16 App Router UI            │
                                  │ (DMC Officer Portal, Citizen Feed, GIS Maps)  │
                                  └──────────────────────┬────────────────────────┘
                                                         │ HTTP / REST APIs
                                  ┌──────────────────────▼────────────────────────┐
                                  │          API Controllers & Gateways           │
                                  │  (/api/warnings, /api/telemetry, /api/auth)   │
                                  └──────────────────────┬────────────────────────┘
                                                         │
               ┌─────────────────────────────────────────┼────────────────────────────────────────┐
               ▼                                         ▼                                        ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐       ┌───────────────────────────────┐
│     Core Domain & Use Cases   │        │     Event-Driven EventBus     │       │   Infrastructure & Storage    │
│  • WarningService (UC1)       │◄───────┤  • TelemetryReceivedEvent     │──────►│  • MongoDB (Mongoose ODM)     │
│  • NotificationService        │        │  • WarningIssuedEvent         │       │  • Cellular SMS Gateway       │
│  • Zod Contract Validation    │        │  • WarningCancelledEvent      │       │  • Push Alert Dispatcher      │
└───────────────────────────────┘        └───────────────────────────────┘       └───────────────────────────────┘
```

## 📡 UC1: Issue Location-Based Disaster Warning (Detailed Workflow)

The Disaster Warning subsystem implements a rigorous multi-stage operational workflow:

### 1. Form & Geofence Page (`/broadcast/create`)
- **Warning Parameters:** Hazard Type (`Flood`, `Landslide`, `Cyclone`, `Tsunami`, `Drought`, `FlashFlood`), Severity (`Low`, `Medium`, `High`, `Critical`), Start Time, and End Time.
- **Based on Verified Incident Autofill:** Dynamically fetches actual open incidents from MongoDB (`/api/warnings/verified-incidents`) with district filtering (`📍 Filter by [District]` vs `🌐 All Districts`). Selecting an incident automatically populates hazard parameters and directs the GIS map to that district.
- **Interactive Sri Lanka GIS Map:** Powered by Leaflet & OpenStreetMap (`LeafletDistrictMap.tsx`), supporting all 25 administrative districts of Sri Lanka with closed boundary polygons and center coordinates.
- **Demographic Reach Calculation:** Integrates `reachEstimator.ts` to compute cellular broadcast reach based on official population density metrics.
- **Save as Draft (Flow A2):** Allows officers to save unissued drafts without triggering cellular broadcasts.

### 2. Review & Authorization (`/broadcast/review/[id]`)
- **Validation Verification:** Inspects E1 required fields, E2 TargetArea boundary validity, and active cellular gateways.
- **E3 Conflict Detection:** Flags conflicting active warnings in the same district for the same hazard type.
- **Edit Draft (Flow A3):** 1-click button to return to the creation form with populated draft data.
- **CRUD: Hard Delete / Discard Draft:** Permitted for `DRAFT` status warnings via `DELETE /api/warnings/[id]` with a permanent deletion confirmation dialog.
- **Mandatory High-Severity Confirmation Modal:** Triggers for `High` and `Critical` severities, displaying the exact target reach headcount before broadcast.
- **Emergency Siren Audio Auto-Play:** Authorizing the broadcast immediately triggers `/warning_alarm.mp3` through device speakers, simulating public alert sirens.

### 3. Confirmation & Delivery Summary (`/broadcast/summary/[id]`)
- **State Transition:** Guarantees atomic persistence of `ACTIVE` state to MongoDB before dispatching notifications.
- **Multi-Channel Dispatch:** Dispatches to Primary (Push Alerts) and Fallback (Cellular SMS) channels.
- **Delivery Metrics (Step 13):** Real-time monitoring of Total Target Reach, Sent, Delivered, Pending, and Failed counts.
- **Auto-Expiration:** Live timer evaluating `validUntil` timestamps to transition expired warnings to `EXPIRED`.
- **Siren Control Panel:** Live banner indicating siren playback with **🔇 Silence Siren** and **🔊 Play Siren Audio** controls.
- **Gateway Retry Mechanism:** Allows officers to re-attempt dispatches if the gateway was flagged as `PENDING_DISPATCH` or `FAILED`.

---

## 🔄 CRUD Operations Matrix (Disaster Warning Subsystem)

| CRUD Operation | Method & Route | Domain Function | Description |
| :--- | :--- | :--- | :--- |
| **CREATE** | `POST /api/warnings` | `createDraft()` | Creates new warning draft in MongoDB with `DRAFT` status and validates target area GIS boundaries. |
| **READ** | `GET /api/warnings`<br>`GET /api/warnings/[id]`<br>`GET /api/warnings/[id]/summary` | `listAllWarnings()`<br>`getWarningById()`<br>`getWarningDeliverySummary()` | Retrieves warning details, active disaster lists, and real-time delivery performance metrics. |
| **UPDATE** | `PUT /api/warnings/[id]`<br>`POST /api/warnings/[id]/issue`<br>`POST /api/warnings/[id]/retry-dispatch` | `updateDraft()`<br>`issueWarning()`<br>`retryWarningDispatch()` | Modifies draft criteria (Flow A3), transitions state from `DRAFT -> ACTIVE`, or retries failed broadcast dispatches. |
| **DELETE** | `DELETE /api/warnings/[id]`<br>*(Soft Delete)* `cancelWarning()` | `deleteDraft()`<br>`cancelWarning()` | **Hard Delete:** Permanently discards unissued warning drafts from MongoDB.<br>**Soft Delete (Flow A5):** Revokes active warnings and broadcasts cancellation directives. |

---

## 🧪 Automated Unit Test Suite

ResQLink Lanka features an extensive automated test suite built with **Jest** covering all domain business rules, validation schemas, edge boundaries, error handling, idempotency, and formal use case flows:

```bash
npm test -- __tests__/services/warningService.test.ts
```

### Test Suite Breakdown (40 Tests Passed):
- **1. Positive (Happy Path):** Draft creation, decoupled dispatch, state transition (`DRAFT -> ACTIVE`), reach calculations, hazard/severity domain types.
- **2. Negative & Validation:** Inverted time window rejection (`validUntil <= validFrom`), instructions min-length (10 chars), unclosed GIS polygons, invalid target areas.
- **3. Edge & Boundary:** Minimal 4-vertex triangle polygons, character boundaries, date boundary inequality, case-insensitive district lookup, fallback handling.
- **4. Error & Exception:** Non-existent UUIDs (`WarningNotFoundError`), invalid target areas (`InvalidTargetAreaError`), custom error hierarchy.
- **5. Idempotency & Fault Tolerance:** Idempotent re-issuing on active warnings, idempotent retry on sent warnings, graceful handling of unavailable/critical gateway faults (`PENDING_DISPATCH`, `FAILED`).
- **6. Formal Use-Case Flows:** `TargetArea.validateArea()`, Flow A1 source incident linkage, Flow E3 overlap detection, Flow A5 warning cancellation, Step 13 delivery summaries, and **CRUD Delete Draft** (hard delete, active rejection, non-existent ID).

---

## 🔐 Pre-configured Demo Accounts

Seed demo accounts into MongoDB using `npm run seed`:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **DMC Officer** | `dmc@resqlink.lk` | `password123` | Full Warning Creation (`/broadcast/create`), Review, Authorization, and Delivery Dashboards |
| **Citizen** | `citizen.colombo@resqlink.lk` | `password123` | Citizen Alert Feed, Hazard Reporting Form |
| **District Officer** | `officer.galle@resqlink.lk` | `password123` | District Rescue Incidents & Dispatch |
| **Rescue Lead** | `rescue@resqlink.lk` | `password123` | Rescue Team Assignment Portal |

---

## 📁 Repository Directory Structure

```
ResQLink-Lanka/
├── src/
│   ├── app/                      # Next.js 16 App Router Pages & API Routes
│   │   ├── (auth)/               # Sign In / Sign Up
│   │   ├── (dashboard)/          # Authenticated Portal Shell
│   │   │   ├── broadcast/        # UC1 Disaster Warning Subsystem ★ FULL
│   │   │   │   ├── create/       # GIS Boundary & Criteria Form Page
│   │   │   │   ├── review/[id]/  # Review, E3 Check, Delete & Issue Modal
│   │   │   │   └── summary/[id]/ # Real-Time Delivery Dashboard & Siren Control
│   │   │   ├── citizen/alerts/   # Citizen Public Alert Stream
│   │   │   ├── citizen/report-hazard # Citizen Hazard Submission [Stub]
│   │   │   ├── dmc/warnings/     # DMC Administrative Warnings Overview
│   │   │   ├── dmc/hazard-reports/# Verified Citizen Reports Queue [Stub]
│   │   │   ├── dmc/relief-resources/# Relief Stock Warehouse [Stub]
│   │   │   └── district-officer/ # Emergency Rescue Dispatch Hub [Stub]
│   │   └── api/                  # REST API Route Endpoints
│   │       ├── auth/             # NextAuth Endpoints
│   │       ├── warnings/         # Warning Draft Creation & Listing ★ FULL
│   │       │   ├── [id]/         # GET, PUT (Edit), DELETE (Discard Draft) ★ FULL
│   │       │   ├── [id]/issue/   # Issue Broadcast & Transition to ACTIVE ★ FULL
│   │       │   ├── [id]/summary/ # Delivery Summary Metrics ★ FULL
│   │       │   ├── [id]/retry-dispatch/ # Re-attempt Dispatches ★ FULL
│   │       │   ├── check-overlap/# E3 Duplicate Warning Verification ★ FULL
│   │       │   └── verified-incidents/ # MongoDB Incidents Filter Endpoint ★ FULL
│   │       ├── telemetry/        # IoT Telemetry Stream (Clean Architecture)
│   │       └── hazard-reports/   # Citizen Reports Endpoints [Stub]
│   └── core/                     # Clean Core Domain Architecture
│       ├── domain/               # Telemetry Entities & Repository Interfaces
│       ├── application/          # Use Cases & Telemetry Event Handlers
│       └── infrastructure/       # Mongo Repositories & In-Memory EventBus
├── components/                   # UI Component Library
│   ├── warnings/                 # LeafletDistrictMap, MapAreaPicker, StatusBadges
│   ├── landing/                  # Public Landing Page UI
│   └── Providers.tsx             # NextAuth Session Context Provider
├── lib/                          # Application Services & Infrastructure
│   ├── db/connectMongo.ts        # Cached MongoDB Connection
│   ├── models/                   # Mongoose Models (Warning, Incident, Notification, etc.)
│   ├── services/                 # warningService.ts, notificationService.ts
│   ├── utils/reachEstimator.ts   # Census Population Density Matrix
│   └── validation/               # Zod Schemas (warningSchema.ts)
├── public/                       # Static Assets & warning_alarm.mp3
├── __tests__/                    # Comprehensive Jest Test Suite
├── scripts/                      # Database Seeder (seed.ts)
└── package.json                  # Dependencies & Project Scripts
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- Node.js (v18.x or v20.x recommended)
- MongoDB instance (Local or MongoDB Atlas)

### 1. Clone & Install
```bash
git clone https://github.com/Sine-D/ResQLink-Lanka.git
cd ResQLink-Lanka
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the project root:
```env
MONGODB_URI="mongodb://localhost:27017/resqlink"
NEXTAUTH_SECRET="resqlink-secret-key-32-chars-minimum"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Seed Database
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 REST API Endpoints Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/warnings?mode=all` | List all warnings or filter by district | Public / DMC |
| `POST` | `/api/warnings` | Create new warning draft (`Zod` validated) | DMC Officer |
| `GET` | `/api/warnings/:id` | Fetch specific warning draft / active details | Public / DMC |
| `PUT` | `/api/warnings/:id` | Update parameters of existing warning draft (Flow A3) | DMC Officer |
| `DELETE` | `/api/warnings/:id` | **Hard Delete** unissued warning draft from database | DMC Officer |
| `POST` | `/api/warnings/:id/issue` | Validate target area, transition to `ACTIVE`, and dispatch | DMC Officer |
| `GET` | `/api/warnings/:id/summary` | Step 13 Real-time delivery statistics breakdown | DMC Officer |
| `POST` | `/api/warnings/:id/retry-dispatch` | Re-attempt dispatches for failed/pending gateways | DMC Officer |
| `GET` | `/api/warnings/check-overlap` | Flow E3 duplicate active warning detection | DMC Officer |
| `GET` | `/api/warnings/verified-incidents` | Query verified database incidents filtered by district | DMC Officer |
| `GET/POST`| `/api/telemetry` | Ingest and retrieve IoT sensor readings | Public / System |
| `POST` | `/api/auth/signup` | Register new user account | Public |
