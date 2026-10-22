# Vehicle Parking System (Team 10) — Progress & Team Execution Guide

**Course:** Software Engineering (UE24CS341A) · PES University  
**Team 10 (Section F):**
- Ramitha R (`PES1UG24CS368`) — QA Lead, Auth, Security & Reliability
- Pandi Snehitha (`PES1UG24CS315`) — Vehicles, Slots, Entry/Exit & Performance
- Pramiti Ragavendra Udupa (`PES1UG24CS331`) — Setup/CI, Fees, Search & Reports

---

## 1. What Has Been Completed So Far

### A. Deliverables & Documentation (Part-1)
- [SRS v1.1](docs/SRS/Vehicle_Parking_System_SRS_v1.1.pdf): 23 Functional Requirements (`FR-01` to `FR-23`), 7 Non-Functional (`NFR-01` to `NFR-07`), 7 Security (`SEC-01` to `SEC-07`), and 5 Business Rules (`BR-01` to `BR-05`).
- [SAD v1.1](docs/SAD/Team10_Vehicle_Parking_System_SAD.pdf): Layered 3-tier MERN architecture, 5 ADRs, STRIDE threat model, sequence diagrams (SD-1 to SD-4), and role matrix.
- [Test Plan v1.1](docs/TestPlan/Vehicle_Parking_System_Test_Plan_v1.1.pdf): 37 test cases covering 100% of requirements.
- [Sprint Plan](docs/Sprint-Plan.md): 38 stories across 2 sprints (105 story points total).

### B. Project Setup (Task #1 / SETUP — 5 SP) ✅
- Express + MongoDB replica-set server framework with in-memory MongoDB runner (`npm run dev:db`).
- React 18 + Vite frontend framework.
- GitHub Actions CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) running automated lint and test checks.
- Merged to `main` via PR #39.

### C. Ramitha's Tasks: Authentication & Access Control (Sprint 1 — 19 SP) ✅
- **Completed Requirements:**
  - `FR-01`: Login with username and password (`TC-AUTH-01`).
  - `FR-02`: Generic message `"Invalid username or password"` on credential failure (`TC-AUTH-02`).
  - `FR-03`: Logout invalidating the session in MongoDB (`TC-AUTH-03`).
  - `FR-05`: Out-of-role requests denied with HTTP 403 Forbidden (`TC-AUTH-05`).
  - `SEC-01`: Authentication required on all protected endpoints (`TC-SEC-01`).
  - `SEC-02`: Server-side role-based authorization (`TC-SEC-02`).
  - `SEC-03`: Passwords stored as salted bcrypt hashes with cost factor 12 (`TC-SEC-03`).
  - `SEC-05`: Server-side input validation and NoSQL operator/script sanitization (`TC-SEC-05`).
  - `SEC-07`: Secrets strictly loaded from `.env` (`TC-SEC-07`).
- **Files Implemented:**
  - `server/src/models/User.js`, `server/src/models/Session.js`
  - `server/src/utils/password.js`, `server/src/services/authService.js`
  - `server/src/middleware/authenticate.js`, `server/src/middleware/authorize.js`, `server/src/middleware/validate.js`
  - `server/src/routes/auth.routes.js`, `server/scripts/seed.js`
  - `client/src/auth.jsx`, `client/src/pages/Login.jsx`, `client/src/App.jsx`
- **Verification:** All 26 Jest unit and integration tests passing; frontend builds cleanly.
- **GitHub Status:** Merged into `main` via **PR #40** (Commit `19d4305`). Local `main` is up to date.

---

## 2. Entire Roadmap & Commands for Pandi Snehitha

**Assigned Scope:** 33 Story Points (24 SP in Sprint 1, 9 SP in Sprint 2)  
**GitHub Account:** `@snehitha796`  
**GitHub Branch:** `feature/vehicles-slots-parking`

### Snehitha's Sprint 1 Tasks (24 SP)
1. **FR-06** (`#7`): Register a vehicle (unique uppercase registration number, type: Two-wheeler / Car / Other).
2. **FR-07** (`#8`): Reject invalid, over-long, or duplicate vehicle registration.
3. **FR-08** (`#9`): Administrator adds a parking slot (unique Slot ID, type, initial status `Available`).
4. **FR-11** (`#12`): Record vehicle entry (reject if vehicle already has an active parking record).
5. **FR-12** (`#13`): Automatic allocation of lowest matching Slot ID (with manual attendant override).
6. **FR-13** (`#14`): Refuse entry with `"No parking slot available for this vehicle type"` when full.
7. **FR-14** (`#15`): Atomic parking record creation with ticket number and slot status set to `Occupied`.
8. **FR-15** (`#16`): Record vehicle exit timestamp on the active record.

---

### Step-by-Step Commands for Snehitha

#### Step 1: Switch to the feature branch and update
Open PowerShell in `SE_mini`:
```powershell
# 1. Update main first
git checkout main
git pull origin main

# 2. Check out the vehicles & slots branch
git checkout -b feature/vehicles-slots-parking origin/feature/vehicles-slots-parking
```

#### Step 2: Install dependencies & run test validation
```powershell
# In server directory:
cd server
npm install
npm run lint
npm test
```

#### Step 3: Verify the frontend build
```powershell
# In client directory:
cd ../client
npm install
npm run lint
npm run build
```

#### Step 4: Push to GitHub
```powershell
cd ..
git push origin feature/vehicles-slots-parking
```

#### Step 5: Open & Merge the Pull Request on GitHub
1. Open this link in the browser:
   `https://github.com/VEHICLE-PARKING-SYSTEM-TEAM-10-SE-F/UE24CS341A-Team10-Vehicle-Parking-System/compare/main...feature/vehicles-slots-parking?expand=1`
