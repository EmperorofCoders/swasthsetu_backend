import argparse
import base64
import json
import time
from pathlib import Path
import os
import psycopg
from psycopg.types.json import Jsonb
import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().with_name(".env"))

BASE = "https://api.sarvam.ai/doc-ai/v1"
missing_environment = [
    name for name in ("SARVAM_API_KEY", "DATABASE_URL") if not os.environ.get(name)
]
if missing_environment:
    raise SystemExit("Missing required environment variable(s): " + ", ".join(missing_environment))

HEADERS = {"api-subscription-key": os.environ["SARVAM_API_KEY"]}
DATABASE_URL = os.environ["DATABASE_URL"]
TERMINAL = {"completed", "partially_completed", "failed", "rejected"}

SCHEMA = """{
  "type": "object",
  "description": "Extract only information explicitly present in the document. Omit fields that are missing; do not infer or invent values.",
  "properties": {
    "invoice_information": {
      "type": "object",
      "properties": {
        "invoice_number": {"type": "string"},
        "invoice_date": {"type": "string"},
        "invoice_amount": {"type": "number"}
      }
    },
    "patient_information": {
      "type": "object",
      "properties": {
        "patient_code": {"type": "string"},
        "patient_name": {"type": "string"},
        "age": {"type": "number"},
        "weight": {"type": "number"},
        "height": {"type": "number"},
        "sex": {"type": "string"}
      }
    },
    "Hospital_information": {
      "type": "object",
        "properties": {
            "hospital_name": {"type": "string"},
            "hospital_address": {"type": "string"},
            "hospital_contact_number": {"type": "string"},
            "hospital_email": {"type": "string"}
        }
    },
    "doctor_information": {
      "type": "object",
      "properties": {
        "doctor_name": {"type": "string"},
        "doctor_specialty": {"type": "string"},
        "doctor_contact_number": {"type": "string"},
        "doctor_email": {"type": "string"}
      }
    },
    "medical_lifestyle_history": {
      "type": "object",
      "properties": {
        "drug_abuse_history": {"type": "string"},
        "smoking_history": {"type": "string"},
        "occupation": {"type": "string"},
        "income": {"type": "string"},
        "drug_allergies": {"type": "string"},
        "past_medical_history": {"type": "string"},
        "past_surgical_history": {"type": "string"}
      }
    },
    "medical_test_records": {
      "type": "object",
      "description": "Record test results as reported, including units, reference ranges, and qualitative findings when available.",
      "properties": {
        "blood_tests": {
          "type": "object",
          "properties": {
            "complete_blood_count": {
              "type": "object",
              "properties": {
                "haemoglobin_hb": {"type": "string"},
                "red_blood_cell_count": {"type": "string"},
                "white_blood_cell_count": {"type": "string"},
                "platelet_count": {"type": "string"},
                "haematocrit_pcv": {"type": "string"},
                "mean_corpuscular_volume_mcv": {"type": "string"},
                "mean_corpuscular_haemoglobin_mch": {"type": "string"},
                "mean_corpuscular_haemoglobin_concentration_mchc": {"type": "string"},
                "neutrophils": {"type": "string"},
                "lymphocytes": {"type": "string"},
                "monocytes": {"type": "string"},
                "eosinophils": {"type": "string"},
                "basophils": {"type": "string"}
              }
            },
            "blood_sugar_tests": {
              "type": "object",
              "properties": {
                "fasting_blood_glucose": {"type": "string"},
                "postprandial_blood_glucose": {"type": "string"},
                "random_blood_glucose": {"type": "string"},
                "hba1c": {"type": "string"},
                "estimated_average_glucose": {"type": "string"}
              }
            },
            "lipid_profile": {
              "type": "object",
              "properties": {
                "total_cholesterol": {"type": "string"},
                "hdl_cholesterol": {"type": "string"},
                "ldl_cholesterol": {"type": "string"},
                "vldl_cholesterol": {"type": "string"},
                "triglycerides": {"type": "string"},
                "total_cholesterol_hdl_ratio": {"type": "string"}
              }
            },
            "liver_function_tests": {
              "type": "object",
              "properties": {
                "sgot_ast": {"type": "string"},
                "sgpt_alt": {"type": "string"},
                "alkaline_phosphatase_alp": {"type": "string"},
                "gamma_gt": {"type": "string"},
                "total_bilirubin": {"type": "string"},
                "direct_bilirubin": {"type": "string"},
                "indirect_bilirubin": {"type": "string"},
                "albumin": {"type": "string"},
                "globulin": {"type": "string"},
                "total_protein": {"type": "string"}
              }
            },
            "kidney_function_tests": {
              "type": "object",
              "description": "Electrolytes are recorded here once rather than duplicated as a separate serum-electrolytes field.",
              "properties": {
                "blood_urea": {"type": "string"},
                "blood_urea_nitrogen_bun": {"type": "string"},
                "serum_creatinine": {"type": "string"},
                "uric_acid": {"type": "string"},
                "estimated_gfr": {"type": "string"},
                "sodium": {"type": "string"},
                "potassium": {"type": "string"},
                "chloride": {"type": "string"},
                "bicarbonate": {"type": "string"},
                "calcium": {"type": "string"},
                "phosphorus": {"type": "string"}
              }
            },
            "thyroid_profile": {
              "type": "object",
              "properties": {
                "tsh": {"type": "string"},
                "t3": {"type": "string"},
                "t4": {"type": "string"},
                "free_t3": {"type": "string"},
                "free_t4": {"type": "string"},
                "anti_tpo_antibodies": {"type": "string"}
              }
            },
            "iron_profile": {
              "type": "object",
              "properties": {
                "serum_iron": {"type": "string"},
                "ferritin": {"type": "string"},
                "tibc": {"type": "string"},
                "transferrin": {"type": "string"},
                "transferrin_saturation": {"type": "string"}
              }
            },
            "vitamin_profile": {
              "type": "object",
              "properties": {
                "vitamin_b12": {"type": "string"},
                "vitamin_d": {"type": "string"},
                "folate": {"type": "string"},
                "vitamin_a": {"type": "string"},
                "vitamin_e": {"type": "string"}
              }
            },
            "cardiac_blood_markers": {
              "type": "object",
              "properties": {
                "troponin_i": {"type": "string"},
                "troponin_t": {"type": "string"},
                "ck_mb": {"type": "string"},
                "bnp": {"type": "string"},
                "nt_probnp": {"type": "string"}
              }
            },
            "inflammatory_markers": {
              "type": "object",
              "properties": {
                "esr": {"type": "string"},
                "crp": {"type": "string"},
                "high_sensitivity_crp": {"type": "string"},
                "procalcitonin": {"type": "string"}
              }
            },
            "other_blood_tests": {
              "type": "object",
              "properties": {
                "blood_group": {"type": "string"},
                "rh_factor": {"type": "string"},
                "pt": {"type": "string"},
                "inr": {"type": "string"},
                "aptt": {"type": "string"},
                "d_dimer": {"type": "string"},
                "serum_magnesium": {"type": "string"},
                "serum_lactate": {"type": "string"}
              }
            }
          }
        },
        "body_system_tests": {
          "type": "object",
          "description": "Non-blood tests are listed here. Blood-test results are recorded only under blood_tests.",
          "properties": {
            "heart_and_circulatory_system": {
              "type": "object",
              "properties": {
                "ecg": {"type": "string"},
                "echocardiogram": {"type": "string"},
                "treadmill_stress_test_tmt": {"type": "string"},
                "holter_monitoring": {"type": "string"},
                "ct_coronary_angiography": {"type": "string"},
                "cardiac_mri": {"type": "string"},
                "blood_pressure_monitoring": {"type": "string"},
                "vascular_doppler_ultrasound": {"type": "string"}
              }
            },
            "brain_and_nervous_system": {
              "type": "object",
              "properties": {
                "mri_brain": {"type": "string"},
                "ct_brain": {"type": "string"},
                "eeg": {"type": "string"},
                "emg": {"type": "string"},
                "nerve_conduction_study": {"type": "string"},
                "lumbar_puncture": {"type": "string"},
                "cerebrospinal_fluid_analysis": {"type": "string"}
              }
            },
            "respiratory_system": {
              "type": "object",
              "properties": {
                "chest_x_ray": {"type": "string"},
                "ct_chest": {"type": "string"},
                "pulmonary_function_test": {"type": "string"},
                "spirometry": {"type": "string"},
                "bronchoscopy": {"type": "string"},
                "pulse_oximetry": {"type": "string"},
                "arterial_blood_gas": {"type": "string"},
                "sputum_examination": {"type": "string"}
              }
            },
            "digestive_system": {
              "type": "object",
              "properties": {
                "upper_gi_endoscopy": {"type": "string"},
                "colonoscopy": {"type": "string"},
                "stool_examination": {"type": "string"},
                "stool_occult_blood_test": {"type": "string"},
                "h_pylori_test": {"type": "string"},
                "abdominal_ultrasound": {"type": "string"},
                "ct_abdomen": {"type": "string"},
                "mri_abdomen": {"type": "string"},
                "amylase": {"type": "string"},
                "lipase": {"type": "string"}
              }
            },
            "liver_and_gallbladder": {
              "type": "object",
              "description": "Liver blood tests and abdominal ultrasound are recorded in their respective categories, not repeated here.",
              "properties": {
                "fibroscan": {"type": "string"},
                "mrcp": {"type": "string"},
                "liver_biopsy": {"type": "string"},
                "gallbladder_ultrasound": {"type": "string"}
              }
            },
            "kidney_and_urinary_system": {
              "type": "object",
              "properties": {
                "urine_routine_examination": {"type": "string"},
                "urine_culture": {"type": "string"},
                "urine_albumin_microalbumin": {"type": "string"},
                "urine_protein": {"type": "string"},
                "24_hour_urine_test": {"type": "string"},
                "ultrasound_kub": {"type": "string"},
                "ct_urogram": {"type": "string"},
                "kidney_biopsy": {"type": "string"}
              }
            },
            "reproductive_system": {
              "type": "object",
              "description": "FSH and LH are recorded here once. PSA and beta-hCG are recorded under cancer_screening_and_tumour_markers.",
              "properties": {
                "semen_analysis": {"type": "string"},
                "testosterone": {"type": "string"},
                "oestrogen": {"type": "string"},
                "progesterone": {"type": "string"},
                "fsh": {"type": "string"},
                "lh": {"type": "string"},
                "prolactin": {"type": "string"},
                "pelvic_ultrasound": {"type": "string"},
                "pap_smear": {"type": "string"},
                "hpv_test": {"type": "string"}
              }
            },
            "musculoskeletal_system": {
              "type": "object",
              "description": "Calcium, vitamin D, phosphorus, uric acid, and rheumatoid factor are recorded in their respective blood-test or immune categories.",
              "properties": {
                "x_ray": {"type": "string"},
                "mri_joints": {"type": "string"},
                "ct_bone_scan": {"type": "string"},
                "dexa_scan": {"type": "string"},
                "anti_ccp": {"type": "string"},
                "creatine_kinase_ck": {"type": "string"}
              }
            },
            "eyes": {
              "type": "object",
              "properties": {
                "visual_acuity_test": {"type": "string"},
                "eye_pressure_test_tonometry": {"type": "string"},
                "fundoscopy": {"type": "string"},
                "oct_scan": {"type": "string"},
                "visual_field_test": {"type": "string"},
                "slit_lamp_examination": {"type": "string"},
                "retinal_examination": {"type": "string"}
              }
            },
            "ears_nose_and_throat": {
              "type": "object",
              "description": "Hearing assessment is captured by audiometry and tympanometry; throat swab culture is recorded under infectious_disease_tests.",
              "properties": {
                "audiometry": {"type": "string"},
                "tympanometry": {"type": "string"},
                "nasal_endoscopy": {"type": "string"},
                "laryngoscopy": {"type": "string"},
                "sinus_ct_scan": {"type": "string"}
              }
            },
            "skin": {
              "type": "object",
              "properties": {
                "skin_biopsy": {"type": "string"},
                "allergy_skin_test": {"type": "string"},
                "patch_test": {"type": "string"},
                "fungal_examination": {"type": "string"},
                "skin_scraping": {"type": "string"},
                "dermoscopy": {"type": "string"}
              }
            },
            "immune_system": {
              "type": "object",
              "properties": {
                "ana": {"type": "string"},
                "anca": {"type": "string"},
                "immunoglobulin_levels_iga_igg_igm_ige": {"type": "string"},
                "complement_c3_and_c4": {"type": "string"},
                "rheumatoid_factor": {"type": "string"},
                "anti_dsdna": {"type": "string"},
                "allergy_panel": {"type": "string"}
              }
            },
            "hormonal_and_endocrine_system": {
              "type": "object",
              "description": "Thyroid tests are recorded in thyroid_profile; FSH, LH, and reproductive hormones are recorded in reproductive_system.",
              "properties": {
                "cortisol": {"type": "string"},
                "acth": {"type": "string"},
                "insulin": {"type": "string"},
                "c_peptide": {"type": "string"},
                "growth_hormone": {"type": "string"},
                "igf_1": {"type": "string"},
                "pth": {"type": "string"}
              }
            },
            "cancer_screening_and_tumour_markers": {
              "type": "object",
              "description": "Beta-hCG is also used for pregnancy testing; record it here once rather than adding a duplicate reproductive-system field.",
              "properties": {
                "psa": {"type": "string"},
                "cea": {"type": "string"},
                "afp": {"type": "string"},
                "ca_125": {"type": "string"},
                "ca_19_9": {"type": "string"},
                "ca_15_3": {"type": "string"},
                "beta_hcg": {"type": "string"}
              }
            },
            "infectious_disease_tests": {
              "type": "object",
              "description": "Urine culture is recorded under kidney_and_urinary_system and is not duplicated here.",
              "properties": {
                "hiv_1_and_2": {"type": "string"},
                "hepatitis_b": {"type": "string"},
                "hepatitis_c": {"type": "string"},
                "dengue": {"type": "string"},
                "malaria": {"type": "string"},
                "typhoid": {"type": "string"},
                "tuberculosis": {"type": "string"},
                "covid_19": {"type": "string"},
                "blood_culture": {"type": "string"},
                "throat_swab_culture": {"type": "string"}
              }
            }
          }
        }
      }
    }
  }
}"""

