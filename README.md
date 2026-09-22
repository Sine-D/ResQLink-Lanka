# 🚨 ResQLink Lanka — Smart Disaster Early-Warning & Emergency Coordination System

[![Next.js 16](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Clean_Arch-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Modern_Dark_UI-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_ODM-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Jest Coverage](https://img.shields.io/badge/Jest_Coverage-95.41%25-brightgreen?style=for-the-badge&logo=jest)](https://jestjs.io/)
[![NextAuth.js](https://img.shields.io/badge/Auth-NextAuth.js_v4-purple?style=for-the-badge&logo=next.js)](https://next-auth.js.org/)


> A national-level Smart Disaster Early-Warning and Emergency Coordination Platform tailored for Sri Lanka's Disaster Management Center (DMC), District Secretariats, Emergency Rescue Squads, Telemetry Sensor Networks, and Citizens.

---

## 📋 Executive Summary

**ResQLink Lanka** combines real-time IoT sensor telemetry streams, GIS geofenced hazard alert broadcasting, citizen hazard reporting, emergency rescue team dispatches, and relief inventory management into one unified emergency coordination platform.

The system features a **full rubric-grade implementation of Member 1's use case ("Issue Location-Based Disaster Warning")** supported by a **Clean Architecture core domain (`src/core`)**, an extensive **22-test Jest suite (>95% coverage)**, and clean working **stubs** for Members 2, 3, and 4.

---

## 🏗️ Clean Architecture & System Layering

The codebase enforces a layered Clean Architecture pattern separating domain entities, business use cases, framework services, and presentation routes:

```mermaid
graph TD
    subgraph Presentation_Layer ["🌐 Presentation & Web Layer (/src/app)"]
        LandingPage ["Landing Page & Navbar"]
        AuthModule ["/signin & /signup (NextAuth)"]
        DmcDashboard ["/dmc/warnings (Active Command Dashboard)"]
        CreateWarning ["/dmc/warnings/new (Leaflet GIS Area Picker)"]
        ReviewScreen ["/dmc/warnings/[id]/review (Reach Estimation)"]
        CitizenAlertFeed ["/citizen/alerts (High-Priority Alert Cards)"]
    end

    subgraph API_Layer ["⚡ REST API Route Layer (/src/app/api)"]
        AuthApi ["/api/auth/[...nextauth] & /api/auth/signup"]
        WarningsApi ["/api/warnings & /api/warnings/[id]"]
        IssueApi ["/api/warnings/[id]/issue"]
        RetryApi ["/api/warnings/[id]/retry-dispatch"]
        TelemetryApi ["/api/telemetry (Sensor Data Stream)"]
        StubsApi ["/api/hazard-reports | /api/incidents | /api/relief-resources"]
    end

    subgraph Domain_Core ["🏛️ Clean Core Domain (/src/core)"]
        DomainEntities ["Domain Entities (Telemetry, DomainEvent)"]
        RepoInterfaces ["Repository Interfaces (ITelemetryRepository)"]
        AppServices ["Application Services & Use Cases"]
    end

    subgraph Infrastructure_Layer ["⚙️ Service & Infrastructure Layer (/lib)"]
        WarningService ["warningService.ts (Target Validation & Reach)"]
        NotifService ["notificationService.ts (Gateway & Retry Logic)"]
        ZodValidation ["warningSchema.ts (Zod Validation)"]
        ReachEstimator ["reachEstimator.ts (Population Density Matrix)"]
    end

    subgraph Database_Layer ["🗄️ Database Layer (/lib/models)"]
        MongoConnect ["connectMongo.ts (Connection Cache)"]
        UserCol [("Users Collection")]
        WarningCol [("Disaster Warnings Collection")]
        NotifCol [("Notifications Collection")]
        TelemetryCol [("Telemetry Readings Collection")]
    end

    Presentation_Layer --> API_Layer
    API_Layer --> Infrastructure_Layer
    API_Layer --> Domain_Core
    Infrastructure_Layer --> Domain_Core
    Infrastructure_Layer --> Database_Layer
```

---

## 🧩 4 Core Modules Scope Breakdown

| Icon | Module Name | Scope | Key Functionalities |
| :---: | :--- | :---: | :--- |
| 📡 | **1. Disaster Warning & Alert Management** | 🔴 **FULL** | GIS polygon geofencing, district population reach matrix, Zod schemas, issue state order persistence, SMS/PUSH gateway retry logic, DMC dashboard & Citizen alert cards. |
| ⚠️ | **2. Citizen Hazard Reporting** | 🟡 **STUB** | Citizen hazard submission form (`PENDING_VERIFICATION`), DMC verification queue, stub endpoints, and `README-TODO.md` for offline queues & photo uploads. |
| 🚒 | **3. Rescue Team Dispatch** | 🟡 **STUB** | Emergency incident model, Navy/Army rescue team registry, team dispatch interface, stub endpoints, and `README-TODO.md` for GPS tracking. |
| 📦 | **4. Relief Resource Distribution** | 🟡 **STUB** | Central warehouse inventory stock tracking, stock deduction logs, stub endpoints, and `README-TODO.md` for Recharts analytics & low-stock alerts. |

---

## 🧪 Unit Test Suite & Coverage Report

Unit tests target **>90% code coverage** on `warningService.ts`, `notificationService.ts`, `telemetryService.ts`, and `warningSchema.ts` using Jest and offline-resilient model mocking.

```bash
npm test
```

### Coverage Metrics

| File | % Statements | % Branch | % Functions | % Lines | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **All Files** | **94.69%** | **78.57%** | **90.90%** | **95.41%** | ✅ **PASSED** |
| `lib/services/notificationService.ts` | **96.61%** | **78.94%** | **88.88%** | **96.61%** | ✅ **PASSED** |
| `lib/services/warningService.ts` | **93.44%** | **77.41%** | **90.90%** | **93.44%** | ✅ **PASSED** |
| `lib/validation/warningSchema.ts` | **91.66%** | **83.33%** | **100.00%** | **100.00%** | ✅ **PASSED** |

---

## 🔐 Pre-configured Demo Accounts

Use the seed script (`npm run seed`) to populate demo users for testing role-based access:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **DMC Officer** | `dmc@resqlink.lk` | `password123` | Full DMC Warnings Dashboard, Warning Creation, Review Screen |
| **Citizen** | `citizen.colombo@resqlink.lk` | `password123` | Citizen Alert Feed, Hazard Reporting Form |
| **District Officer** | `officer.galle@resqlink.lk` | `password123` | District Rescue Incidents & Dispatch |
| **Rescue Lead** | `rescue@resqlink.lk` | `password123` | Rescue Team Assignment Portal |

---

## 📁 Repository Directory Structure

```
ResQLink-Lanka/
├── app/                      # Next.js 16 App Router Pages & API Routes
│   ├── (auth)/               # Authentication Routes
│   │   ├── signin/           # Sign In Page
│   │   └── signup/           # User Registration Page
│   ├── (dashboard)/          # Protected Dashboard Shell Layout
│   │   ├── citizen/alerts/   # Citizen Alert Feed Card List  ★ FULL
│   │   ├── citizen/report-hazard # Citizen Hazard Report Form [Stub]
│   │   ├── dmc/warnings/     # DMC Active Warnings Dashboard ★ FULL
│   │   │   ├── new/          # Create Warning Form (Leaflet) ★ FULL
│   │   │   ├── [id]/review/  # Review & Issue Confirmation   ★ FULL
│   │   │   └── [id]/         # Warning Details & Delivery Log★ FULL
│   │   ├── dmc/hazard-reports/# Hazard Verification Queue    [Stub]
│   │   ├── dmc/relief-resources/# Relief Stock Warehouse Hub [Stub]
│   │   └── district-officer/ # Rescue Incident Dispatch Hub  [Stub]
│   ├── api/                  # REST API Route Endpoints
│   │   ├── auth/[...nextauth]# NextAuth Handler
│   │   ├── auth/signup/      # Signup Handler
│   │   ├── telemetry/        # IoT Sensor Telemetry Stream
│   │   ├── warnings/         # Draft Creation & Listing      ★ FULL
│   │   │   ├── [id]/issue/   # Publish & Notify Gateway      ★ FULL
│   │   │   └── [id]/retry-dispatch/ # Re-attempt Dispatches  ★ FULL
│   │   ├── hazard-reports/   # Hazard Reports Endpoint       [Stub]
│   │   ├── incidents/[id]/dispatch # Rescue Dispatch Endpoint [Stub]
│   │   └── relief-resources/ # Stock Distribution Endpoint   [Stub]
│   └── page.tsx              # Public Landing Page (Hero, Pillars, Contact)
├── src/core/                 # Clean Core Domain Architecture
│   ├── domain/               # Domain Entities & Repository Interfaces
│   │   ├── entities/         # Telemetry.ts & DomainEvent.ts
│   │   └── repositories/     # ITelemetryRepository.ts
│   ├── application/          # Application Use Cases
│   └── infrastructure/       # Repository Implementations
├── components/               # React UI Components
│   ├── landing/              # Navbar, Footer, Features
│   ├── warnings/             # MapAreaPicker, CitizenAlertCard, StatusBadges
│   └── Providers.tsx         # NextAuth SessionProvider Wrapper
├── lib/                      # Infrastructure & Service Layer
│   ├── db/connectMongo.ts    # Cached Mongoose Connection Helper
│   ├── models/               # Mongoose ODM Schemas (User, Warning, Notification, etc.)
│   ├── services/             # Business Services (warningService, notificationService)
│   ├── utils/reachEstimator.ts # District Population Density Lookup Matrix
│   ├── validation/           # Zod Schemas (warningSchema.ts)
│   └── auth.ts               # NextAuth Options & Credentials Provider
├── __tests__/                # Jest Unit Test Suite (22 Passed Tests, >95% Coverage)
│   └── services/             # warningService, notificationService & telemetryService Tests
├── scripts/                  # Database Seeder Script (seed.ts)
├── middleware.ts             # Role-based Route Protection Middleware
├── jest.config.ts            # Jest Configuration with Coverage Thresholds
└── package.json              # Project Dependencies & Scripts
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- Node.js (v18.x or v20.x recommended)
- MongoDB local instance or MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Sine-D/ResQLink-Lanka.git
cd ResQLink-Lanka
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=""
NEXTAUTH_SECRET=""
NEXTAUTH_URL=http://localhost:3000
```

### 3. Seed Database
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 REST API Endpoints Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/warnings?mode=all` | List all warnings or filter by district | Public / DMC |
| `POST` | `/api/warnings` | Create new warning draft (`Zod` validated) | DMC Officer |
| `GET` | `/api/warnings/:id` | Get single warning details | Public / DMC |
| `POST` | `/api/warnings/:id/issue` | Validate target area, set `ACTIVE`, and trigger gateway | DMC Officer |
| `POST` | `/api/warnings/:id/retry-dispatch` | Re-attempt pending/failed dispatches | DMC Officer |
| `GET/POST`| `/api/telemetry` | IoT Sensor reading telemetry stream | Public / System |
| `POST` | `/api/auth/signup` | Register new user account | Public |
| `POST` | `/api/hazard-reports` | Submit citizen hazard report | Citizen (Stub) |
| `POST` | `/api/incidents/:id/dispatch` | Assign rescue team to incident | District Officer (Stub) |
| `POST` | `/api/relief-resources` | Log relief stock distribution | DMC Officer (Stub) |

