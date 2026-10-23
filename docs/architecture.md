# GlucoTwin Architecture & System Design

**Digital Twin Platform for Type 2 Diabetes (T2D)**  
*Digital Twin Challenge 2026 – Happiest Health*

---

## 1. System Architecture Overview

GlucoTwin fuses static clinical Electronic Health Records (EHR) with high-frequency dynamic wearable time-series to construct an algorithmic virtual patient. The system predicts an adverse acute glycemic event—**a glucose spike exceeding 180 mg/dL within the next 2 hours**—and provides an interactive clinical dashboard featuring real-time stream replay, SHAP-aligned feature attribution, and prospective "What-If" counterfactual simulation.

```mermaid
flowchart TD
    subgraph DataSources["1. Multimodal Data Ingestion (Synthetic Sandboxed)"]
        direction TB
        EHR["Static Clinical EHR<br/>• Age, Sex, BMI<br/>• HbA1c & Diagnosis Duration<br/>• Family History Flag<br/>• Genetic Allele Marker (TCF7L2, PPARG, KCNJ11)<br/>• Prescribed Pharmacotherapy"]
        Wearable["Dynamic Wearable Stream (5-min Epochs)<br/>• Continuous Glucose Monitoring (CGM)<br/>• Heart Rate (BPM)<br/>• Heart Rate Variability (HRV / RMSSD)<br/>• Sleep Architecture (Awake, Light, Deep, REM)<br/>• Step Counts (Physical Activity)"]
    end

    subgraph FeatureEngineering["2. Real-Time Feature Fusion Engine"]
        direction TB
        Fusion["Sliding Window Fusion (2-Hour Lookback)<br/>• glucose_last, glucose_mean_2h, glucose_slope_2h<br/>• glucose_std_2h (Variability), min/max<br/>• hr_mean_2h, hr_last, hrv_mean_2h, hrv_last<br/>• sleep_quality_score, steps_sum_2h<br/>• age, bmi, hba1c, diagnosis_years<br/>• genetic_risk_score, family_history_flag"]
    end

    subgraph MLModel["3. Machine Learning Inference Engine"]
        direction TB
        GBM["GradientBoostingClassifier (Scikit-Learn)<br/>• 120 Estimators, max_depth=4<br/>• Out-of-Time Train/Test Split (Days 1-10 vs 11-14)<br/>• Binary Target: max(glucose in next 2h) > 180 mg/dL<br/>• ROC-AUC: 0.990 | Accuracy: 94.7%"]
        Attribution["Feature Explainability & Risk Gauge<br/>• Gini Impurity Importance Attribution<br/>• Directional Impact (Risk Factor vs Protective)<br/>• Plain-Language Narrative & Recommendations"]
    end

    subgraph BackendAPI["4. FastAPI Application Layer"]
        direction TB
        Auth["JWT Authentication (8-Hour Expiry)<br/>• Passlib / Bcrypt Password Hashing<br/>• Attending Clinician RBAC"]
        Endpoints["REST API Endpoints<br/>• /auth/register, /auth/login, /auth/me<br/>• /patients, /patients/{id}<br/>• /patients/{id}/readings?hours=24<br/>• /patients/{id}/predict (Baseline & What-If)<br/>• /model/metrics"]
        DB[(SQLite3 Database<br/>users, patients, readings<br/>data/glucotwin.db)]
    end

    subgraph FrontendUI["5. React + Vite Clinician Dashboard"]
        direction TB
        DashView["Cohort Dashboard<br/>• 20 Virtual Patients<br/>• Risk Stratification Badges (High, Mod, Low)"]
        TwinView["Patient Digital Twin Interface<br/>• EHR Clinical Profile Card<br/>• 2-Second Live CGM Replay Engine (Recharts)<br/>• Clinical 180 mg/dL Threshold Alert Banner<br/>• Autonomic Telemetry (HR, HRV, Sleep, Steps)<br/>• Feature Contribution Hierarchy Chart"]
        WhatIf["Prospective What-If Counterfactual Simulator<br/>• Walking Steps Slider (0 - 10,000)<br/>• Carbohydrate Ingestion Slider (0 - 120g)<br/>• Sleep Duration Delta Slider (-3h to +3h)<br/>• Medication Adherence Toggle<br/>• Real-Time Risk Recalculation"]
    end

    DataSources --> FeatureEngineering
    FeatureEngineering --> MLModel
    MLModel --> BackendAPI
    BackendAPI <--> FrontendUI
    BackendAPI <--> DB
```

---

## 2. Component Breakdown