def has_content(value):
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (dict, list)):
        return bool(value)
    return True


def omit_empty_values(value):
    if isinstance(value, dict):
        cleaned = {}
        for key, item in value.items():
            item = omit_empty_values(item)
            if has_content(item):
                cleaned[key] = item
        return cleaned
    if isinstance(value, list):
        cleaned = []
        for item in value:
            item = omit_empty_values(item)
            if has_content(item):
                cleaned.append(item)
        return cleaned
    return value


def get_content_type(document_path: Path) -> str:
    extension = document_path.suffix.lower()
    if extension == ".pdf":
        return "application/pdf"
    if extension in {".jpg", ".jpeg"}:
        return "image/jpeg"
    raise ValueError("Unsupported file type. Choose a PDF, JPG, or JPEG file.")


def postgres_text_expression(value: str) -> str:
    encoded = base64.b64encode(value.encode("utf-8")).decode("ascii")
    return f"convert_from(decode('{encoded}', 'base64'), 'UTF8')"


def build_sql_export(source_file: str, extracted_result: dict) -> str:
    extracted_json = json.dumps(extracted_result, ensure_ascii=False, separators=(",", ":"))
    source_expression = postgres_text_expression(source_file)
    json_expression = f"{postgres_text_expression(extracted_json)}::jsonb"
    return f"""BEGIN;
CREATE TABLE IF NOT EXISTS public.medical_document_extractions (
    extraction_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    source_file TEXT NOT NULL,
    extracted_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.medical_document_extractions (source_file, extracted_data)
VALUES ({source_expression}, {json_expression});
COMMIT;
"""


