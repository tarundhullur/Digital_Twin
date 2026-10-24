# GlucoTwin — AI-Powered Digital Twin for Type 2 Diabetes

**Tagline:** Predict. Simulate. Prevent.

**Challenge:** Digital Twin Challenge 2026  
**Organizer:** Happiest Health  
**Platform:** Unstop  
**Team Name:** Victory Minds

---

## 1. Project Overview

GlucoTwin is an AI-powered digital twin platform designed to predict potential blood glucose spikes in people with Type 2 Diabetes (T2D).

The platform combines synthetic clinical records with synthetic wearable telemetry to create computational representations of virtual patients. It estimates the probability of glucose exceeding 180 mg/dL within the next two hours and allows users to explore hypothetical lifestyle scenarios through an interactive simulation engine.

The prototype demonstrates how digital twin technology, machine learning, explainable AI, and interactive visualization can support predictive diabetes management.

**Important:** This is a research prototype using synthetic data, not a clinically validated medical device.

## 2. Problem Statement

Traditional diabetes management often relies on periodic laboratory tests and glucose monitoring that shows current or past glucose levels. Predicting future glucose changes is challenging because glucose levels are influenced by multiple interacting factors, including meals, physical activity, sleep, stress, medication, and individual metabolic characteristics.

GlucoTwin explores a predictive approach that estimates potential glucose spikes and enables users to investigate hypothetical interventions before making real-world decisions.

## 3. Healthcare Use Case

GlucoTwin is designed as a clinical decision-support concept for Type 2 Diabetes.

Key use cases include:

- **Predictive risk estimation:** Estimate the probability of glucose exceeding 180 mg/dL within the next two hours.
- **Virtual patient monitoring:** Explore glucose, heart rate, HRV, sleep, and activity data.
- **What-If simulation:** Compare hypothetical changes in walking, carbohydrate intake, sleep duration, and medication adherence.
- **Explainable AI:** Display feature importance information associated with model predictions.
- **Educational visualization:** Explore a procedural 3D pancreas and islet-cell representation.
- **AI assistance:** Provide conversational educational information through the Gemini API.

The platform uses synthetic virtual patients. Its outputs are not medical diagnoses or validated treatment recommendations.

## 4. Team Details

**Team Name:** Victory Minds

| Team Member   | Role |
|---            |---|
| Tarun Hullur  | Team Leader |
| Santhosh Desu | Team Member |


## 5. College / Incubator Information

- **College/University:** sanjay ghodawat university
- **Incubator:** N/A
- **Challenge:** Digital Twin Challenge 2026 — Happiest Health on Unstop

## 6. Technical Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- Three.js
- Interactive charts and dashboard components

### Backend
- Node.js
- Express.js
- Python
- FastAPI

### Database and Authentication
- SQLite
- JSON Web Tokens (JWT)

### Machine Learning
- Python
- scikit-learn
- GradientBoostingClassifier

### AI and External Integrations
- Gemini API for conversational AI
- Text-to-speech for audio briefings
- Google Maps integration for healthcare location discovery

## 7. AI/ML Model and Framework Details

GlucoTwin uses a **GradientBoostingClassifier** implemented with scikit-learn.

**Model configuration**
- Estimators: 120
- Maximum tree depth: 4
- Input: 18-feature multimodal vector
- Prediction target: Whether the maximum glucose level in the following two hours exceeds 180 mg/dL
- Training period: Days 1–10
- Chronological evaluation period: Days 11–14

### Input Features

The model uses features derived from glucose dynamics, heart rate, heart rate variability, sleep quality, physical activity, and synthetic clinical characteristics.

### Reported Synthetic-Data Evaluation Results

| Metric | Reported result |
|---|---:|
| Accuracy | 94.7% |
| Precision | 96.8% |
| Recall | 93.2% |
| F1-score | 95.0% |
| ROC-AUC | 0.990 |

These figures represent the project's reported evaluation on synthetic data. They do not establish real-world clinical accuracy or generalizability. External validation is required before clinical use.

