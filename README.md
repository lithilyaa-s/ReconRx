# ReconRx 💊
### Intelligent Medication Reconciliation & Patient Safety Copilot

> **“From scattered medication records to one verified medication story.”**  
> *Secondary tagline: “ReconRx doesn't prescribe — it catches what might otherwise be missed.”*

---

## 🏥 Clinical Problem Space
At transitions of care (**Hospital Admission, Transfer, Referral, and Discharge**), medication reconciliation errors account for over **50% of all hospital medication discrepancies** and **20% of preventable adverse drug events (ADEs)**.

**ReconRx** is an intelligent clinical decision-support (CDS) copilot engineered to consolidate fragmented medication sources, perform deterministic and AI-powered reconciliation, detect clinical discrepancies (unintended omissions, dosage/frequency shifts, duplicate therapies, allergy contraindications), cross-reference **80 trained DrugBank/Micromedex Drug-Drug Interactions (DDIs)**, and empower healthcare professionals with human-in-the-loop review and audit sign-off.

---

## ⚡ 2-Minute Hackathon Demo Script for Judges

### A. Patient Flow: Prescription Submission & Verification
1. **Patient Login / Registration**:
   - Navigate to `/patient/login`.
   - Click **“Sign in as Ravi Kumar (P-10291)”** (or register a new patient).
2. **Submit Medical Prescriptions**:
   - On the **Patient Dashboard** (`/patient/dashboard`), click **“Submit Hospital Prescription”**.
   - Input hospital name (e.g. *Apollo Hospital*), date, doctor, upload a prescription photo/PDF, and enter medication line items.
   - Click **“Submit to Hospital for Reconciliation”** $\rightarrow$ It immediately routes to the doctor's queue with a *"New Patient Submission"* badge.
3. **Reconciliation Status Notification**:
   - The patient dashboard displays: *“Reconciliation Underway: Reviewed by Dr. Ananya Sharma”*.

---

### B. Doctor / Admin Flow: Reconciliation & Routing
1. **Doctor / Admin Login**:
   - Navigate to `/login` (or `/doctor/login`).
   - Click **“Continue with Demo Mode”** to sign in as **Dr. Ananya Sharma** (Clinical Reviewer / Admin).
2. **Access Detailed Clinical Functionalities** (Restricted to Doctor/Admin):
   - **Patients Registry (`/patients`)**: View all patients, filter by encounter, inspect submitted sources.
   - **Reconciliation Workbench (`/reconciliation/:id`)**: Compare previous vs current orders, view AI discrepancy observations, and cross-reference **80 trained DrugBank DDI rules**.
   - **AI Review Assistant**: Click **“Explain”** to see clinical mechanism and non-prescribing recommendations.
   - **Resolution & Finalization**: Resolve discrepancies (e.g. confirm dose change or re-order omitted statin) and click **“Finalize Medication Reconciliation”**.
3. **Automatic Routing to Patient Dashboard**:
   - Once finalized by the doctor, the verified plan is **automatically routed to the patient's dashboard**!
   - When the patient returns to `/patient/dashboard`, their dashboard activates with: **“Your Medication Plan is Verified & Ready!”**, showing daily schedules, doctor notes, and a printable wallet card.

---

## 🧠 Trained Clinical Datasets Integrated

1. **80-Rule Drug-Drug Interaction (DDI) Database**:
   - Pre-trained with 80 clinically validated interactions sourced from DrugBank 6.0 and Micromedex.
   - Includes **Warfarin + Ibuprofen** (GI bleed risk), **Simvastatin + Clarithromycin** (rhabdomyolysis), **Spironolactone + Potassium** (hyperkalemia), and **Clopidogrel + Omeprazole** (CYP2C19 antiplatelet attenuation).
   - Provides mechanisms, clinical effects, and recommended safer alternatives (e.g. Acetaminophen, Pantoprazole).

2. **Patient Pharmacology Cohort Dataset**:
   - 200+ patient records mapping Age, Medication Duration, Allergies, Blood Pressure, Cholesterol, and Electrolyte ratios (Na/K) for individualized care-transition risk profiling.

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 18, TypeScript, TailwindCSS, Lucide Icons, Vite, React Router v6.
- **Backend / API**: Node.js, Express, TypeScript, RESTful endpoints (`/api/v1/health`, `/api/v1/ddi`).
- **Safety Architecture**: Clean Architecture, Vertical Feature Slices, Deterministic Fallback Engine, and Non-Prescribing Decision Support Guardrails.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
cd client
npm install

# 2. Start the development server
npm run dev
```

Visit `http://localhost:3000` or `http://localhost:5173` to explore ReconRx!
