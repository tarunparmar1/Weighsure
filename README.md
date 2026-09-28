# ⚖️ NAWI Test Report Generation System (OIML R-76)



---

## 🏛️ Executive Summary

Under the **Legal Metrology Act, 2009** and the **Legal Metrology (General) Rules, 2011**, Non-Automatic Weighing Instruments (NAWIs) used in trade, commerce, industry, and healthcare must conform to prescribed international standards (**OIML Recommendation R-76**).

This application replaces manual spreadsheet evaluations with a modernized, automated, and secure **MERN stack software application** featuring:
- **Automated OIML R-76 Metrological Evaluation** (Maximum Permissible Errors, Eccentricity, Repeatability, Accuracy Classes I, II, III, IIII).
- **Offline-First Architecture** with automatic background sync upon internet reconnection.
- **Upgradable OIML Calculation Engine** enabling hot-reloading of new international rule revisions without code redeployment.
- **Official Government of India Web Portal UI** (Department of Consumer Affairs standards).
- **Standardized Export Formats** (Digital Certificates in PDF & editable Word DOCX).
- **Cloudinary CDN Integration** for attaching instrument photographs and nameplate evidence.

---

## 🔑 Evaluator Login Credentials

Pre-seeded accounts are available for testing role-based access control (RBAC):

| Role | Official Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Lab Administrator (Approving Authority)** | `admin@metrology.gov.in` | `password123` | Full access, Approve/Reject reports, Deploy new OIML engine rules, Register/Delete instruments |
| **Testing Engineer (Officer)** | `engineer@metrology.gov.in` | `password123` | Instrument specification entry, Record test observations, Run automated OIML evaluations |
| **New Officer Registration** | — | — | Register instantly via the **Register Officer** page |

---

## 🚀 Key Functional Capabilities

### 1. 🧪 Automated OIML R-76 Metrological Engine
- **Accuracy Class Classification**: Full support for Class I (Special), Class II (High), Class III (Medium), and Class IIII (Ordinary).
- **Maximum Permissible Error (MPE) Calculation**: Automated determination of dynamic error limits ($0.5e$, $1.0e$, $1.5e$) on verification scale intervals.
- **Eccentricity Test (Section T.5)**: $1/3 \text{ Max}$ load evaluation at 5 platform positions (Center, Front-Left, Front-Right, Rear-Left, Rear-Right).
- **Repeatability Test (Section T.6)**: Range ($\max - \min$) analysis across 6 repetitions at $0.5 \text{Max}$ and $1.0 \text{Max}$.
- **Increasing & Decreasing Load Weighing Test (Section T.4)**: Error analysis across load increments and step-wise unloading.
- **Discrimination Test (Section T.7)**: Sensitivity verification with $1.4d$ extra weight application.

### 2. 🔌 Offline-First & Background Sync
- **Local Storage**: IndexedDB store (`idb`) saves instruments, test observations, and evaluations locally on the user's machine.
- **Background Synchronization**: When internet connectivity returns, pending mutations are synchronized to the MongoDB Atlas cluster.
- **Client-Side PDF Generator**: Generates and downloads official certificates even without internet connection via `jsPDF`.

### 3. 🔄 Upgradable Calculation Engine
- Engine rules are stored as versioned JSON documents in MongoDB.
- Each generated test report locks to its original engine version (`R76-2006-v1`) for permanent legal auditability.
- Admins can upload and activate revised OIML recommendation JSON definitions in real-time from the **OIML Engine Manager** page.

### 4. 📄 Standardized Digital Certificate Export
- **PDF Export**: Clean, high-resolution official Legal Metrology certificates generated with testing authority seals and officer signature blocks.
- **DOCX Export**: Editable Microsoft Word document generation for designated laboratories.
- **Cloud Photo Upload**: Direct photo attachment for weighing scale nameplates and physical inspection photos via Cloudinary.

---

## 🛠️ Technology Stack

```
Frontend:   React 18 (JSX), Vite, Chart.js, IndexedDB (idb), jsPDF
Backend:    Node.js, Express.js, Mongoose, JWT Authentication, bcryptjs
Database:   MongoDB Atlas (Cloud Cluster)
CDN/Files:  Cloudinary SDK (Photo Uploads), pdfkit, docx
UI Theme:   Government of India Web Portal Design System (Vanilla CSS)
```



## 📁 Repository Structure

```
├── client/                      # React 18 + Vite Frontend Application
│   ├── public/                  # Static assets & Netlify redirects
│   ├── src/
│   │   ├── components/          # Gov Portal Header, Navbar, etc.
│   │   ├── context/             # AuthContext & OfflineContext
│   │   ├── pages/               # Dashboard, Reports, Instruments, OimlRules
│   │   ├── services/            # API client, IndexedDB store, Sync Manager
│   │   ├── utils/               # Authenticated PDF/DOCX download helpers
│   │   ├── App.jsx              # Main router & Protected routes
│   │   ├── index.css            # Gov of India Portal Design System
│   │   └── main.jsx             # React entrypoint
│   └── vercel.json              # Vercel deployment configuration
├── server/                      # Node.js + Express.js Backend API
│   ├── config/                  # MongoDB Atlas connection with fallback
│   ├── engine/                  # Pluggable OIML R-76 calculation engine
│   │   ├── tests/               # Eccentricity, Repeatability, Load, Discrimination
│   │   ├── defaultRules.js      # Seeded OIML standard rule tables
│   │   ├── mpeCalculator.js     # MPE mathematical calculation logic
│   │   └── index.js             # Versioned OimlEngine class
│   ├── middleware/              # JWT auth & Role-Based Access Control
│   ├── models/                  # Mongoose models (User, Instrument, TestReport, OimlRule)
│   ├── routes/                  # API endpoints (auth, instruments, reports, oimlRules, sync, upload)
│   ├── utils/                   # Server-side PDF & DOCX generators
│   └── server.js                # Express server entry point
├── TECHNICAL_DOCUMENTATION.md   # Mathematical equations & calculation architecture
└── README.md                    # Project overview & Judge instructions
```

---

## ⚖️ Compliance Standards Reference
- **Legal Metrology Act, 2009** (No. 1 of 2010)
- **Legal Metrology (General) Rules, 2011** (G.S.R. 71(E))
- **OIML R 76-1: Non-automatic weighing instruments** (Part 1: Metrological and technical requirements)
