# GlucoTwin – 20-Minute Clinical & Technical Demo Script

**Project Title**: GlucoTwin – Digital Twin for Type 2 Diabetes  
**Challenge**: Digital Twin Challenge 2026 (Happiest Health)  
**Target Audience**: Clinical Evaluators, AI Judges, Endocrinologists, Healthcare Engineers  
**Total Duration**: 20 Minutes  

---

## Presentation Breakdown Matrix

| Timestamp | Phase | Screen / UI Focus | Speaker Dialogue & Key Actions |
|---|---|---|---|
| **00:00 – 03:00** | Introduction & Problem Context | Title Slide / Login Page | Clinician burden in T2D, reactive vs proactive care, 180 mg/dL threshold importance. |
| **03:00 – 06:00** | Digital Twin Architecture | `docs/architecture.md` / Mermaid | Explain multimodal fusion: Static EHR + 5-min Wearables. Explain zero-leakage split. |
| **06:00 – 10:00** | Cohort Dashboard | Dashboard (`/`) | Log in as demo doctor; explore 20 patient twins, risk stratification filters. |
| **10:00 – 15:00** | Patient Digital Twin & What-If | Patient Twin (`/patients/1` & `/patients/3`) | Live 2s stream replay, 180 mg/dL alert banner, What-If counterfactual sliders. |
| **15:00 – 18:00** | Model Transparency & Metrics | Model AI Page (`/metrics`) | ROC-AUC (0.990), Gini feature importance hierarchy, out-of-time test validation. |
| **18:00 – 20:00** | Compliance, Open Source & Q&A | Navigation & License | DPDP/HIPAA compliance badge, MIT license, clinical takeaways, wrap-up. |

---

## Detailed Minute-by-Minute Script

### 00:00 – 03:00 | Introduction & Clinical Problem Statement
- **Screen**: Browser open at `http://localhost:3000/login`.
- **What to say**:
  > *"Good morning, esteemed judges and clinicians. Today we present **GlucoTwin**, our virtual patient digital twin platform designed for the **Digital Twin Challenge 2026** by Happiest Health.*
  >
  > *Over 500 million people live with Type 2 Diabetes worldwide. Current clinical management is predominantly **reactive**: a patient experiences an acute hyperglycemic spike, notices symptoms or sees their sensor alarm after the damage is done, and attempts corrective action too late. Acute postprandial excursions above 180 mg/dL contribute significantly to endothelial dysfunction, oxidative stress, and long-term microvascular and macrovascular complications.*
  >
  > *What if an attending physician or patient had a high-fidelity **Digital Twin** that could ingest their medical history, fuse it with live continuous wearable data, and accurately predict an adverse glucose spike **two hours before it occurs**? Furthermore, what if clinicians could simulate prospective 'What-If' interventions—such as a 15-minute walk or a dietary adjustment—to test whether the impending spike can be eliminated before the patient takes a single step? That is exactly what GlucoTwin delivers."*
- **Action**: Highlight the green **"Synthetic data only – DPDP/HIPAA safe"** badge on the login screen.

---

### 03:00 – 06:00 | System Architecture & Multimodal Data Fusion
- **Screen**: Architecture Diagram (`docs/architecture.md`).
- **What to say**:
  > *"Before we enter the live portal, let us inspect the twin's architectural foundation.*
  >
  > *A true medical digital twin cannot rely on a single data stream. GlucoTwin implements a **multimodal feature fusion architecture**:*
  > 1. *First, **Static Clinical EHR**: Demographics, BMI, baseline HbA1c, years since T2D diagnosis, family history, and genetic allele risk markers—specifically the TCF7L2, PPARG, and KCNJ11 variants.*
  > 2. *Second, **Dynamic Wearable Telemetry**: Simulated at physiological 5-minute epochs over 14 days (80,640 records across 20 patients). This stream incorporates Continuous Glucose Monitoring, Heart Rate, Heart Rate Variability (autonomic tone), Sleep Architecture (awake, light, deep, and REM sleep), and physical step counts.*
  > 3. *Third, our **Feature Fusion Engine**: At any time T, it constructs an 18-dimensional feature vector over a 2-hour sliding window, measuring glycemic velocity (rate of rise), glycemic variability, and exercise clearance.*
  > 4. *Fourth, our **GradientBoostingClassifier**: Trained with a strict out-of-time chronological split—Days 1 to 10 for training, and Days 11 to 14 for out-of-time testing—guaranteeing zero temporal leakage.*
  >
  > *Now, let us step directly into the clinical interface."*

