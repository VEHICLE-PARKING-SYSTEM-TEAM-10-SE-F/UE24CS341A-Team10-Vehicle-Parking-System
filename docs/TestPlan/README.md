# Software Test Plan (STP) — Vehicle Parking System (v1.1)

**Project:** Vehicle Parking System (Team 10, Section F — UE24CS341A Software Engineering Mini-Project)  
**Lead QA & Reviewer:** Ramitha R (`PES1UG24CS368`, `@Ramitha-R6`)  
**Date:** October 7, 2026  
**Document Version:** STP v1.1 (Aligned with SRS v1.1 and SAD v1.1)

---

## 1. Document Deliverables

- **Submission PDF:** [`Vehicle_Parking_System_Test_Plan_v1.1.pdf`](Vehicle_Parking_System_Test_Plan_v1.1.pdf)
- **Editable Source:** [`Vehicle_Parking_System_Test_Plan_v1.1.docx`](Vehicle_Parking_System_Test_Plan_v1.1.docx)

---

## 2. Testing Scope & Objectives

The Software Test Plan specifies the testing strategy, resources, schedule, and test cases for verifying and validating the Vehicle Parking System (VPS).

### Objectives:
1. Validate 100% of functional requirements (FR-01 to FR-23) defined in SRS v1.1.
2. Verify all non-functional requirements (NFR-01 to NFR-07) covering response times, concurrency, and persistence.
3. Rigorously validate the security architecture (SEC-01 to SEC-07) including JWT authentication, Role-Based Access Control (RBAC), bcrypt credential hashing, and input validation.
4. Verify all business rules (BR-01 to BR-05) for slot allocations, rate calculations, and 15-minute grace periods.

---

## 3. Test Organization & Roles

| Role | Team Member | Primary Responsibilities |
| :--- | :--- | :--- |
| **QA Lead & Test Plan Author** | **Ramitha R (`PES1UG24CS368`)** | Test plan authoring, security test suites, auth verification, concurrency/reliability verification |
| **Developer / Module Tester** | **Pandi Snehitha (`PES1UG24CS315`)** | Vehicle registration, slot management, parking entry/exit integration tests |
| **Developer / Module Tester** | **Pramiti Ragavendra Udupa (`PES1UG24CS331`)** | Fee calculations, search/history, occupancy reporting, performance benchmarking |

---

## 4. Test Levels and Strategy

1. **Unit Testing:**
   - Isolated logic testing (fee calculations, bcrypt hashing, schema validators, slot type matching).
   - Executed using Jest with in-memory MongoDB.
2. **Integration Testing:**
   - Testing end-to-end REST API workflows (Login -> Allocation -> Entry -> Exit -> Fee Calculation -> Slot Release).
3. **Security Testing:**
   - Verification of token expiration, invalidation on logout, 403 Forbidden on privilege escalation, and SQL/NoSQL injection prevention.
4. **Performance & Concurrency Testing:**
   - 50 concurrent simulated users for search queries (p95 < 2.0s).
   - Concurrent vehicle allocations on single available slots (prevent double-booking).
5. **System & Acceptance Testing:**
   - Cross-browser usability and responsive layout verification (desktop and mobile viewports).

---

## 5. Requirements Traceability Matrix (37 Test Cases)