### 2.1 Multimodal Data Ingestion & Simulation
- **Static EHR Data**: Encapsulates immutable or slow-moving clinical variables:
  - Age (42–74)
  - Biological Sex
  - Body Mass Index (BMI: 23.8 to 36.8 kg/m²)
  - Glycated Hemoglobin (HbA1c: 5.9% to 10.2%)
  - Diagnosis duration (0.5 to 16.0 years)
  - Genetic risk variants (e.g. *TCF7L2* rs7903146 TT risk allele, *PPARG* Pro12Ala, *KCNJ11* E23K)
  - Current pharmacotherapy (Metformin, SGLT2 inhibitors, GLP-1 receptor agonists, sulfonylureas).
- **Dynamic Wearable Telemetry**: Synthesizes 14 days of continuous 5-minute readings (4,032 records per patient; 80,640 records total) modeling:
  - Estimated Average Glucose baseline: $\text{eAG} \approx 28.7 \times \text{HbA1c} - 46.7$
  - Diurnal Circadian Rhythm: Nocturnal dip (01:00–04:00) and hepatic dawn phenomenon gluconeogenesis surge (04:30–07:30).
  - Meal excursions: Postprandial excursion curves following breakfast (08:00), lunch (13:00), dinner (19:30), and snacks, scaled to patient insulin resistance.
  - Physical activity clearance: Step bouts stimulate muscular GLUT-4 translocation, clearing glucose over 45 minutes.
  - Autonomic tone: Heart rate and HRV (RMSSD) reflecting physiological stress, sleep architecture, and sympathetic/parasympathetic tone.

### 2.2 Feature Fusion Engine
For any assessment timestamp $T$, the engine looks back 2 hours ($T-2h$ to $T$, corresponding to 24 discrete 5-minute epochs) and extracts 18 fused features:
1. `glucose_last`: Current glucose reading
2. `glucose_mean_2h`: Mean glucose across the 2-hour window
3. `glucose_std_2h`: Glycemic variability (standard deviation)
4. `glucose_min_2h`: Window nadir
5. `glucose_max_2h`: Window peak
6. `glucose_slope_2h`: Rate of rise/fall ($\Delta \text{mg/dL} / \text{hour}$)
7. `hr_mean_2h`: Mean heart rate
8. `hr_last`: Current heart rate
9. `hrv_mean_2h`: Mean autonomic HRV (ms)
10. `hrv_last`: Current HRV
11. `sleep_quality_score`: Restorative sleep metric derived from deep/REM proportions
12. `steps_sum_2h`: Cumulative steps taken in the past 2 hours
13. `age`: Patient age
14. `bmi`: Body Mass Index
15. `hba1c`: Glycated hemoglobin percentage
16. `diagnosis_years`: Duration of Type 2 Diabetes
17. `family_history_flag`: 1 if positive family history, 0 otherwise
18. `genetic_risk_score`: Numeric allele burden derived from clinical genotype.

### 2.3 Machine Learning Pipeline
- **Target Formulation**: Binary adverse event:
  $$Y = 1 \iff \max_{t \in [T, T+2h]} (\text{glucose}_t) > 180\text{ mg/dL}$$
- **Out-of-Time Train/Test Partition**: To eliminate temporal data leakage, samples are partitioned chronologically across all 20 patients:
  - **Training Cohort**: Days 1 through 10 (71.4% of timeline)
  - **Evaluation Cohort**: Days 11 through 14 (28.6% out-of-time test set)
- **Classifier**: `GradientBoostingClassifier` with 120 estimators, learning rate of 0.08, and maximum depth of 4.
- **Evaluation**: Out-of-time ROC-AUC: **0.990**, Accuracy: **94.7%**, Precision: **96.8%**, Recall: **93.2%**.

### 2.4 Prospective "What-If" Counterfactual Simulation
The digital twin allows clinicians to prospectively test non-pharmacological and pharmacological interventions before they happen:
- **Exercise Intervention**: Clinician adjusts extra walking steps (0 to 10,000 steps). The twin simulates muscular glucose disposal, adjusting `steps_sum_2h`, blunting `glucose_slope_2h`, and reducing impending spike probability.
- **Dietary Intervention**: Clinician adjusts upcoming carbohydrate intake (0 to 120 grams). The twin models postprandial glucose flux.
- **Sleep & Recovery**: Adjusts previous night sleep delta (-3h to +3h), modeling autonomic recovery and cortisol resistance.
- **Medication Adherence**: Tests the glycemic impact of missing a prescribed antidiabetic medication dose.

---

## 3. Security, Privacy & Compliance

- **DPDP & HIPAA Compliance**: The system operates exclusively within a synthetic data sandbox. All clinical metrics, names, and readings are generated deterministically via physiological equations. No real patient data is ingested or stored.
- **Authentication**: Stateless JSON Web Tokens (JWT) signed via HMAC-SHA256 with an 8-hour expiry window. Passwords hashed using `bcrypt` (pinned to `bcrypt==4.0.1` to eliminate C-library compatibility anomalies).
- **CORS Protection**: Whitelisted origin boundaries (`localhost:3000`, `localhost:5173`) with strict header filtering.