parser = argparse.ArgumentParser(description="Extract medical details from a PDF or JPEG.")
parser.add_argument(
    "document",
    type=Path,
    help="Path to the PDF, JPG, or JPEG document to process",
)
parser.add_argument(
    "--sql-output",
    type=Path,
    help="Path for the PostgreSQL .sql export (default: <document>_extracted.sql)",
)
arguments = parser.parse_args()
document_path = arguments.document
sql_output_path = arguments.sql_output or document_path.with_name(
    f"{document_path.stem}_extracted.sql"
)

try:
    content_type = get_content_type(document_path)
except ValueError as error:
    parser.error(str(error))

if not document_path.is_file():
    parser.error(f"Document does not exist or is not a file: {document_path}")

if sql_output_path.exists():
    parser.error(f"SQL output already exists; choose another path with --sql-output: {sql_output_path}")
if not sql_output_path.parent.is_dir():
    parser.error(f"SQL output directory does not exist: {sql_output_path.parent}")

# Submit the job — one multipart request, no pre-upload needed.
with document_path.open("rb") as document:
    submit = requests.post(
        f"{BASE}/job/extract",
        headers=HEADERS,
        files={"file": (document_path.name, document, content_type)},
        data={
            "schema": SCHEMA,
            "language": "en-IN",
            "output_format": "json",
            "classification": "false",
            "auto_orient": "true",
        },
        timeout=120,
    )
