# Technical Documentation — NAWI Test Report Generation System (OIML R-76)

**Problem Statement ID:** 26035  
**Title:** Development of a Software Program/Application for Generation of Test Reports for Non-Automatic Weighing Instruments (NAWI) as per OIML Recommendation R-76  
**Organization:** Ministry of Consumer Affairs, Food & Public Distribution | Department of Consumer Affairs (DoCA)

---

## 1. System Architecture & Tech Stack

```
+-----------------------------------------------------------------------+
|                         Frontend (React 18 + Vite)                    |
|  - Offline-First UI (IndexedDB via 'idb')                              |
|  - Service Worker Caching & Offline PDF Generation (jsPDF)            |
|  - Dynamic Dashboard (Chart.js), Interactive Test Observation Forms   |
+-----------------------------------------------------------------------+
                                  |
                           HTTP / REST API
                                  v
+-----------------------------------------------------------------------+
|                     Backend (Node.js + Express.js)                     |
|  - Auth & RBAC (JWT, Admin / Engineer / Viewer roles)                |
|  - Upgradable OIML R-76 Engine (Dynamic Rule Set Versioning)          |
|  - PDF (pdfkit) & Word (docx) Standardized Report Generators          |
|  - Cloudinary Photo Upload & Attachment Storage                       |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|                         Database & Storage                            |
|  - MongoDB Atlas (Users, Instruments, TestReports, OimlRules)         |
|  - Cloudinary CDN (Instrument Photos, Plate Images)                   |
+-----------------------------------------------------------------------+
```

---

## 2. OIML R-76 Calculation Methodology

### 2.1 Maximum Permissible Errors (MPE)

Per OIML R-76-1 Section 3.5, Maximum Permissible Errors on initial verification are defined in terms of verification scale intervals ($e$):

| Accuracy Class | $0 \le m \le 500e$ | $500e < m \le 2000e$ | $2000e < m \le 10000e$ |
| :--- | :--- | :--- | :--- |
| **Class I** | $\pm 0.5e$ ($0 \le m \le 50\,000e$) | $\pm 1.0e$ ($50\,000e < m \le 200\,000e$) | $\pm 1.5e$ ($m > 200\,000e$) |
| **Class II** | $\pm 0.5e$ ($0 \le m \le 5\,000e$) | $\pm 1.0e$ ($5\,000e < m \le 20\,000e$) | $\pm 1.5e$ ($m > 20\,000e$) |
| **Class III** | $\pm 0.5e$ ($0 \le m \le 500e$) | $\pm 1.0e$ ($500e < m \le 2\,000e$) | $\pm 1.5e$ ($2\,000e < m \le 10\,000e$) |
| **Class IIII** | $\pm 0.5e$ ($0 \le m \le 50e$) | $\pm 1.0e$ ($50e < m \le 200e$) | $\pm 1.5e$ ($200e < m \le 1\,000e$) |

### 2.2 Test Procedures Implemented

1. **Eccentricity Test (Section T.5):**
   - Applied Load: $L = \frac{1}{3} \text{Max}$
   - Placed at 5 platform positions: Center, Front-Left, Front-Right, Rear-Left, Rear-Right.
   - Requirement: $|E| \le |\text{MPE}|$ for all positions.

2. **Repeatability Test (Section T.6):**
   - Minimum 6 repetitions at $0.5 \times \text{Max}$ and $\text{Max}$.
   - Requirement: Difference between maximum and minimum indication $\Delta I_{\text{max}} \le |\text{MPE}|$.

3. **Increasing/Decreasing Load Test (Section T.4):**
   - Tested at 5–10 load points between Min and Max.
   - Requirement: Indication error $E = I - L$ must satisfy $|E| \le |\text{MPE}|$ at every point.

4. **Discrimination Test (Section T.7):**
   - Extra load $\Delta L = 1.4d$ added to platform.
   - Requirement: Indication must change by at least $1d$.

---

## 3. Upgradable Engine Architecture

- Rule sets are stored as versioned JSON documents (`OimlRule` schema in MongoDB).
- Each test report locks to the `oimlRuleVersion` string under which it was generated (guaranteeing legal reproducibility and auditability).
- Admins can upload a new JSON rule definition via `/oiml-rules` without requiring server code deployment or service restart.

---

## 4. Offline Synchronization & Offline PDF Generation

- **Client Store:** IndexedDB stores instruments, test reports, and pending mutations locally.
- **Background Sync:** The client detects online/offline transitions automatically. Queue items are posted in batch to `/api/sync`.
- **Offline PDF Generation:** When internet is unavailable, client-side `jsPDF` builds and downloads the report immediately. When online, server-side `pdfkit` / `docx` generate official high-resolution documents.

---

## 5. Deployment Framework

- **Backend Server:** Node.js Express server running on port 5000 (`npm start`).
- **Frontend App:** Vite React SPA running on port 3000 (`npm run dev`).
- **Database:** MongoDB connection via `MONGO_URI`.