| Requirement ID | Module / Feature | Test Case ID | Test Case Summary | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Authentication | `TC-AUTH-01` | Valid login with username and password | Session token issued, role dashboard accessible |
| **FR-02** | Authentication | `TC-AUTH-02` | Invalid credentials rejected with generic error | Generic error displayed, no password/username leakage |
| **FR-03** | Authentication | `TC-AUTH-03` | Logout invalidates server session | Token blacklisted, protected endpoints return 401 |
| **FR-04** | User Management | `TC-AUTH-04` | Admin manages user accounts & roles | Users created, updated, roles assigned correctly |
| **FR-05** | Access Control | `TC-AUTH-05` | Out-of-role request denied with HTTP 403 | Forbidden status returned, UI actions hidden |
| **FR-06** | Vehicle Registration | `TC-VEH-01` | Vehicle registration with valid plate & type | Vehicle record stored in database |
| **FR-07** | Vehicle Registration | `TC-VEH-02` | Validation of plate format and uniqueness | Duplicate plate numbers rejected with 409/400 |
| **FR-08** | Slot Management | `TC-SLOT-01` | Admin adds parking slots | Slots created with correct vehicle type and number |
| **FR-09** | Slot Management | `TC-SLOT-02` | Admin sets slot Unavailable / Available | Status changed; cannot set occupied slot unavailable |
| **FR-10** | Slot Availability | `TC-SLOT-03` | Real-time available slot count per type | Available count updates immediately |
| **FR-11** | Vehicle Entry | `TC-PARK-01` | Record entry with automatic slot allocation | First available slot of correct type allocated |
| **FR-12** | Vehicle Entry | `TC-PARK-02` | Refusal when all slots of requested type are full | Entry rejected with clear "Capacity Full" alert |
| **FR-13** | Vehicle Entry | `TC-PARK-03` | Atomic slot allocation under concurrency | Two entries cannot be assigned the same slot |
| **FR-14** | Vehicle Entry | `TC-PARK-04` | Generate printed/displayed parking ticket | Ticket contains Ticket ID, Slot #, Entry Time |
| **FR-15** | Vehicle Exit | `TC-PARK-05` | Record vehicle exit timestamp | Exit time stamped, duration calculated |
| **FR-16** | Fee Calculation | `TC-FEE-01` | 15-minute grace period fee calculation | Free exit within 15 min; full hourly rate beyond |
| **FR-17** | Fee Summary | `TC-FEE-02` | Display detailed exit fee breakdown | Shows entry, exit, duration, rate, total fee |
| **FR-18** | Exit Confirmation | `TC-PARK-06` | Payment confirmation and slot release | Slot immediately marked Available |
| **FR-19** | Fee Configuration | `TC-FEE-03` | Admin updates hourly rates per vehicle type | New rate takes effect only for subsequent exits |
| **FR-20** | Vehicle Search | `TC-SRCH-01` | Search parked vehicle by license plate | Returns slot number and parking duration |
| **FR-21** | Vehicle Status | `TC-SRCH-02` | Real-time vehicle location & status display | Correct status (Parked / Exited) returned |
| **FR-22** | Parking History | `TC-SRCH-03` | Historical parking log per license plate | Complete past parking session records displayed |
| **FR-23** | Reporting | `TC-REP-01` | Generate Parking Occupancy Report | Total entries, exits, revenue, and occupancy % |
| **NFR-01** | Performance | `TC-PERF-01` | Response time under normal load (p95 < 1.0s) | APIs respond in under 1 second |
| **NFR-02** | Performance | `TC-PERF-02` | Response time under peak load (50 users) | Search p95 < 2.0s under simulated concurrent load |
| **NFR-03** | Performance | `TC-PERF-03` | Entry & exit transaction processing time | Transaction completed in < 1.5 seconds |
| **NFR-04** | Concurrency | `TC-CONC-01` | Race condition protection on slot allocation | Zero double-allocations during 20 concurrent entries |
| **NFR-05** | Reliability | `TC-REL-01` | Data persistence across server restart | State restored without data loss after restart |
| **NFR-06** | Usability | `TC-USAB-01` | Operator tasks completed in <= 3 clicks | Smooth navigation, high usability score |
| **NFR-07** | Compatibility | `TC-COMP-01` | Responsive design on desktop and mobile viewports | Clean rendering across screen widths >= 360px |
| **SEC-01** | Security | `TC-SEC-01` | Authentication enforced on all endpoints | Unauthenticated requests receive 401 Unauthorized |
| **SEC-02** | Security | `TC-SEC-02` | Server-side role-based authorization | Operator cannot access Admin routes |
| **SEC-03** | Security | `TC-SEC-03` | Secure password hashing (bcrypt, salt >= 10) | Passwords never stored or transmitted in plain text |
| **SEC-04** | Security | `TC-SEC-04` | HTTPS / TLS 1.2+ encryption in transit | Insecure HTTP redirected to secure HTTPS |
| **SEC-05** | Security | `TC-SEC-05` | Strict server-side input validation | Malformed payloads rejected with 400 Bad Request |
| **SEC-06** | Security | `TC-SEC-06` | Inactivity session timeout (15 minutes) | Idle sessions invalidated, re-login required |
| **SEC-07** | Security | `TC-SEC-07` | Secrets kept in environment configuration | Zero hardcoded API keys or credentials in code |