submit.raise_for_status()
job_id = submit.json()["job_id"]
print(f"Job created: {job_id}")

# Poll until the job reaches a terminal status.
while True:
    status_response = requests.get(
        f"{BASE}/job/{job_id}/status",
        headers=HEADERS,
        timeout=30,
    )
    status_response.raise_for_status()
    status = status_response.json()
    usage = status["usage"]
    print(f'{status["status"]} — {usage["pages_processed"]}/{usage["pages_total"]} pages')
    if status["status"] in TERMINAL:
        break
    time.sleep(2)

if status["status"] in {"failed", "rejected"}:
    raise SystemExit(f'Job {status["status"]}')

# Read the extracted fields. `annotations` mirrors `result`, with
# `confidence` and `sources` on every leaf.
results_response = requests.get(
    f"{BASE}/job/{job_id}/results",
    headers=HEADERS,
    params={"format": "json"},
    timeout=60,
)
results_response.raise_for_status()
results = results_response.json()
if "result" not in results:
    raise ValueError("The API response did not include a 'result' object.")

extracted_result = omit_empty_values(results["result"])

with psycopg.connect(DATABASE_URL) as connection:
    with connection.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS public.medical_document_extractions (
                extraction_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                source_file TEXT NOT NULL,
                extracted_data JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        """)
        cursor.execute(
            """
            INSERT INTO public.medical_document_extractions
                (source_file, extracted_data)
            VALUES (%s, %s)
            """,
            (document_path.name, Jsonb(extracted_result)),
        )




sql_output = build_sql_export(document_path.name, extracted_result)
with sql_output_path.open("x", encoding="utf-8", newline="\n") as sql_file:
    sql_file.write(sql_output)
print(f"PostgreSQL SQL export written to: {sql_output_path}")
print("EXTRACTED_RESULT_JSON=" + json.dumps(extracted_result, indent=2, ensure_ascii=False))