## 8. System Architecture

GlucoTwin follows an end-to-end pipeline:

1. **Synthetic Data Generation:** Create virtual patient records and wearable telemetry.
2. **Data Ingestion and Preprocessing:** Load, clean, and organize the data.
3. **Feature Engineering:** Extract an 18-feature vector from a two-hour sliding window and clinical characteristics.
4. **Machine Learning Inference:** Estimate the probability of a future glucose spike.
5. **Backend Services:** Serve application APIs, inference functionality, persistence, and integrations.
6. **Frontend Dashboard:** Display patient profiles, risk estimates, telemetry charts, simulations, and 3D visualizations.

### Architecture Diagram

- **PDF:** [ADD ARCHITECTURE DIAGRAM PDF LINK]
- **PPT:** [ADD ARCHITECTURE DIAGRAM PPT LINK]

## 9. Implementation and Outcomes

The current prototype includes:

- 20 synthetic virtual patient profiles.
- 80,640 synthetic wearable telemetry records.
- Patient cohort dashboard with risk classifications.
- Individual patient digital twin console.
- Glucose, heart rate, HRV, sleep, and activity visualizations.
- Historical telemetry replay.
- Interactive What-If simulation engine.
- Three.js-based 3D pancreas and islet visualization.
- Gemini AI co-pilot integration.
- Machine learning metrics and feature importance dashboard.

These features demonstrate the technical feasibility of integrating synthetic patient data, predictive modeling, and interactive visualization into one prototype.

No real-patient clinical benefit has been established.

## 10. Demo Video

**Required:** 15–20 minute demonstration video uploaded to YouTube as an Unlisted video.

The video should cover:

- Project introduction and problem statement.
- Proposed solution and system architecture.
- Working prototype and major features.
- What-If simulation.
- Machine learning evaluation.
- Implementation outcomes and future scope.

**YouTube Demo:** [ADD YOUR UNLISTED YOUTUBE VIDEO LINK]

## 11. Presentation

**Project Presentation:** [ADD YOUR PPT OR PDF LINK]

The presentation covers the problem statement, proposed solution, platform features, architecture, simulation engine, machine learning evaluation, implementation outcomes, limitations, and future scope.

## 12. Open-Source License

**License:** MIT License, if the project has been released under MIT.

The license file should be available at [`LICENSE`](LICENSE).

Replace this section if you choose a different license. Ensure that you have permission to license all contributed code and third-party assets before applying the license.

## 13. Privacy, Safety, and Limitations

All patient profiles and wearable time-series data in the demonstration are synthetically generated. The prototype does not use real patient records in its demo dataset.

However, synthetic data alone does not establish formal compliance with healthcare privacy regulations.

Before clinical deployment, the system would require appropriate security and privacy assessments, external validation, prospective clinical evaluation, and clinician oversight.

GlucoTwin is an experimental decision-support prototype and must not be used as a substitute for professional medical advice.

## 14. Future Scope

Potential future improvements include:

- Validation with appropriately governed real-world datasets.
- Integration with wearable devices and continuous glucose monitors.
- Improved patient-specific prediction models.
- Integration with electronic health record systems.
- Clinician-supervised workflows and prospective clinical studies.

## 15. Project Links

- **Public GitHub Repository:** [https://github.com/tarundhullur/Digital_Twin](https://github.com/tarundhullur/Digital_Twin)
- **Live Prototype:** [ADD DEPLOYED WEBSITE URL]
- **Demo Video:** [ADD UNLISTED YOUTUBE URL]
- **Architecture Diagram (PDF/PPT):** [ADD LINK]
- **Presentation (PDF/PPT):** [ADD LINK]

## 16. Accessibility

Ensure the repository is public and all required files and links are accessible without additional permissions.

Verify that the README, license, architecture diagram, presentation, and demo video links work before submitting the repository to Unstop.

---

**GlucoTwin — Moving from glucose monitoring to glucose foresight.**

**Team Victory Minds | Digital Twin Challenge 2026 | Happiest Health × Unstop**