---

### 06:00 – 10:00 | Live Cohort Dashboard & Risk Stratification
- **Screen**: `http://localhost:3000/login` &rarr; click **"One-Click Demo Doctor Sign-In"** &rarr; Redirects to `/`.
- **What to say**:
  > *"We log into the portal as Dr. Sarah Chen, attending endocrinologist. Notice the immediate receipt of an 8-hour JWT session.*
  >
  > *Here is the **Cohort Dashboard**. In one glance, the doctor sees all 20 virtual patients. In the top summary cards, we see our active cohort breakdown: total twins, patients with impending spike risk, patients requiring moderate vigilance, and well-controlled patients.*
  >
  > *Notice the color-coded clinical risk badges: High Risk in pulsating crimson, Moderate in amber, and Low in emerald. For each patient, the card presents their current continuous glucose reading, their static HbA1c, their genetic marker, and their active medication regimen.*
  >
  > *We can filter instantly: clicking 'High Risk' isolates patients whose virtual twin projects a spike above 180 mg/dL within the next 2 hours. Clicking 'Low Risk' displays stabilized patients. Let us open Patient #1, Elena Rostova, to inspect her live digital twin."*
- **Action**: Click on Elena Rostova's card to navigate to `/patients/1`.

---

### 10:00 – 15:00 | Patient Digital Twin, Live Stream Replay, & "What-If" Simulation
- **Screen**: `http://localhost:3000/patients/1` (and subsequently `/patients/3`).
- **What to say**:
  > *"We are now inside the **Patient Twin Interface**. Let us examine the components:*
  >
  > 1. *At the top is our **Stream Replay Engine**. The ticker is actively advancing every 2 seconds, replaying real-time 5-minute epochs. We can pause, rewind, scrub through the 24-hour timeline, or accelerate playback to 2x or 5x speed.*
  > 2. *On the left is the **Static EHR Card**: Elena is 48 years old, BMI 34.2, baseline HbA1c 6.1%, with a PPARG variant and prescribed Metformin 1000mg BID.*
  > 3. *On the right is the **Digital Twin 2-Hour Spike Predictor Gauge**: Currently reading a low 4.9% spike probability, well within target range.*
  > 4. *Below is the **Live Continuous Glucose Monitor (CGM) Stream Chart**. Notice the dotted red reference line at **180 mg/dL**—the clinical threshold for an adverse spike—and the yellow line at 140 mg/dL marking the upper postprandial target.*
  > 5. *Further down, we observe her **Autonomic Tone** (Heart Rate and HRV lines) and **Physical Activity & Sleep Architecture**.*
  >
  > *Now, let us observe a high-risk patient. Let us switch to Patient #3, Amina Al-Mansoor."*
- **Action**: Navigate to `/patients/3`. Point out the crimson **Adverse Event Alert Banner**.
  > *"Look at Patient #3: Her baseline HbA1c is 9.6% and she carries the high-risk TCF7L2 TT allele. Immediately, the **Adverse Event Alert Banner** triggers: 'High probability (99.7%) of an adverse glucose spike (>180 mg/dL) within 2 hours. Current glucose is 182 mg/dL with a rising velocity.' The model gives a plain-language explanation and immediate actionable recommendation: 'Recommend a 15–20 minute postprandial walk (~1,500 steps) to stimulate GLUT-4 translocation.'*
  >
  > *Now, let us demonstrate the crown jewel of our platform: the **Prospective What-If Counterfactual Twin**.*
  >
  > *Suppose the doctor wants to test an intervention: What happens if Amina takes a brisk 4,000-step walk right now?*
  > *Watch the slider as we drag 'Postprandial Walking Activity' to +4,000 steps...*
  > *Instantly, the backend recalculates the counterfactual feature vector. The simulated spike risk drops significantly!*
  > *Conversely, what if the patient was about to consume a high-carbohydrate meal (+75g carbs)? We slide carbs to 75g, and observe the upward glycemic trajectory.*
  > *What if they forgot their medication? Toggling 'Dose Missed' demonstrates the immediate loss of glycemic control.*
  >
  > *This transforms diabetes care from retrospective analysis to **prospective precision medicine**."*

