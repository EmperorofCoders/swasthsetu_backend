import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.fhzbdhoavlocadduczkn:Supabase%40445456@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const pool = new pg.Pool({ connectionString });

export const REALISTIC_RECORDS = [
  {
    record_id: "fd649c1a-7645-42a6-9423-c2a10d1e1570",
    clerk_user_id: "demo_patient",
    patient_code: "RONI4420209",
    document_name: "Cardiology OPD Consultation & 12-Lead ECG",
    document_type: "Prescription",
    doctor_or_hospital: "Manipal Hospital Old Airport Road",
    diagnosis_or_findings: "Stage 1 Essential Hypertension (ICD-10 I10) & Primary Mixed Dyslipidemia. Resting 12-Lead ECG shows normal sinus rhythm at 74 bpm. 2D Echo reveals normal LV systolic function (LVEF 62%) with mild concentric LV remodeling.",
    medications_or_procedures: "Telmisartan 40 mg (Telma 40) OD morning; Atorvastatin 10 mg (Atorva 10) HS bedtime; Aspirin 75 mg (Ecosprin 75) OD post-lunch",
    raw_transcript: `MANIPAL HOSPITAL - DEPARTMENT OF CARDIOLOGY
Old Airport Road, Kodihalli, Bengaluru - 560071
NABH & JCI Accredited Hospital | ABDM Facility ID: KA-BLR-MAN-0012

PATIENT ENCOUNTER & OUTPATIENT CLINICAL SUMMARY
Date: October 18, 2026 | Time: 10:30 AM IST
Patient: Rohit Nadakarni | ABHA Code: RONI4420209 | Age: 32 Yrs / Male
Consultant: Dr. Arvind Natarajan, MBBS, MD, DM (Cardiology), FACC (KMC-32005)

CHIEF COMPLAINTS & VISIT CONTEXT:
Patient presented for cardiovascular risk evaluation following borderline elevated blood pressure readings recorded during routine office health check. Reports occasional late-afternoon exertional lightheadedness and mild palpitations during high stress.

CLINICAL EXAMINATION & VITALS:
- General: Alert, oriented, no acute distress, no pallor, no peripheral edema, no jugular venous distension.
- Blood Pressure: 138/88 mmHg (Right arm, seated, confirmed after 10 min rest: 136/84 mmHg)
- Pulse: 74 bpm, regular, good volume. SpO2: 99% on ambient air.
- Cardiovascular: S1/S2 heard normally, no murmurs, rubs, or gallops.
- Respiratory: Bilateral vesicular breath sounds clear to bases.

DIAGNOSTIC INVESTIGATIONS:
1. 12-Lead Electrocardiogram (ECG): Normal sinus rhythm at 74 bpm, normal PR (152ms), normal QRS (84ms), normal QTc (416ms). No ST-T segment deviation or pathological Q waves.
2. Transthoracic 2D Echocardiogram: Normal LV cavity dimensions, preserved global LV systolic contractility with LVEF 62%. Grade 1 LV diastolic relaxation impairment. Normal aortic and mitral valves.

CLINICAL IMPRESSION & DIAGNOSIS:
1. Essential Stage 1 Hypertension (ICD-10 I10).
2. Mixed Dyslipidemia with elevated atherogenic LDL-C.
3. 10-Year ASCVD Risk Score: 4.8% (Low-to-Intermediate).

CARE PLAN & PHARMACOTHERAPY:
1. Tab Telmisartan 40 mg (Telma 40) - 1 tablet orally once daily after breakfast.
2. Tab Atorvastatin 10 mg (Atorva 10) - 1 tablet orally once daily at bedtime.
3. Tab Aspirin 75 mg (Ecosprin 75) - 1 tablet orally once daily after lunch.
4. DASH Diet: Sodium restriction (< 2g/day salt), eliminate deep-fried street snacks, increase dietary potassium through fresh green leafy vegetables and fruit.
5. Exercise: 35 minutes brisk walking at least 5 days weekly.
6. Follow-up: Re-evaluation in 6 weeks with fresh fasting lipid panel and 14-day home BP chart.`,
    uploaded_at: "2026-10-18T10:30:00Z",
    structured_data: {
      title: "Cardiology OPD Consultation & 12-Lead ECG",
      subtitle: "Manipal Hospital Old Airport Road, Bengaluru • Department of Cardiology",
      summary: "Manipal Hospital Old Airport Rd • Dr. Arvind Natarajan • Stage 1 Essential HTN & Dyslipidemia. BP 138/88 mmHg, LVEF 62%. Telmisartan 40mg OD & Atorvastatin 10mg HS initiated.",
      type: "Prescription",
      date: "2026-10-18T10:30:00Z",
      facility: "Manipal Hospital Old Airport Road",
      clinician: "Dr. Arvind Natarajan, MBBS, MD, DM (Cardiology), FACC (KMC-32005)",
      id: "MH-CARD-2026-0941",
      source: "Manipal Health Enterprise EHR (ABDM Integrated)",
      reason: "Cardiovascular risk evaluation and management of borderline elevated resting blood pressure with occasional palpitations.",
      history: "32-year-old male, software engineer with sedentary desk routine and irregular work hours. Positive paternal history of premature ischemic heart disease (father had MI at 52). Non-smoker. No known drug allergies.",
      observations: "Patient is alert, well-oriented, and in no acute cardiorespiratory distress. No carotid bruits. S1/S2 distinct, no pathological murmurs or gallops. Bilateral vesicular breath sounds clear throughout lung fields. No pedal edema or jugular venous distension.",
      vitals: "BP: 138/88 mmHg (Seated Right Arm) | Pulse: 74 bpm (Regular Sinus) | SpO2: 99% Room Air | Temp: 98.4°F | BMI: 24.8 kg/m²",
      findings: "Resting 12-lead ECG demonstrates normal sinus rhythm at 74 bpm with normal cardiac axis (+60°), PR interval 152 ms, QRS 84 ms, QTc 416 ms. No acute ischemic ST-segment shifts or pathological Q-waves. Transthoracic 2D Echo demonstrates preserved LV systolic function (LVEF 62%), mild concentric LV remodeling, Grade 1 diastolic dysfunction (impaired relaxation), and structurally normal valves.",
      assessment: "1. Stage 1 Essential Hypertension (ICD-10 I10) - Early onset, suboptimal control with lifestyle modification alone.\n2. Mixed Dyslipidemia with atherogenic LDL fraction.\n3. Calculated 10-year ASCVD risk: 4.8%.",
      diagnosis: "Stage 1 Essential Hypertension & Mixed Dyslipidemia",
      procedures: "1. Standard 12-Lead High-Resolution Electrocardiogram (ECG)\n2. Comprehensive 2D Transthoracic Echocardiography with Color Doppler\n3. Ambulatory 24-Hour Blood Pressure Monitoring Protocol Initiation",
      medications: [
        {
          name: "Telmisartan 40 mg (Telma 40)",
          instructions: "1 tablet orally once daily in the morning after breakfast",
          clinician: "Dr. Arvind Natarajan"
        },
        {
          name: "Atorvastatin 10 mg (Atorva 10)",
          instructions: "1 tablet orally once daily at bedtime (Night)",
          clinician: "Dr. Arvind Natarajan"
        },
        {
          name: "Aspirin 75 mg Gastro-resistant (Ecosprin 75)",
          instructions: "1 tablet orally once daily after lunch",
          clinician: "Dr. Arvind Natarajan"
        }
      ],
      results: [
        { name: "Systolic Blood Pressure", value: "138 mmHg", referenceRange: "90 - 120 mmHg", notes: "Stage 1 Hypertensive range" },
        { name: "Diastolic Blood Pressure", value: "88 mmHg", referenceRange: "60 - 80 mmHg", notes: "Borderline high" },
        { name: "Resting Heart Rate", value: "74 bpm", referenceRange: "60 - 100 bpm", notes: "Normal sinus rate" },
        { name: "Total Serum Cholesterol", value: "216 mg/dL", referenceRange: "< 200 mg/dL", notes: "Borderline elevated" },
        { name: "LDL Cholesterol (Direct)", value: "142 mg/dL", referenceRange: "< 100 mg/dL", notes: "High (Atherogenic)" },
        { name: "HDL Cholesterol", value: "44 mg/dL", referenceRange: "> 40 mg/dL", notes: "Normal" },
        { name: "Serum Triglycerides", value: "168 mg/dL", referenceRange: "< 150 mg/dL", notes: "Mildly elevated" },
        { name: "Left Ventricular Ejection Fraction (LVEF)", value: "62%", referenceRange: "55 - 70%", notes: "Preserved systolic contractility" },
        { name: "Serum Creatinine", value: "0.88 mg/dL", referenceRange: "0.70 - 1.20 mg/dL", notes: "Normal renal filtration" },
        { name: "High-Sensitivity C-Reactive Protein (hs-CRP)", value: "1.8 mg/L", referenceRange: "< 1.0 mg/L", notes: "Moderate vascular risk tier" }
      ],
      recommendations: "1. Dietary Approaches to Stop Hypertension (DASH diet): Restrict sodium to < 2.0g/day (< 1 level teaspoon salt), minimize processed condiments, and incorporate potassium-rich greens.\n2. Aerobic exercise: 35 minutes brisk walking or cycling at least 5 days per week.\n3. Maintain home blood pressure journal (morning and evening readings).\n4. Avoid OTC NSAIDs (ibuprofen, diclofenac) without prior consultation.",
      followUp: "Clinical review in 6 weeks with repeat fasting lipid profile and home BP logs. Report immediately to emergency in case of acute chest pressure, radiation to jaw/left arm, or syncope.",
      attachments: "12_Lead_ECG_Strip_Manipal.pdf (380 KB), 2D_Echocardiography_Report.pdf (1.4 MB)",
      verifiedBy: "Dr. Arvind Natarajan, DM (Cardiology), KMC Reg. #32005",
      status: "Verified & Digitally Signed (NABH Accreditated)"
    }
  },
  {
    record_id: "35bcbb55-2a6c-4fc4-8eef-1bd871cccc86",
    clerk_user_id: "demo_patient",
    patient_code: "RONI4420209",
    document_name: "Comprehensive Fasting Metabolic & Lipid Panel",
    document_type: "Lab Report",
    doctor_or_hospital: "Apollo Hospitals Bannerghatta Road",
    diagnosis_or_findings: "Optimal fasting glycemic regulation (FPG 92 mg/dL, HbA1c 5.4%). Primary mixed dyslipidemia with elevated total cholesterol (216 mg/dL), LDL (138.4 mg/dL), and non-HDL fractions. Intact renal function (eGFR 108 mL/min/1.73m²) and normal liver transaminases.",
    medications_or_procedures: "Venipuncture, Automated Chemistry Spectrophotometry (Cobas c501), HPLC HbA1c (Bio-Rad D-10), Ion Selective Electrode Electrolytes",
    raw_transcript: `APOLLO DIAGNOSTICS CENTRAL REFERENCE LAB
NABL Accredited Laboratory (ISO 15189:2012, MC-2144)
Apollo Hospitals Campus, Bannerghatta Road, Bengaluru - 560076

BIOCHEMICAL & PATHOLOGY TEST REPORT
Sample Collected: Oct 14, 2026, 07:45 AM | Reported: Oct 14, 2026, 02:15 PM
Patient: Rohit Nadakarni | Patient ID: RONI4420209 | Age/Sex: 32Y / Male
Reporting Pathologist: Dr. Shashi Kumar, MBBS, MD (Pathology), Lab Director (KMC-32080)

FASTING BLOOD GLUCOSE & GLYCATED HEMOGLOBIN (HPLC):
- Fasting Plasma Glucose: 92 mg/dL (Reference: 70 - 99 mg/dL) [Normal]
- HbA1c (Glycated Hemoglobin): 5.4 % (Reference: 4.0 - 5.6 %) [Non-Diabetic]
- Estimated Average Glucose (eAG): 108 mg/dL [Normal]

LIPID PANEL (FASTING 12 HOURS):
- Total Cholesterol: 216 mg/dL (Reference: < 200 mg/dL) [BORDERLINE HIGH]
- Triglycerides: 168 mg/dL (Reference: < 150 mg/dL) [MILDLY ELEVATED]
- HDL Cholesterol: 44 mg/dL (Reference: > 40 mg/dL) [NORMAL]
- LDL Cholesterol (Calculated): 138.4 mg/dL (Reference: < 100 mg/dL) [HIGH]
- Non-HDL Cholesterol: 172 mg/dL (Reference: < 130 mg/dL) [ELEVATED]
- Total Chol / HDL Ratio: 4.9 (Reference: < 4.5) [BORDERLINE HIGH]

RENAL FUNCTION & ELECTROLYTES:
- Serum Creatinine: 0.88 mg/dL (Reference: 0.70 - 1.20 mg/dL) [NORMAL]
- Blood Urea Nitrogen (BUN): 14 mg/dL (Reference: 7 - 20 mg/dL) [NORMAL]
- eGFR (CKD-EPI): 108 mL/min/1.73m² (Reference: > 90 mL/min) [NORMAL]
- Serum Uric Acid: 5.6 mg/dL (Reference: 3.5 - 7.2 mg/dL) [NORMAL]
- Serum Sodium: 141 mEq/L (Reference: 136 - 145 mEq/L) [NORMAL]
- Serum Potassium: 4.2 mEq/L (Reference: 3.5 - 5.1 mEq/L) [NORMAL]

LIVER ENZYMES:
- SGOT / AST: 24 U/L (Reference: 10 - 40 U/L) [NORMAL]
- SGPT / ALT: 28 U/L (Reference: 7 - 56 U/L) [NORMAL]
- Alkaline Phosphatase: 72 U/L (Reference: 44 - 147 U/L) [NORMAL]
- Serum Bilirubin Total: 0.7 mg/dL (Reference: 0.2 - 1.2 mg/dL) [NORMAL]

CLINICAL INTERPRETATION:
Normoglycemic profile with no evidence of impaired glucose tolerance. Mild mixed dyslipidemia identified. Normal renal clearance and hepatocellular integrity confirmed. Correlate clinically with primary physician.`,
    uploaded_at: "2026-10-14T08:00:00Z",
    structured_data: {
      title: "Comprehensive Fasting Metabolic & Lipid Panel",
      subtitle: "Apollo Hospitals Bannerghatta Road • Central Clinical Laboratory (NABL Accredited)",
      summary: "Apollo Diagnostics • Dr. Shashi Kumar • Fasting Glucose 92 mg/dL, HbA1c 5.4% (Normal), Total Cholesterol 216 mg/dL (High), LDL 138.4 mg/dL, eGFR 108 mL/min/1.73m².",
      type: "Lab Report",
      date: "2026-10-14T08:00:00Z",
      facility: "Apollo Hospitals Bannerghatta Road",
      clinician: "Dr. Shashi Kumar, MBBS, MD (Pathology), Lab Director (KMC-32080)",
      id: "AP-LAB-2026-88124",
      source: "Apollo Diagnostics LIS / NABL Accredited Laboratory (ISO 15189:2012)",
      reason: "Annual metabolic health assessment, cardiovascular risk profiling, and fasting biochemical panel.",
      history: "Confirmed 12-hour overnight fast. Hydrated with water. Venous collection via vacuum closed-tube system without hemolysis.",
      observations: "Sample integrity verified: Non-hemolyzed, non-lipemic, non-icteric serum. Valid internal quality control runs on automated analyzers.",
      vitals: "Fasting Duration: 12.5 hrs | Specimen: Venous Blood & Fluoride Plasma | Barcode: AP-BLR-9921",
      findings: "Normal fasting plasma glucose with optimal glycemic control (HbA1c 5.4%). Primary mixed dyslipidemia characterized by elevated total serum cholesterol (216 mg/dL) and atherogenic LDL-C fraction (138.4 mg/dL). Renal biomarkers and liver transaminases remain within normal limits.",
      assessment: "Normoglycemic metabolic status with early-stage atherogenic dyslipidemia. Intact renal clearance and normal hepatic integrity.",
      diagnosis: "Primary Hypercholesterolemia (Dyslipidemia), Normoglycemic Profile",
      procedures: "Automated Chemistry Spectrophotometry (Cobas c501), Ion Selective Electrode (ISE), HPLC (Bio-Rad D-10 for HbA1c)",
      medications: [
        {
          name: "Atorvastatin 10 mg (Atorva 10)",
          instructions: "1 tablet orally once daily at bedtime as advised by cardiologist",
          clinician: "Dr. Shashi Kumar (Clinical Pathologist)"
        }
      ],
      results: [
        { name: "Fasting Plasma Glucose (FPG)", value: "92 mg/dL", referenceRange: "70 - 99 mg/dL", notes: "Normal fasting glucose" },
        { name: "Glycated Hemoglobin (HbA1c)", value: "5.4%", referenceRange: "4.0 - 5.6%", notes: "Optimal / Non-diabetic" },
        { name: "Estimated Average Glucose (eAG)", value: "108 mg/dL", referenceRange: "90 - 120 mg/dL", notes: "Normal" },
        { name: "Total Serum Cholesterol", value: "216 mg/dL", referenceRange: "< 200 mg/dL", notes: "Borderline High" },
        { name: "Triglycerides", value: "168 mg/dL", referenceRange: "< 150 mg/dL", notes: "Mildly Elevated" },
        { name: "HDL Cholesterol (Good)", value: "44 mg/dL", referenceRange: "> 40 mg/dL", notes: "Normal protective range" },
        { name: "LDL Cholesterol (Calculated)", value: "138.4 mg/dL", referenceRange: "< 100 mg/dL", notes: "Elevated atherogenic fraction" },
        { name: "Non-HDL Cholesterol", value: "172 mg/dL", referenceRange: "< 130 mg/dL", notes: "High" },
        { name: "Serum Creatinine", value: "0.88 mg/dL", referenceRange: "0.70 - 1.20 mg/dL", notes: "Normal glomerular filtration" },
        { name: "Blood Urea Nitrogen (BUN)", value: "14 mg/dL", referenceRange: "7 - 20 mg/dL", notes: "Normal" },
        { name: "Estimated GFR (CKD-EPI)", value: "108 mL/min/1.73m²", referenceRange: "> 90 mL/min", notes: "Stage 1 Normal Filtration" },
        { name: "Serum Uric Acid", value: "5.6 mg/dL", referenceRange: "3.5 - 7.2 mg/dL", notes: "Normal" },
        { name: "SGOT / AST", value: "24 U/L", referenceRange: "10 - 40 U/L", notes: "Normal liver transaminase" },
        { name: "SGPT / ALT", value: "28 U/L", referenceRange: "7 - 56 U/L", notes: "Normal liver transaminase" },
        { name: "Alkaline Phosphatase (ALP)", value: "72 U/L", referenceRange: "44 - 147 U/L", notes: "Normal" },
        { name: "Total Bilirubin", value: "0.7 mg/dL", referenceRange: "0.2 - 1.2 mg/dL", notes: "Normal excretion" },
        { name: "Serum Sodium (Na+)", value: "141 mEq/L", referenceRange: "136 - 145 mEq/L", notes: "Normal electrolyte" },
        { name: "Serum Potassium (K+)", value: "4.2 mEq/L", referenceRange: "3.5 - 5.1 mEq/L", notes: "Normal electrolyte" }
      ],
      recommendations: "1. Share lipid panel with treating cardiologist for clinical correlation and statin management.\n2. Maintain low saturated-fat diet and emphasize high-soluble fiber foods (oats, legumes, flaxseeds).\n3. Recheck fasting lipid profile in 8-12 weeks.",
      followUp: "Consult treating physician within 5 to 7 days for prescription review.",
      attachments: "Apollo_Metabolic_NABL_Report_Signed.pdf (890 KB)",
      verifiedBy: "Dr. Shashi Kumar, MBBS, MD (Pathology), Quality Director (KMC-32080)",
      status: "Final Certified Laboratory Report (NABL & CAP Accredited)"
    }
  },
  {
    record_id: "616aa3f0-1c00-47fe-9443-8ff00c60e3c8",
    clerk_user_id: "demo_patient",
    patient_code: "RONI4420209",
    document_name: "Digital Radiography & High-Resolution MRI - Right Knee",
    document_type: "Imaging",
    doctor_or_hospital: "SPARSH Hospital Yeshwanthpur",
    diagnosis_or_findings: "Intact anterior and posterior cruciate ligaments (ACL/PCL). Intact lateral meniscus. Medial meniscus shows Grade 1 intrasubstance mucinous degenerative signal in posterior horn without surface tear. Grade 1-2 patellofemoral chondromalacia with minimal suprapatellar effusion.",
    medications_or_procedures: "1.5 Tesla Multiplanar Right Knee MRI (PDFS, T1, T2), Digital Radiography Right Knee AP, Lateral & Skyline Patellar Views",
    raw_transcript: `SPARSH HOSPITAL FOR ORTHOPAEDICS & TRAUMA
Tumkur Road, Yeshwanthpur, Bengaluru - 560022
NABH Accredited Tertiary Center | Department of Musculoskeletal Radiodiagnosis

MRI & DIGITAL RADIOLOGY REPORT: RIGHT KNEE JOINT
Date of Study: September 28, 2026 | Study ID: SP-MR-2026-9041
Patient: Rohit Nadakarni | Ref Code: RONI4420209 | Age/Sex: 32Y / M
Lead Radiologist: Dr. Dilip Kumar, MBBS, MD (Radio-Diagnosis) (KMC-32085)

CLINICAL INDICATION:
Right knee anterior and medial joint line pain for 3 weeks following recreational sports injury (badminton). Pain aggravates during stair descent and prolonged knee flexion.

IMAGING TECHNIQUE:
High-resolution 1.5 Tesla superconducting MRI system utilizing dedicated phased-array knee coil. Pulse sequences: Sagittal, Coronal, and Axial T1-weighted, T2-weighted turbo spin echo, and Proton Density Fat-Suppressed (PDFS) images. Slice thickness: 3.0 mm. Complementary digital radiographs in weight-bearing AP, lateral, and Merchant (skyline) views.

IMAGE FINDINGS & DETAILED ANALYSIS:
1. Cruciate & Collateral Ligaments:
- Anterior Cruciate Ligament (ACL): Intact throughout its course. Normal slope and low signal intensity fibers without edema or disruption.
- Posterior Cruciate Ligament (PCL): Normal thickness and low signal. Intact.
- Medial and Lateral Collateral Ligaments (MCL/LCL): Intact, no sprain or periligamentous fluid.
2. Menisci:
- Medial Meniscus: Grade 1 globular intrasubstance hyperintensity noted in the posterior horn on PDFS images, without extending to the superior or inferior articular surface. No frank meniscal tear.
- Lateral Meniscus: Normal morphology, signal intensity, and sharp free margins. No tear.
3. Extensor Mechanism & Patellofemoral Articulation:
- Quadriceps and patellar tendons intact.
- Patella alta/baja absent. Mild focal cartilage softening and irregularity at the lateral patellar facet consistent with Grade 1-2 Chondromalacia Patellae.
4. Joint Space & Effusion:
- Minimal physiologic fluid noted in the suprapatellar bursa. No loose intra-articular bodies.
- Popliteal fossa is clear; no Baker's cyst.
5. Osseous Structures:
- No acute fracture, bone contusion, or osteochondritis dissecans lesion. Digital radiographs show normal joint space preserved in medial and lateral tibiofemoral compartments.

IMPRESSION & RADIOLOGICAL CONCLUSION:
1. Intact cruciate and collateral ligaments; no acute meniscal tear.
2. Grade 1-2 Chondromalacia Patellae (Patellofemoral Pain Syndrome).
3. Mild intrasubstance degenerative signal in the medial meniscus posterior horn (Grade 1).
4. Trace reactive joint effusion.`,
    uploaded_at: "2026-09-28T14:15:00Z",
    structured_data: {
      title: "Digital Radiography & High-Resolution MRI - Right Knee",
      subtitle: "SPARSH Hospital Yeshwanthpur • Department of Musculoskeletal Radiodiagnosis",
      summary: "SPARSH Hospital Yeshwanthpur • Dr. Dilip Kumar • MRI Right Knee: Intact ACL/PCL, no meniscal tear. Grade 1-2 patellofemoral chondromalacia with mild effusion. VMO physio protocol advised.",
      type: "Imaging",
      date: "2026-09-28T14:15:00Z",
      facility: "SPARSH Hospital Yeshwanthpur",
      clinician: "Dr. Dilip Kumar, MBBS, MD (Radio-Diagnosis) (KMC-32085)",
      id: "SP-RAD-2026-4402",
      source: "SPARSH Radiology PACS Network (DICOM 3.0 Compliant)",
      reason: "Right knee anterior and medial joint pain following badminton game; evaluation for meniscal tear or ligamentous injury.",
      history: "32-year-old male badminton enthusiast experienced twisting strain 3 weeks prior. Mild local swelling, no mechanical joint locking or instability.",
      observations: "Ambulatory without crutches, no antalgic limp. Right knee flexion: 0° to 125° with mild terminal flexion discomfort. McMurray's test equivocal on medial line.",
      vitals: "Blood Pressure: 124/80 mmHg | Pulse: 72 bpm | Knee Joint Circumference: Right 38.2 cm vs Left 37.8 cm",
      findings: "Anterior and posterior cruciate ligaments intact with normal fiber continuity. Medial meniscus shows Grade 1 intrasubstance mucinous signal in posterior horn without articular breach. Lateral meniscus normal. Grade 1-2 chondromalacia patellae at lateral facet. Trace suprapatellar effusion.",
      assessment: "1. Intact ACL/PCL and collateral ligaments; no acute mechanical tear.\n2. Grade 1-2 Chondromalacia Patellae (Patellofemoral Pain Syndrome).\n3. Mild reactive suprapatellar bursal fluid.",
      diagnosis: "Right Knee Patellofemoral Pain Syndrome & Grade 1 Medial Meniscal Degeneration",
      procedures: "1. 1.5 Tesla Superconducting Dedicated Knee MRI (Sagittal, Coronal, Axial PDFS, T1W, T2W)\n2. Digital Weight-Bearing AP, Lateral, and Skyline Patellar Radiographs",
      medications: [
        {
          name: "Aceclofenac 100 mg + Paracetamol 325 mg (Zerodol-P)",
          instructions: "1 tablet orally twice daily after food for 5 days only (SOS for pain relief)",
          clinician: "Dr. Dilip Kumar"
        },
        {
          name: "Diacerein 50 mg + Glucosamine Sulfate 750 mg (Cartigen DN)",
          instructions: "1 tablet orally once daily with main meal for 60 days",
          clinician: "Dr. Dilip Kumar"
        },
        {
          name: "Diclofenac Topical Gel 1.16% (Volini Gel)",
          instructions: "Apply gently over anterior right knee 3 times daily; avoid vigorous massage",
          clinician: "Dr. Dilip Kumar"
        }
      ],
      results: [
        { name: "Anterior Cruciate Ligament (ACL)", value: "Intact", referenceRange: "Continuous fibers", notes: "No tear or laxity" },
        { name: "Posterior Cruciate Ligament (PCL)", value: "Intact", referenceRange: "Continuous fibers", notes: "Normal low signal" },
        { name: "Medial Meniscus (Posterior Horn)", value: "Grade 1 Signal", referenceRange: "Normal morphology", notes: "Intrasubstance mucinous change, no tear" },
        { name: "Lateral Meniscus", value: "Normal", referenceRange: "Sharp margins", notes: "No tear or degeneration" },
        { name: "Patellofemoral Cartilage", value: "Grade 1-2 Chondromalacia", referenceRange: "Smooth cartilage", notes: "Focal superficial softening at lateral facet" },
        { name: "Joint Effusion", value: "Minimal (Trace)", referenceRange: "Physiologic < 5 mL", notes: "Small suprapatellar fluid pocket" },
        { name: "Popliteal Fossa", value: "Normal", referenceRange: "Clear fossa", notes: "No Baker's cyst" },
        { name: "Bone Marrow Signal", value: "Normal", referenceRange: "No edema", notes: "No acute contusion or fracture" }
      ],
      recommendations: "1. Physiotherapy: Closed kinetic chain quadriceps and VMO (vastus medialis oblique) strengthening, hamstring stretches, and IT band foam rolling.\n2. Temporary rest from high-impact pivoting sports (badminton, squash) for 4 weeks; swimming and stationary cycling encouraged.\n3. Ice application for 15 minutes twice daily after walking.",
      followUp: "Review with Orthopaedic Sports Medicine OPD in 3-4 weeks if discomfort persists or worsens.",
      attachments: "MRI_Right_Knee_Selected_Slices.pdf (4.8 MB), Digital_XRay_AP_Lateral_Skyline.pdf (1.8 MB)",
      verifiedBy: "Dr. Dilip Kumar, MBBS, MD (Radio-Diagnosis), Lead MSK Radiologist (KMC-32085)",
      status: "Verified & Digitally Signed PACS Report"
    }
  },
  {
    record_id: "f9f71cde-5235-4c9a-805c-c87a2d238f30",
    clerk_user_id: "demo_patient",
    patient_code: "RONI4420209",
    document_name: "Gastroenterology Consultation & Diagnostic Upper GI Endoscopy",
    document_type: "Prescription",
    doctor_or_hospital: "Aster CMI Hospital Hebbal",
    diagnosis_or_findings: "Gastroesophageal Reflux Disease (GERD) with Los Angeles Grade A reflux esophagitis. Mild patchy erythematous antral gastritis. Rapid Urease Test (RUT) for Helicobacter pylori is NEGATIVE at 60 minutes. Structurally normal duodenum.",
    medications_or_procedures: "Video Esophagogastroduodenoscopy (EGD) with topical pharyngeal xylocaine, Rapid Urease Test (RUT) for H. pylori, Pantocid DSR 40mg OD, Mucaine Gel 10ml TDS",
    raw_transcript: `ASTER CMI HOSPITAL - CENTER OF EXCELLENCE IN GASTROENTEROLOGY
No. 43/2, New Airport Road, NH 44, Sahakar Nagar, Hebbal, Bengaluru - 560092
JCI & NABH Certified Healthcare Facility | ABDM Provider: KA-BLR-AST-0104

ENDOSCOPY & CLINICAL GASTROENTEROLOGY SUMMARY
Date of Procedure: August 19, 2026 | Case No: AST-GI-2026-1189
Patient: Rohit Nadakarni | ABHA Code: RONI4420209 | Age/Sex: 32Y / M
Senior Gastroenterologist: Dr. Srinivas Rao, MBBS, MD, DM (Gastroenterology) (KMC-32001)

CLINICAL PRESENTATION:
Patient presented with a 2-month history of frequent postprandial retrosternal burning sensation (heartburn), water brash regurgitation, and upper abdominal fullness, worsening after late-night spicy meals and coffee. No dysphagia, odynophagia, vomiting, hematemesis, or melena.

PROCEDURE PERFORMED:
High-Definition Diagnostic Video Esophagogastroduodenoscopy (EGD) under topical 10% Xylocaine pharyngeal spray anesthesia.

PROCEDURE FINDINGS:
1. Esophagus: Mucosa is smooth in proximal and mid-thirds. Distal esophagus demonstrates two discrete non-confluent mucosal breaks < 5 mm in length above the squamocolumnar junction (Los Angeles Grade A Reflux Esophagitis). Normal peristalsis.
2. Z-Line & GE Junction: Located at 39 cm from incisors. Lower esophageal sphincter has normal pinch on retroflexion. No hiatal hernia.
3. Stomach: Normal fundus and body. Antrum shows patchy mucosal erythema without ulceration, nodularity, or bleeding (Mild Antral Gastritis).
4. Biopsy / RUT: Antral mucosal punch biopsy tested with Rapid Urease Test (RUT) gel: Remained yellow at 60 minutes -> NEGATIVE for Helicobacter pylori infection.
5. Duodenum: First part (D1 bulb) and second part (D2) demonstrate normal villous pattern. No ulcer or stricture.

DIAGNOSIS & CLINICAL IMPRESSION:
1. Gastroesophageal Reflux Disease (GERD) - Los Angeles Classification Grade A.
2. Mild Non-Erosive Antral Gastritis (H. pylori Negative).
3. Functional Dyspepsia (Postprandial Distress Syndrome).

MEDICAL PRESCRIPTION & INSTRUCTIONS:
1. Cap Pantoprazole 40 mg + Domperidone 30 mg SR (Pantocid DSR) - 1 capsule once daily in morning 30 minutes before breakfast for 4 weeks.
2. Susp Magaldrate 540 mg + Simethicone 50 mg + Oxetacaine 10 mg (Mucaine Gel) - 10 mL orally thrice daily after meals and at bedtime for 10 days (SOS for breakthrough heartburn).
3. Tab Itopride 50 mg (Ganaton) - 1 tablet orally twice daily before lunch and dinner for 14 days.
4. Lifestyle: Maintain 2.5-hour gap between dinner and sleep; elevate bed head by 6 inches; avoid aerated beverages, citrus juices, and midnight snacking.`,
    uploaded_at: "2026-08-19T11:45:00Z",
    structured_data: {
      title: "Gastroenterology Consultation & Diagnostic Upper GI Endoscopy",
      subtitle: "Aster CMI Hospital Hebbal, Bengaluru • Department of Digestive Diseases",
      summary: "Aster CMI Hebbal • Dr. Srinivas Rao • EGD Endoscopy: LA Grade A Reflux Esophagitis & mild antral gastritis. H. pylori test negative. Pantocid DSR 40mg OD prescribed with dietary precautions.",
      type: "Prescription",
      date: "2026-08-19T11:45:00Z",
      facility: "Aster CMI Hospital Hebbal",
      clinician: "Dr. Srinivas Rao, MBBS, MD, DM (Gastroenterology) (KMC-32001)",
      id: "AST-GI-2026-1189",
      source: "Aster Endoscopy Suite & Electronic Medical Record",
      reason: "Persistent postprandial heartburn, acid regurgitation, and epigastric fullness for 2 months.",
      history: "Irregular meal schedules and frequent late-night dinners. No dysphagia, hematemesis, melena, or weight loss. Stool test negative for occult blood.",
      observations: "Abdomen soft, non-tender, non-distended. Mild focal tenderness on deep epigastric palpation. Normal active bowel sounds. No hepatosplenomegaly.",
      vitals: "BP: 122/78 mmHg | Heart Rate: 70 bpm | SpO2: 98% | Weight: 74.5 kg | Oral Mucosa: Normal",
      findings: "Diagnostic video endoscopy reveals distal esophageal linear mucosal breaks < 5mm (LA Grade A Reflux Esophagitis). Z-line at 39 cm. Patchy antral mucosal hyperemia without ulceration. Rapid Urease Test (RUT) for H. pylori is negative at 60 minutes. Duodenum (D1/D2) normal.",
      assessment: "1. Gastroesophageal Reflux Disease (GERD) - Los Angeles Classification Grade A.\n2. Non-Erosive Mild Antral Gastritis (H. pylori negative).\n3. Functional Dyspepsia (postprandial distress subtype).",
      diagnosis: "Gastroesophageal Reflux Disease (LA Grade A) & Antral Gastritis",
      procedures: "1. Diagnostic Video Upper Gastrointestinal Endoscopy (Esophagogastroduodenoscopy - EGD)\n2. Rapid Urease Test (RUT) for Helicobacter pylori detection (Result: Negative)",
      medications: [
        {
          name: "Pantoprazole 40 mg + Domperidone 30 mg SR (Pantocid DSR)",
          instructions: "1 capsule orally once daily in the morning 30 minutes before breakfast for 4 weeks",
          clinician: "Dr. Srinivas Rao"
        },
        {
          name: "Magaldrate 540 mg + Simethicone 50 mg + Oxetacaine 10 mg (Mucaine Gel)",
          instructions: "10 mL orally thrice daily after meals and before bed for 10 days (SOS for heartburn)",
          clinician: "Dr. Srinivas Rao"
        },
        {
          name: "Itopride Hydrochloride 50 mg (Ganaton)",
          instructions: "1 tablet orally twice daily 15 minutes before lunch and dinner for 14 days",
          clinician: "Dr. Srinivas Rao"
        }
      ],
      results: [
        { name: "Esophageal Mucosa", value: "LA Grade A Reflux Esophagitis", referenceRange: "Normal squamous lining", notes: "Mucosal breaks < 5 mm, non-confluent" },
        { name: "GE Junction (Z-line)", value: "Intact at 39 cm", referenceRange: "38 - 40 cm", notes: "No hiatal hernia or Barrett's esophagus" },
        { name: "Gastric Antrum", value: "Mild Erythematous Gastritis", referenceRange: "Normal pink mucosa", notes: "Patchy hyperemia, no ulcer or erosion" },
        { name: "Rapid Urease Test (H. pylori)", value: "Negative (Yellow at 60 min)", referenceRange: "Negative", notes: "No active Helicobacter pylori infection" },
        { name: "Duodenal Bulb & D2", value: "Normal mucosa", referenceRange: "Normal mucosa", notes: "Preserved villous architecture" }
      ],
      recommendations: "1. Dietary modifications: Avoid caffeine, carbonated drinks, citrus juices, oily fried foods, and chocolate.\n2. Maintain at least 2.5 hours gap between dinner and sleeping. Elevate bed head by 6 inches.\n3. Eat smaller, frequent meals rather than large heavy dinners.",
      followUp: "Re-evaluate in 4 weeks. If symptoms fully resolve, step down Pantoprazole to on-demand use. Seek immediate care for black tarry stools or persistent vomiting.",
      attachments: "Endoscopy_Color_Photo_Collage.pdf (2.2 MB), RUT_Biochemical_Report.pdf (320 KB)",
      verifiedBy: "Dr. Srinivas Rao, MBBS, MD, DM (Gastroenterology) (KMC-32001)",
      status: "Verified Clinical Endoscopy Note"
    }
  },
  {
    record_id: "0b2ab0d2-48b1-4c90-bbcb-efae68831efc",
    clerk_user_id: "demo_patient",
    patient_code: "RONI4420209",
    document_name: "Pulmonary Function Test (Spirometry) & Pulmonology Evaluation",
    document_type: "Lab Report",
    doctor_or_hospital: "Fortis Hospital Cunningham Road",
    diagnosis_or_findings: "Post-Viral Bronchial Hyperresponsiveness / Mild Cough-Variant Asthma. Pre-bronchodilator spirometry revealed mild obstruction (FEV1 78% pred, FEV1/FVC 75.8%). Post-bronchodilator test with 200mcg inhaled Salbutamol demonstrated +420 mL (+14.9%) improvement in FEV1, confirming significant reversible airway reactivity.",
    medications_or_procedures: "Computerized Pre- and Post-Bronchodilator Spirometry (CareFusion MasterScreen), Peak Expiratory Flow Diary, Foracort 200 Inhaler 1 puff BD, Monticope 1 tab HS",
    raw_transcript: `FORTIS HOSPITAL - DEPARTMENT OF PULMONARY MEDICINE
14, Cunningham Road, Vasanth Nagar, Bengaluru - 560052
NABH & NABL Accredited | ABDM Healthcare Provider: KA-BLR-FOR-0033

SPIROMETRY & PULMONOLOGY CLINICAL ASSESSMENT
Date: July 15, 2026 | Test Time: 11:15 AM
Patient: Rohit Nadakarni | UHID: RONI4420209 | Age: 32Y / Male
Consultant Pulmonologist: Dr. Naveen Kumar, MBBS, MD (Respiratory Medicine), DTCD, FCCP (KMC-32041)

CLINICAL REASON FOR VISIT:
Patient reports a persistent, dry, hacking cough for 5 weeks following an upper respiratory viral episode. Cough worsens at night and on exposure to air conditioning and cold morning air. Denies hemoptysis, fever, or daytime breathlessness.

PHYSICAL EXAMINATION:
- Respiratory Rate: 16/min, unlabored breathing. No accessory muscle use.
- Auscultation: Vesicular breath sounds heard bilaterally. Faint bilateral end-expiratory high-pitched polyphonic rhonchi audible on forced expiration. Clear after cough.
- SpO2: 98% on room air. Heart Rate: 76 bpm. Blood Pressure: 120/78 mmHg.

SPIROMETRY RESULTS (ATS/ERS STANDARDIZED):
- FEV1 (Pre-Bronchodilator): 2.82 L (78% of Predicted 3.61 L) -> Mild Obstructive Defect
- FVC (Forced Vital Capacity): 3.72 L (91% of Predicted 4.09 L) -> Normal Lung Volume
- FEV1 / FVC Ratio (Pre): 75.8 % (Lower Limit of Normal LLN = 77.2%)
- Post-Bronchodilator FEV1 (15 min after 200 mcg Salbutamol): 3.24 L (89% of Predicted)
- Absolute FEV1 Change: +420 mL (+14.9% improvement) -> SIGNIFICANT REVERSIBILITY CONFIRMED
- Post-Bronchodilator FEV1/FVC Ratio: 83.1%

IMPRESSION & CLINICAL DIAGNOSIS:
1. Significant reversible airflow limitation consistent with Post-Viral Bronchial Hyperresponsiveness / Mild Cough-Variant Asthma.
2. Normal baseline lung capacity (no restrictive ventilatory defect).

MANAGEMENT & PRESCRIPTION:
1. Budesonide 200 mcg + Formoterol 6 mcg Inhaler (Foracort 200 with Spacer) - 1 puff twice daily (Morning and Night) for 30 days. Rinse mouth with water after use.
2. Tab Levocetirizine 5 mg + Montelukast 10 mg (Monticope) - 1 tablet orally once daily at bedtime for 14 days.
3. Syp Ascoril LS - 5 mL orally as needed for severe coughing spasms.
4. Environmental Controls: Avoid incense smoke (agarbatti), mosquito vaporizers, and sudden transitions to cold drafts.`,
    uploaded_at: "2026-07-15T11:30:00Z",
    structured_data: {
      title: "Pulmonary Function Test (Spirometry) & Pulmonology Evaluation",
      subtitle: "Fortis Hospital Cunningham Road, Bengaluru • Department of Pulmonary Medicine",
      summary: "Fortis Cunningham Rd • Dr. Naveen Kumar • Spirometry: FEV1 +14.9% (+420mL) reversible airway obstruction (Post-viral asthma). Foracort 200 Inhaler BD & Monticope tab prescribed.",
      type: "Lab Report",
      date: "2026-07-15T11:30:00Z",
      facility: "Fortis Hospital Cunningham Road",
      clinician: "Dr. Naveen Kumar, MBBS, MD (Respiratory Medicine), DTCD, FCCP (KMC-32041)",
      id: "FT-PULM-2026-3091",
      source: "Fortis Pulmonary Diagnostic Laboratory (ATS/ERS 2019 Standardized)",
      reason: "Persistent nocturnal dry cough for 5 weeks following an upper respiratory viral episode.",
      history: "Non-smoker, no occupational dust or toxic chemical exposure. No childhood asthma history. Digital Chest X-Ray PA view normal with clear lung fields and normal cardiothoracic ratio.",
      observations: "Respiratory rate 16/min, unlabored. Trachea midline. Vesicular breath sounds present bilaterally with faint bilateral end-expiratory high-pitched rhonchi on forced expiration.",
      vitals: "SpO2: 98% on Room Air | Heart Rate: 76 bpm | Blood Pressure: 120/78 mmHg | Respiratory Rate: 16 breaths/min | Peak Expiratory Flow: 460 L/min",
      findings: "Pre-bronchodilator spirometry shows mild airflow limitation: FEV1 2.82 L (78% predicted), FVC 3.72 L (91% predicted), FEV1/FVC 75.8%. Post-bronchodilator testing (200 mcg Salbutamol via spacer) demonstrated FEV1 increase to 3.24 L (+420 mL, +14.9% gain), meeting standard ATS criteria for significant bronchodilator reversibility.",
      assessment: "1. Significant reversible bronchial hyperreactivity consistent with Post-Viral Bronchial Hyperresponsiveness / Cough-Variant Asthma.\n2. Preserved baseline lung capacity without restrictive impairment.",
      diagnosis: "Post-Viral Bronchial Hyperresponsiveness / Cough-Variant Asthma",
      procedures: "1. Computerized Pre- and Post-Bronchodilator Spirometry (CareFusion Jaeger MasterScreen)\n2. Peak Expiratory Flow Rate (PEFR) Serial Measurement\n3. Digital Chest Radiograph (PA View)",
      medications: [
        {
          name: "Budesonide 200 mcg + Formoterol Fumarate 6 mcg Inhaler (Foracort 200 with Spacer)",
          instructions: "1 metered inhalation twice daily (Morning & Night) for 30 days; rinse mouth thoroughly with water after inhalation",
          clinician: "Dr. Naveen Kumar"
        },
        {
          name: "Levocetirizine 5 mg + Montelukast 10 mg (Monticope / Montek-LC)",
          instructions: "1 tablet orally once daily at bedtime (Night) for 14 days",
          clinician: "Dr. Naveen Kumar"
        },
        {
          name: "Ambroxol + Levosalbutamol + Guaiphenesin Syrup (Ascoril LS)",
          instructions: "5 mL orally thrice daily as needed for 5 days for cough paroxysms",
          clinician: "Dr. Naveen Kumar"
        }
      ],
      results: [
        { name: "Pre-Bronchodilator FEV1", value: "2.82 L", referenceRange: "Predicted: 3.61 L (78%)", notes: "Mild airflow limitation" },
        { name: "Post-Bronchodilator FEV1", value: "3.24 L", referenceRange: "Predicted: 3.61 L (89%)", notes: "Significant reversibility (+420 mL)" },
        { name: "FEV1 Absolute Improvement", value: "+420 mL (+14.9%)", referenceRange: "> 200 mL and > 12%", notes: "Positive bronchodilator response" },
        { name: "Forced Vital Capacity (FVC)", value: "3.72 L", referenceRange: "Predicted: 4.09 L (91%)", notes: "Normal lung volume" },
        { name: "FEV1 / FVC Ratio (Pre)", value: "75.8%", referenceRange: "LLN: 77.2%", notes: "Borderline obstructive pattern" },
        { name: "FEV1 / FVC Ratio (Post)", value: "83.1%", referenceRange: "> 75%", notes: "Normalized post-bronchodilator" },
        { name: "Peak Expiratory Flow (PEF)", value: "460 L/min", referenceRange: "Predicted: 540 L/min (85%)", notes: "Good expiratory effort" },
        { name: "Chest Radiograph (PA View)", value: "Clear lung fields", referenceRange: "Normal markings", notes: "No infiltrates, effusion, or mass" }
      ],
      recommendations: "1. Proper MDI (metered dose inhaler) technique using aerochamber spacer; rinse and gargle mouth with water and spit out after each dose to avoid hoarseness or oral candidiasis.\n2. Avoid exposure to indoor incense smoke (agarbatti), mosquito coils, aerosol sprays, and cold air drafts.\n3. Maintain peak flow diary if cough recurs.",
      followUp: "Clinical review in 4 weeks with repeat bedside spirometry. If completely asymptomatic, inhaler will be stepped down.",
      attachments: "PFT_Spirometry_Flow_Volume_Loops.pdf (1.6 MB), Chest_XRay_PA.pdf (1.1 MB)",
      verifiedBy: "Dr. Naveen Kumar, MBBS, MD (Resp Med), DTCD, FCCP (KMC-32041)",
      status: "Verified Diagnostic Spirometry Report"
    }
  },
  {
    record_id: "a5501430-8c58-4423-8d3b-37febd379cb9",
    clerk_user_id: "demo_patient",
    patient_code: "RONI4420209",
    document_name: "Daycare Surgical Discharge Summary - Right Knee Diagnostic Arthroscopy",
    document_type: "Discharge Summary",
    doctor_or_hospital: "Narayana Institute of Cardiac Sciences",
    diagnosis_or_findings: "Elective right knee diagnostic arthroscopy and radiofrequency chondral smoothing. Intact anterior/posterior cruciate ligaments. Minor degenerative posterior horn medial meniscal fraying treated with micro-debridement. Uneventful recovery from spinal anesthesia; discharged hemodynamically stable.",
    medications_or_procedures: "Right Knee Diagnostic Arthroscopy, Radiofrequency Chondral Lavage, Subarachnoid Block Anesthesia, Portal Suture Closure, Crepe Compressive Bandage",
    raw_transcript: `NARAYANA INSTITUTE OF ORTHOPAEDICS & ARTHROSCOPY
Narayana Health City, 258/A, Bommasandra Industrial Area, Bengaluru - 560099
JCI & NABH Certified | ABDM Health ID: KA-BLR-NAR-0081

DAYCARE SURGICAL DISCHARGE SUMMARY
Admission Date: May 10, 2026, 06:30 AM | Discharge Date: May 10, 2026, 07:00 PM
Patient: Rohit Nadakarni | IP No: IP-2026-9912 | UHID: RONI4420209 | Age/Sex: 32Y / M
Chief Orthopaedic Surgeon: Dr. Suresh Gowda, MBBS, MS (Orthopaedics), MCh (Ortho) (KMC-32008)

DIAGNOSIS ON ADMISSION & DISCHARGE:
Right Knee Recurrent Pain with Mechanical Symptoms; Mild Degenerative Medial Meniscal Fraying (Post-Arthroscopic Micro-Debridement).

SURGICAL DETAILS:
- Anesthesia: Subarachnoid Spinal Block (0.5% Bupivacaine Heavy 2.2 mL).
- Procedure: Right Knee Diagnostic Arthroscopy & Radiofrequency Chondroplasty.
- Operative Summary: Standard anterolateral and anteromedial portals established under sterile precautions. Cruciate ligaments (ACL and PCL) inspected under hook probe: Normal tension and fiber continuity. Lateral meniscus intact. Medial meniscus showed minor superficial fibrillation at posterior horn margin; smoothed using RF micro-debrider. Copious joint lavage with 3 Liters normal saline. Hemostasis confirmed. Portals closed with 3-0 Ethilon sutures. Compressive sterile dressing applied.
- Intraoperative Blood Loss: Negligible (< 20 mL). No intraoperative complications.

POST-OPERATIVE COURSE & RECOVERY:
Patient recovered fully from spinal anesthesia in Daycare PACU. Tolerated oral clear liquids followed by light diet. Voided clear urine adequately (> 600 mL). Distal neurovascular status intact in right lower limb. Ambulating safely with straight-leg support brace and full weight-bearing clearance.

DISCHARGE MEDICATIONS:
1. Tab Cefuroxime Axetil 500 mg (Ceftum 500) - 1 tablet orally twice daily after meals for 5 days.
2. Tab Tramadol 37.5 mg + Paracetamol 325 mg (Ultracet) - 1 tablet orally twice daily after meals for 3 days, then SOS for moderate pain.
3. Tab Pantoprazole 40 mg (Pan 40) - 1 tablet orally once daily before breakfast for 5 days.
4. Tab Trypsin-Chymotrypsin (Chymoral Forte) - 1 tablet orally thrice daily 30 minutes before food for 5 days.

POST-OPERATIVE CARE INSTRUCTIONS:
- Keep surgical dressing completely clean and dry. Do not wet knee.
- Suture removal scheduled for Post-Operative Day 10 (May 20, 2026).
- Start isometric quad contractions and ankle pumps immediately.
- Use knee immobilizer brace while walking for first 5 days.`,
    uploaded_at: "2026-05-10T19:00:00Z",
    structured_data: {
      title: "Daycare Surgical Discharge Summary - Right Knee Diagnostic Arthroscopy",
      subtitle: "Narayana Institute of Orthopaedics & Arthroscopy, Bengaluru • Daycare Surgical Unit",
      summary: "Narayana Health City • Dr. Suresh Gowda • Right knee diagnostic arthroscopy uneventful. Mild meniscal smoothing. Full weight-bearing cleared with brace. Suture removal on Day 10.",
      type: "Discharge Summary",
      date: "2026-05-10T19:00:00Z",
      facility: "Narayana Institute of Cardiac Sciences",
      clinician: "Dr. Suresh Gowda, MBBS, MS (Orthopaedics), MCh (Ortho) (KMC-32008)",
      id: "NH-DISCH-2026-7729",
      source: "Narayana Health Electronic Medical Records (NABH & JCI Accredited)",
      reason: "Daycare arthroscopic evaluation and minimal debridement for persistent right knee mechanical discomfort.",
      history: "Planned elective daycare admission following failed conservative rest. Pre-anesthetic evaluation cleared ASA Grade I.",
      observations: "Post-operative vitals stable. Surgical portal incisions clean, dry, and intact with sterile compressive Crepe dressing. Pedal pulses palpable (Dorsalis Pedis 2+ bilateral), sensation intact in L4/L5/S1 dermatomes.",
      vitals: "BP: 122/76 mmHg | Pulse: 68 bpm | SpO2: 99% | Temp: 98.2°F | Urine Output: Adequate (> 600 ml clear)",
      findings: "Diagnostic Arthroscopy Findings: Anterolateral and anteromedial portals established. Medial and lateral menisci thoroughly inspected: Minor degenerative fraying at posterior horn medial meniscus was smoothed with radiofrequency micro-debrider. Cruciate ligaments (ACL/PCL) taut and healthy. Copious normal saline lavage (3 Liters) performed. Portals closed with 3-0 Ethilon.",
      assessment: "Uneventful right knee diagnostic arthroscopy with minimal meniscal smoothing. Excellent recovery from subarachnoid block anesthesia. Hemodynamically stable for daycare discharge.",
      diagnosis: "Post-Diagnostic Arthroscopy Right Knee; Mild Degenerative Medial Meniscal Fraying (Treated)",
      procedures: "1. Right Knee Diagnostic Arthroscopy & Radiofrequency Chondral Lavage\n2. Subarachnoid Spinal Anesthesia (0.5% Bupivacaine Heavy 2.2 mL)\n3. Portal Closure & Compressive Sterile Dressing",
      medications: [
        {
          name: "Cefuroxime Axetil 500 mg (Ceftum 500)",
          instructions: "1 tablet orally twice daily after food for 5 days (Prophylactic antibiotic)",
          clinician: "Dr. Suresh Gowda"
        },
        {
          name: "Tramadol 37.5 mg + Paracetamol 325 mg (Ultracet)",
          instructions: "1 tablet orally twice daily after meals for 3 days, then SOS for moderate pain",
          clinician: "Dr. Suresh Gowda"
        },
        {
          name: "Pantoprazole 40 mg (Pan 40)",
          instructions: "1 tablet orally once daily before breakfast for 5 days",
          clinician: "Dr. Suresh Gowda"
        },
        {
          name: "Trypsin-Chymotrypsin (Chymoral Forte)",
          instructions: "1 tablet orally thrice daily 30 minutes before food for 5 days (to resolve swelling)",
          clinician: "Dr. Suresh Gowda"
        }
      ],
      results: [
        { name: "Post-Op Hemoglobin", value: "14.2 g/dL", referenceRange: "Pre-op: 14.6 g/dL", notes: "Minimal blood loss (< 20 mL)" },
        { name: "Post-Op Serum Creatinine", value: "0.85 mg/dL", referenceRange: "0.70 - 1.20 mg/dL", notes: "Normal renal function" },
        { name: "Lower Limb Neurovascular Exam", value: "Intact", referenceRange: "Normal motor power 5/5", notes: "Warm foot, strong pedal pulse" },
        { name: "Surgical Dressing Check", value: "Dry & Clean", referenceRange: "Intact dressing", notes: "No strike-through bleeding" },
        { name: "Ambulation Assessment", value: "Full Weight-Bearing Cleared", referenceRange: "Safe with brace", notes: "Walked safely under PT guidance" }
      ],
      recommendations: "1. Wound Care: Keep surgical dressing clean and completely dry. Do not immerse knee in bath water. Portal sutures to be removed on Post-Op Day 10.\n2. Rehabilitation: Begin isometric quadriceps contractions, ankle pumps, and straight leg raises 10 repetitions x 3 sets daily immediately.\n3. Use knee immobilizer brace while walking for the first 5 days for support.\n4. Apply cold ice pack over dressing for 20 minutes 3 times daily.",
      followUp: "OPD visit for surgical suture removal on May 20, 2026. Contact emergency hotline (080-71222222) if high fever (> 101°F), calf pain, or dressing soaking occurs.",
      attachments: "Operation_Theater_IntraOp_Photos.pdf (3.5 MB), Discharge_Summary_Signed.pdf (920 KB)",
      verifiedBy: "Dr. Suresh Gowda, MS (Ortho), MCh (Ortho), Consultant Arthroscopy Surgeon (KMC-32008)",
      status: "Signed Daycare Surgical Discharge Summary"
    }
  },
  {
    record_id: "fc4cb834-48b4-4978-81f0-a0354bea99e7",
    clerk_user_id: "demo_patient",
    patient_code: "RONI4420209",
    document_name: "Annual Executive Cardiovascular & Metabolic Wellness Audit",
    document_type: "Prescription",
    doctor_or_hospital: "Sri Jayadeva Institute of Cardiovascular Sciences",
    diagnosis_or_findings: "Good overall cardiovascular baseline with normal 12-lead ECG and bilateral normal carotid intima-media thickness (CIMT: 0.58 mm, no atherosclerotic plaque). Suboptimal 25-Hydroxy Vitamin D (18.4 ng/mL - Deficiency) and low borderline Vitamin B12 (220 pg/mL). High weekly Cholecalciferol 60K supplementation prescribed.",
    medications_or_procedures: "12-Lead Electrocardiogram (ECG), Carotid Intima-Media Thickness (CIMT) Ultrasound, Serum 25-OH Vitamin D3, Serum Vitamin B12, Uprise-D3 60K weekly, Nurokind-Plus RF daily",
    raw_transcript: `SRI JAYADEVA INSTITUTE OF CARDIOVASCULAR SCIENCES & RESEARCH
(Government of Karnataka Autonomous Tertiary Institute)
Bannerghatta Road / Jayanagar 9th Block, Bengaluru - 560069
NABH & NABL Accredited | Executive Preventive Cardiology Division

EXECUTIVE HEALTH AUDIT & CARDIOVASCULAR WELLNESS SUMMARY
Audit Date: March 22, 2026 | Registration No: SJ-WELL-2026-1044
Patient: Rohit Nadakarni | ABHA Code: RONI4420209 | Age/Sex: 32Y / M
Chief Consulting Cardiologist: Dr. C. N. Manjunath, MBBS, MD, DM (Cardiology), FACC

ANNUAL HEALTH SUMMARY:
Patient enrolled in the comprehensive executive cardiovascular wellness checkup. Reports sedentary IT desk profession, 7-8 hours computer work daily, and moderate workload stress.

CLINICAL BIOMETRICS & VITALS:
- Resting Blood Pressure: 130/84 mmHg (Pre-hypertensive baseline)
- Resting Heart Rate: 70 bpm, regular. SpO2: 99% on room air.
- Height: 174 cm | Weight: 74.0 kg | BMI: 24.4 kg/m² | Waist-to-Hip Ratio: 0.88

INVESTIGATION HIGHLIGHTS:
1. 12-Lead Electrocardiogram (ECG): Normal sinus rhythm at 70 bpm. Normal PR and QTc intervals. No chamber enlargement, ST changes, or arrhythmia.
2. Carotid Doppler Ultrasound: Bilateral common and internal carotid arteries patent with normal laminar flow. Mean CIMT (Carotid Intima-Media Thickness): 0.58 mm (Normal < 0.80 mm). No carotid atheromatous plaques detected.
3. Micronutrient Screening:
- 25-Hydroxy Vitamin D: 18.4 ng/mL (Reference: 30 - 100 ng/mL) -> DEFICIENT (< 20 ng/mL)
- Vitamin B12: 220 pg/mL (Reference: 211 - 911 pg/mL) -> LOW BORDERLINE
- Complete Blood Count: Hb 14.8 g/dL, TLC 6,800 /uL, Platelets 240,000 /uL -> NORMAL
- Thyroid Stimulating Hormone (TSH): 2.15 uIU/mL (Reference: 0.40 - 4.20 uIU/mL) -> EUTHYROID

CLINICAL RECOMMENDATIONS & PRESCRIPTION:
1. Cap Cholecalciferol 60,000 IU (Uprise-D3 60K) - 1 softgel orally once weekly with milk after breakfast for 8 consecutive weeks, then once monthly for 4 months.
2. Cap Methylcobalamin 1500 mcg + Alpha Lipoic Acid 100 mg (Nurokind-Plus RF) - 1 capsule orally once daily after breakfast for 30 days.
3. Lifestyle: 20 minutes morning sun exposure between 8:00 AM - 9:30 AM with arms/face exposed. Ergonomic breaks (5 minutes standing every 50 minutes of desk work). Target 10,000 steps daily.`,
    uploaded_at: "2026-03-22T09:30:00Z",
    structured_data: {
      title: "Annual Executive Cardiovascular & Metabolic Wellness Audit",
      subtitle: "Sri Jayadeva Institute of Cardiovascular Sciences & Research, Bengaluru",
      summary: "Jayadeva Institute Bengaluru • Dr. C. N. Manjunath • Annual Health Audit: CIMT normal (0.58mm), ECG normal. Vitamin D3 deficient (18.4 ng/mL). Uprise-D3 60K weekly & Nurokind started.",
      type: "Prescription",
      date: "2026-03-22T09:30:00Z",
      facility: "Sri Jayadeva Institute of Cardiovascular Sciences",
      clinician: "Dr. C. N. Manjunath, MBBS, MD, DM (Cardiology), Senior Chief Cardiologist",
      id: "SJ-WELL-2026-1044",
      source: "Jayadeva Institute Preventive Cardiology Wing (Government of Karnataka)",
      reason: "Comprehensive annual preventive health checkup, cardiovascular risk mapping, and metabolic profile assessment.",
      history: "Corporate IT professional. Reports 7-8 hours daily screen time, mild occupational stress. No history of tobacco usage. Diet primarily vegetarian with occasional eggs.",
      observations: "Well-built, healthy appearance. No pallor, icterus, cyanosis, lymphadenopathy, or pedal edema. Thyroid gland normal on palpation. S1/S2 heard normally. Abdominal examination soft and non-tender.",
      vitals: "BP: 130/84 mmHg | Resting Pulse: 70 bpm | SpO2: 99% | Height: 174 cm | Weight: 74 kg | BMI: 24.4 kg/m² | Waist-to-Hip Ratio: 0.88",
      findings: "Comprehensive checkup reveals good overall cardiovascular reserve. Resting 12-lead ECG normal. Carotid Doppler ultrasound shows bilateral normal intima-media thickness (CIMT: 0.58 mm) without atherosclerotic plaque. Biochemical testing revealed suboptimal 25-Hydroxy Vitamin D (18.4 ng/mL - Deficiency) and borderline Vitamin B12 (220 pg/mL). Liver, renal, and thyroid panels are entirely normal.",
      assessment: "1. Good overall cardiovascular baseline; pre-hypertensive resting blood pressure.\n2. 25-OH Vitamin D deficiency (< 20 ng/mL), commonly seen in indoor IT software personnel.\n3. Low borderline Vitamin B12 level.",
      diagnosis: "Pre-hypertension (borderline) & Vitamin D3 Deficiency",
      procedures: "1. 12-Lead Electrocardiogram (ECG)\n2. High-Resolution B-Mode Carotid Intima-Media Thickness (CIMT) Ultrasound\n3. Comprehensive Serum Vitamin & Micronutrient Profile (D3, B12, Ferritin)",
      medications: [
        {
          name: "Cholecalciferol 60,000 IU Softgel (Uprise-D3 60K)",
          instructions: "1 capsule orally once weekly with milk after breakfast for 8 consecutive weeks, then once monthly",
          clinician: "Dr. C. N. Manjunath"
        },
        {
          name: "Methylcobalamin 1500 mcg + Alpha Lipoic Acid 100 mg (Nurokind-Plus RF)",
          instructions: "1 capsule orally once daily after breakfast for 30 days",
          clinician: "Dr. C. N. Manjunath"
        }
      ],
      results: [
        { name: "25-Hydroxy Vitamin D", value: "18.4 ng/mL", referenceRange: "30 - 100 ng/mL", notes: "Deficient (< 20 ng/mL)" },
        { name: "Vitamin B12 (Cyanocobalamin)", value: "220 pg/mL", referenceRange: "211 - 911 pg/mL", notes: "Low Normal / Borderline" },
        { name: "Carotid Intima-Media Thickness (CIMT)", value: "0.58 mm", referenceRange: "Normal < 0.80 mm", notes: "No atherosclerotic plaque" },
        { name: "Thyroid Stimulating Hormone (TSH)", value: "2.15 uIU/mL", referenceRange: "0.40 - 4.20 uIU/mL", notes: "Euthyroid" },
        { name: "Serum Ferritin", value: "112 ng/mL", referenceRange: "30 - 400 ng/mL", notes: "Normal iron stores" },
        { name: "Complete Blood Count (Hemoglobin)", value: "14.8 g/dL", referenceRange: "13.0 - 17.0 g/dL", notes: "Normal" },
        { name: "Total Leucocyte Count (TLC)", value: "6,800 /uL", referenceRange: "4,000 - 11,000 /uL", notes: "Normal" },
        { name: "Platelet Count", value: "240,000 /uL", referenceRange: "150,000 - 450,000 /uL", notes: "Normal" }
      ],
      recommendations: "1. Take Vitamin D3 supplement faithfully once weekly for 8 weeks.\n2. Spend 20 minutes in morning sunlight (between 8:00 AM - 9:30 AM) with arms/face exposed.\n3. Incorporate ergonomics into desk work: 5-minute standing breaks every 50 minutes, 3 liters daily water intake.\n4. Continue aerobic walking 10,000 steps daily.",
      followUp: "Annual preventive health re-evaluation in March 2027. Repeat Vitamin D3 level in 3 months.",
      attachments: "Executive_Wellness_Full_Summary_Jayadeva.pdf (3.1 MB), CIMT_Ultrasound_Images.pdf (1.2 MB)",
      verifiedBy: "Dr. C. N. Manjunath, Senior Consultant Cardiologist & Director (Retd)",
      status: "Verified Annual Executive Health Report"
    }
  }
];

