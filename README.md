# Awaz (आवाज़) — Public-Interest Consumer Evidence Platform

> **Tagline:** One issue. Many voices. Visible evidence.  
> **Mission:** Help customers turn isolated complaints into credible, aggregated evidence and constructive collective action.

Awaz is an independent, neutral platform focused initially on e-commerce fulfillment and delivery grievances in India (starting with Flipkart delayed deliveries).

---

## 🏛️ Platform Principles

1. **Evidence over outrage:** Complaints require promised delivery dates, status timelines, and verifiable documents rather than unverified rants.
2. **Transparent counting:** Unique affected reporters are measured separately from raw submission counts.
3. **Privacy by default:** Private complaint text, residential addresses, phone numbers, and raw evidence files are confidential and never exposed in public feeds.
4. **Independent & Factual:** Awaz is not affiliated with, endorsed by, or operated by Flipkart. Awaz does not adjudicate legal liability.
5. **Constructive Collective Action:** Voluntary campaigns generate downloadable **Consolidated Consumer Evidence Packs** for submission to official consumer dispute redressal authorities (National Consumer Helpline, e-Daakhil).

---

## 🛠️ Technology Stack

- **Framework:** [Next.js](https://nextjs.org) (App Router, React 19, TypeScript strict mode)
- **Styling:** Tailwind CSS with institutional public-interest design tokens
- **Database & ORM:** PostgreSQL ([Neon](https://neon.tech)) via [Prisma ORM](https://www.prisma.io)
- **Authentication & RBAC:** Secure Web Crypto JWT sessions with HTTP-only cookies and bcrypt password hashing
- **Validation:** [Zod](https://zod.dev) schemas for all API payloads and inputs
- **Anti-Abuse:** Sliding-window rate limiting, idempotency keys, and Jaccard text similarity detection
- **Testing:** Node.js native test runner via `tsx --test`

---

## 🚀 Quick Start

### 1. Environment Configuration

Copy `.env.example` to `.env` and set your Neon PostgreSQL database URL:

```bash
DATABASE_URL="postgresql://neondb_owner:<password>@<neon-host>/neondb?sslmode=require"
JWT_SECRET="a-very-secure-random-secret-key-32-chars-min"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
DEMO_MODE="true"
```

### 2. Database Migration & Seed

Synchronize database schema and seed demonstration records:

```bash
# Push schema to PostgreSQL database
npm run prisma:push

# Seed issues, sample verified reports, campaigns, and demo accounts
npm run seed
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the live dashboard.

---

## 🔑 Demonstration Accounts

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Citizen Reporter** | `arun.kumar@example.com` | `Password123!` | File complaints, upload evidence, join campaigns, mark resolution |
| **Verification Officer** | `moderator@awaz.org` | `Password123!` | Review evidence queue, verify/reject submissions, flag duplicates |
| **Platform Administrator**| `admin@awaz.org` | `Password123!` | Manage issues, publish timeline updates, launch campaigns |

---

## 🧭 Application Routes

### Public Pages
- `/` — Public dashboard with verified aggregate statistics, 7d/30d trend charts, active categories, and latest approved timeline milestones.
- `/issues` — Issue directory with search and category filtering.
- `/issues/[slug]` — Deep-dive issue page with verified vs unverified metrics, 30-day submission trend, regional state distribution, and escalation pack download.
- `/campaigns/[id]` — Voluntary collective action representation page with join/withdraw controls and official grievance helpline resources.
- `/methodology` — Published counting standard, deduplication rules, and verification definitions.
- `/about` — Mission charter, independence statement, and product principles.
- `/privacy` — Privacy notice, data minimization rules, and 180-day retention policies.
- `/terms` — Acceptable use policy, zero-tolerance anti-harassment rules, and legal limitations.
- `/login` — Account sign in and citizen registration.

### Authenticated Citizen Experience
- `/report` — 5-step accessible complaint submission form:
  1. **Order Details:** Promised delivery date, placement date, order status, status update inquiry.
  2. **Description:** Factual experience, desired outcome, state/region, sensitive data warning.
  3. **Evidence:** Optional screenshot or invoice upload, redaction confirmation.
  4. **Review & Confirm:** Legal certification of accuracy and privacy consent.
  5. **Confirmation:** Unique reference number (`AWZ-YYYY-XXXX`) and status link.
- `/my-reports` — View submitted complaints, check verification status, and confirm delivery/resolution.

### Restricted Moderation Experience
- `/admin` — Moderation queue to inspect submitted complaints, review uploaded evidence, verify or reject with reason, flag duplicates, and maintain audit logs.

---

## 📡 API Endpoints (`/api/v1`)

### Public Endpoints
- `GET /api/v1/dashboard` — Aggregated counts, daily trends (7d/30d), trending issues, latest public updates.
- `GET /api/v1/issues` — Issue directory with category and search query filters.
- `GET /api/v1/issues/:slug` — Individual issue metrics, trends, campaigns, and timeline.
- `GET /api/v1/issues/:slug/report` — Downloadable/printable Consolidated Consumer Evidence Pack (`?format=text` or JSON).

### Authenticated Citizen Endpoints
- `POST /api/v1/reports` — Submit complaint with idempotency and duplicate check.
- `GET /api/v1/my-reports` — List authenticated user's submitted reports.
- `GET /api/v1/reports/:id` — View detailed report (author or staff only).
- `PATCH /api/v1/reports/:id` — Update report status (e.g. mark delivered, resolution confirmed).
- `POST /api/v1/reports/:id/evidence` — Attach evidence document metadata with redaction acknowledgement.
- `POST /api/v1/campaigns/:id/participation` — Join collective representation.
- `DELETE /api/v1/campaigns/:id/participation` — Withdraw from collective representation.

### Restricted Admin Endpoints
- `GET /api/v1/admin/reports` — Filterable queue of complaints and evidence.
- `POST /api/v1/admin/reports/:id/review` — Moderator verification status update with reason.
- `POST /api/v1/admin/reports/:id/moderation` — Actions (flag duplicate, reclassify, reject).
- `POST /api/v1/admin/issues` — Create or update public issue pages.
- `POST /api/v1/admin/campaigns` — Create collective action campaigns.

---

## 🧪 Testing & Quality Checks

Run the automated test suite, type checker, linter, and production build:

```bash
# Validate Prisma schema
npx prisma validate

# Run unit & integration tests
npm test

# Verify TypeScript types
npx tsc --noEmit

# Run ESLint
npm run lint

# Compile optimized production bundle
npm run build
```

---

## ⚖️ Legal & Regulatory Context in India

Awaz is designed with reference to the **Consumer Protection Act, 2019**, the **Consumer Protection (E-Commerce) Rules, 2020**, and the **Digital Personal Data Protection (DPDP) Act, 2023**:
- Grievances include direct referral to the **National Consumer Helpline (NCH)** via Toll-Free **1915** or [consumerhelpline.gov.in](https://consumerhelpline.gov.in).
- Direct link for formal consumer court filing via **e-Daakhil** ([edaakhil.nic.in](https://edaakhil.nic.in)).
- Direct channel for company grievance officers to review public records and submit factual correction notices.