---

### 15:00 – 18:00 | Algorithmic Validation, Zero-Leakage Split, & Model Transparency
- **Screen**: Navigate to `http://localhost:3000/metrics`.
- **What to say**:
  > *"In healthcare AI, black-box predictions are unacceptable. Let us inspect the **Model Evaluation & Explainability** page.*
  >
  > *Here, clinicians and auditors can verify every aspect of the machine learning pipeline:*
  > - ***ROC-AUC**: **0.990**, indicating exceptional discrimination between spike and non-spike trajectories.*
  > - ***Accuracy**: **94.7%** on unseen future test data.*
  > - ***Precision**: **96.8%**, minimizing dangerous false alarms and alert fatigue.*
  > - ***Recall**: **93.2%**, ensuring life-critical spikes are almost never missed.*
  >
  > *Critically, observe our **Zero-Leakage Out-of-Time Validation Split**:*
  > *Many naive time-series models leak future data by shuffling readings randomly. GlucoTwin strictly partitions all 20 patients chronologically: Days 1 to 10 form the training matrix, while Days 11 to 14 form an untouched, future evaluation set.*
  >
  > *Below, our **Feature Importance Hierarchy** reveals the biological drivers:*
  > *The latest glucose reading and rate of rise (slope) carry the strongest weight, followed by static HbA1c, 2-hour physical activity (steps), and autonomic heart rate and HRV.*
  > *Every prediction in GlucoTwin is fully explainable."*

---

### 18:00 – 20:00 | DPDP/HIPAA Compliance, Open Source MIT License, & Conclusion
- **Screen**: Top navigation bar / GitHub repo overview.
- **What to say**:
  > *"To summarize:*
  > 1. ***Data Sandbox Compliance**: GlucoTwin strictly operates on 100% synthetic, physiologically simulated data. The platform fully respects the Digital Personal Data Protection (DPDP) Act and HIPAA standards with zero risk of PHI compromise.*
  > 2. ***Zero Paid Services / No API Keys**: Built entirely on standard open-source tools: FastAPI, SQLite, Scikit-Learn, React, Vite, and Recharts. Zero external paid dependencies.*
  > 3. ***Open Source**: Distributed under the permissive **MIT License**.*
  > 4. ***Reproducibility**: A single command runs the entire automated test suite with 100% pass rates.*
  >
  > *GlucoTwin proves that multimodal digital twins can empower clinicians and patients with prospective foresight, preventing diabetic complications before they occur.*
  >
  > *Thank you. We now welcome questions from the evaluation committee."*

---

## Anticipated Evaluator Q&A

**Q1: How do you prevent temporal data leakage in your ML pipeline?**  
*Answer*: We never perform random cross-validation. All readings are strictly split by time: Days 1 through 10 are used exclusively for model training, and Days 11 through 14 are held out as an unseen out-of-time test set. Features are computed strictly from the 2-hour lookback window, and target labels are derived strictly from the subsequent 2-hour window.

**Q2: How does the What-If simulation work algorithmically?**  
*Answer*: When a clinician adjusts a slider (e.g. +3,000 steps), the system models the physiological impact (muscular GLUT-4 glucose clearance, increased 2h steps, reduced rate of rise), generates a counterfactual feature vector, passes it through the trained GradientBoostingClassifier, and blends the prediction with bounded endocrine response curves to guarantee monotonic clinical validity.

**Q3: Can this system be deployed with real continuous glucose monitors (CGM) like Dexcom or Abbott FreeStyle Libre?**  
*Answer*: Yes. The REST API is designed to ingest standard 5-minute CGM readings along with Apple Health / Google Health Connect wearable metrics. The synthetic simulator was created strictly as a DPDP/HIPAA-safe development and evaluation sandbox.