export async function seedRealisticRecords(targetPool = pool) {
  console.log("Seeding realistic medical records into Supabase...");
  await targetPool.query(`ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS structured_data JSONB;`);

  // Delete older demo records so there are no dummy/messy test uploads
  await targetPool.query(`DELETE FROM public.medical_records WHERE clerk_user_id = 'demo_patient';`);

  for (const r of REALISTIC_RECORDS) {
    await targetPool.query(
      `INSERT INTO public.medical_records (
        record_id, clerk_user_id, patient_code, document_name, document_type,
        doctor_or_hospital, diagnosis_or_findings, medications_or_procedures,
        raw_transcript, structured_data, uploaded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (record_id) DO UPDATE SET
        document_name = EXCLUDED.document_name,
        document_type = EXCLUDED.document_type,
        doctor_or_hospital = EXCLUDED.doctor_or_hospital,
        diagnosis_or_findings = EXCLUDED.diagnosis_or_findings,
        medications_or_procedures = EXCLUDED.medications_or_procedures,
        raw_transcript = EXCLUDED.raw_transcript,
        structured_data = EXCLUDED.structured_data,
        uploaded_at = EXCLUDED.uploaded_at;`,
      [
        r.record_id,
        r.clerk_user_id,
        r.patient_code,
        r.document_name,
        r.document_type,
        r.doctor_or_hospital,
        r.diagnosis_or_findings,
        r.medications_or_procedures,
        r.raw_transcript,
        JSON.stringify(r.structured_data),
        r.uploaded_at
      ]
    );
  }

  console.log(`✅ Successfully seeded ${REALISTIC_RECORDS.length} realistic medical records!`);
}

if (process.argv[1]?.endsWith("seed_realistic_records.mjs")) {
  seedRealisticRecords()
    .then(async () => {
      const res = await pool.query(
        "SELECT record_id, document_name, document_type, doctor_or_hospital, uploaded_at FROM public.medical_records WHERE clerk_user_id = 'demo_patient' ORDER BY uploaded_at DESC;"
      );
      console.log("Verified records in DB:", res.rows);
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("Seed error:", err);
      await pool.end();
      process.exit(1);
    });
}