2. **Title:**
   ```text
   FR-06, FR-07, FR-08, FR-11 - FR-15: Vehicles, Slots, Entry & Exit Recording
   ```
3. **Description:**
   ```markdown
   ## What this PR does
   Implements vehicle registration, parking slot creation, vehicle entry with atomic slot allocation, and vehicle exit recording.

   ## Stories
   Closes #7 (VPS-18) - FR-06: Register a vehicle
   Closes #8 (VPS-19) - FR-07: Reject invalid or duplicate registration
   Closes #9 (VPS-20) - FR-08: Admin adds a parking slot
   Closes #12 (VPS-23) - FR-11: Record vehicle entry
   Closes #13 (VPS-24) - FR-12: Automatic & manual slot allocation
   Closes #14 (VPS-25) - FR-13: Refuse entry when no slot is available
   Closes #15 (VPS-26) - FR-14: Atomic parking record with ticket number
   Closes #16 (VPS-27) - FR-15: Record vehicle exit

   ## Checklist
   - [x] Follows SRS v1.1 and SAD v1.1 design
   - [x] Tests added and passing (TC-VEH-01/02/03, TC-SLOT-01, TC-ENT-01/02/03/04, TC-EXT-01/02)
   - [x] CI is green

   ## Deviations from the documents
   None.
   ```
4. Wait for GitHub Actions CI to pass ✅, then merge into `main`.

---

## 3. Entire Roadmap & Commands for Pramiti Ragavendra Udupa

**Assigned Scope:** 37 Story Points (20 SP in Sprint 1, 17 SP in Sprint 2)  
**GitHub Account:** `@pramitiudupa`  
**GitHub Branch:** `feature/fee-search-status`

### Pramiti's Sprint 1 Tasks (20 SP)
1. **SETUP** (`#1`): Project skeleton, local MongoDB, CI with GitHub Actions *(Done)*.
2. **FR-10** (`#11`): Slot availability grid view (green/red/grey) and count summary by type.
3. **FR-16** (`#17`): Automated fee calculation with 15-minute fixed grace period ($\lceil (d - 15) / 60 \rceil \times \text{rate}$).
4. **FR-17** (`#18`): Present fee summary modal before confirming exit.
5. **FR-18** (`#19`): Exit confirmation marking record `COMPLETED` and releasing slot to `AVAILABLE`.
6. **FR-20** (`#21`): Search vehicle by registration number.
7. **FR-21** (`#22`): Display vehicle status (`Parked` with Slot ID and duration vs `Not Parked`).

---

### Step-by-Step Commands for Pramiti

#### Step 1: Switch to the feature branch and update
Open PowerShell in `SE_mini`:
```powershell
# 1. Update main (after Snehitha's PR is merged)
git checkout main
git pull origin main

# 2. Check out the fee, search and status branch
git checkout -b feature/fee-search-status origin/feature/fee-search-status
```

#### Step 2: Install dependencies & run test validation
```powershell
# In server directory:
cd server
npm install
npm run lint
npm test
```

#### Step 3: Verify the frontend build
```powershell
# In client directory:
cd ../client
npm install
npm run lint
npm run build
```

#### Step 4: Push to GitHub
```powershell
cd ..
git push origin feature/fee-search-status
```

#### Step 5: Open & Merge the Pull Request on GitHub
1. Open this link in the browser:
   `https://github.com/VEHICLE-PARKING-SYSTEM-TEAM-10-SE-F/UE24CS341A-Team10-Vehicle-Parking-System/compare/main...feature/fee-search-status?expand=1`
2. **Title:**
   ```text
   FR-10, FR-16, FR-17, FR-18, FR-20, FR-21: Slot Availability, Fee Calculation, Exit Confirmation & Search
   ```
3. **Description:**
   ```markdown
   ## What this PR does
   Implements slot availability grid with counts, 15-minute grace period fee calculation, exit confirmation modal with slot release, and vehicle search with current parking status.

   ## Stories
   Closes #11 (VPS-22) - FR-10: Display slot availability with counts
   Closes #17 (VPS-28) - FR-16: Fee calculation with fixed 15-min grace period
   Closes #18 (VPS-29) - FR-17: Show fee summary before confirming exit
   Closes #19 (VPS-30) - FR-18: Complete record and release slot on exit
   Closes #21 (VPS-32) - FR-20: Search a vehicle by registration number
   Closes #22 (VPS-33) - FR-21: Show current status of a vehicle

   ## Checklist
   - [x] Follows SRS v1.1 and SAD v1.1 design
   - [x] Tests added and passing (TC-SLOT-03, TC-EXT-01/03, TC-FEE-02, TC-SRCH-01/02)
   - [x] CI is green

   ## Deviations from the documents
   None.
   ```
4. Merge into `main` after CI passes ✅.

---

## 4. Master Daily Developer Commands Cheatsheet

| Task | Command | Directory |
|---|---|---|
| **1. Start Dev Database** | `npm run dev:db` | `server/` |
| **2. Seed Initial Accounts** | `npm run seed` | `server/` |
| **3. Start API Server** | `npm run dev` | `server/` |
| **4. Start React Web Client** | `npm run dev` | `client/` |
| **5. Run Backend Lint** | `npm run lint` | `server/` |
| **6. Run Backend Tests** | `npm test` | `server/` |
| **7. Run Frontend Lint** | `npm run lint` | `client/` |
| **8. Build Frontend** | `npm run build` | `client/` |
| **9. Switch & Sync `main`** | `git checkout main && git pull origin main` | Root (`SE_mini/`) |
