import json
import logging
import time
import tempfile
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt import PyJWKClient
from immunity import DataProtector
import psycopg
from psycopg.types.json import Jsonb
import requests

load_dotenv(Path(__file__).resolve().with_name(".env"))

BASE = "https://api.sarvam.ai/doc-ai/v1"
TERMINAL = {"completed", "partially_completed", "failed", "rejected"}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024
logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)

app = FastAPI(title="SwasthSetu Medical Document API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

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


def required_environment_variable(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise HTTPException(
            status_code=503,
            detail=f"The server is missing the {name} environment variable.",
        )
    return value


def get_data_protector() -> DataProtector:
    encryption_key = required_environment_variable("DATA_ENCRYPTION_KEY")
    try:
        return DataProtector(encryption_key)
    except (UnicodeError, ValueError) as error:
        raise HTTPException(
            status_code=503,
            detail="DATA_ENCRYPTION_KEY is invalid.",
        ) from error


@lru_cache(maxsize=4)
def get_jwks_client(jwks_url: str) -> PyJWKClient:
    return PyJWKClient(jwks_url, cache_keys=True)


def get_current_clerk_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="A Clerk bearer token is required.")

    issuer = os.getenv("CLERK_ISSUER")
    jwks_url = os.getenv("CLERK_JWKS_URL")
    if not issuer or not jwks_url:
        raise HTTPException(
            status_code=503,
            detail="Clerk token verification is not configured on the server.",
        )

    audience = os.getenv("CLERK_AUDIENCE")
    try:
        signing_key = get_jwks_client(jwks_url).get_signing_key_from_jwt(
            credentials.credentials
        )
        claims = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["RS256"],
            issuer=issuer,
            audience=audience,
            options={
                "require": ["exp", "iat", "iss", "sub"],
                "verify_aud": audience is not None,
            },
        )
    except jwt.PyJWKClientConnectionError as error:
        logger.warning("Clerk signing keys are unavailable.")
        raise HTTPException(
            status_code=503,
            detail="Clerk authentication is temporarily unavailable.",
        ) from error
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=401, detail="Invalid Clerk bearer token.") from error

    user_id = claims.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=401, detail="Invalid Clerk bearer token.")
    return user_id


def extract_document(
    document_path: Path,
    file_name: str,
    content_type: str,
) -> dict[str, Any]:
    headers = {
        "api-subscription-key": required_environment_variable("sk_rk0w58r8_49DlOaHDy40YUKC7jKd93gMY")
    }
    with document_path.open("rb") as document:
        submit = requests.post(
            f"{BASE}/job/extract",
            headers=headers,
            files={"file": (file_name, document, content_type)},
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
    job_id = submit.json().get("job_id")
    if not isinstance(job_id, str) or not job_id:
        raise HTTPException(
            status_code=502,
            detail="Sarvam Document AI returned an invalid job response.",
        )

    try:
        timeout_seconds = int(os.getenv("SARVAM_JOB_TIMEOUT_SECONDS", "900"))
    except ValueError as error:
        raise HTTPException(
            status_code=500,
            detail="SARVAM_JOB_TIMEOUT_SECONDS must be an integer.",
        ) from error
    if timeout_seconds <= 0:
        raise HTTPException(
            status_code=500,
            detail="SARVAM_JOB_TIMEOUT_SECONDS must be positive.",
        )

    deadline = time.monotonic() + timeout_seconds
    while True:
        status_response = requests.get(
            f"{BASE}/job/{job_id}/status",
            headers=headers,
            timeout=30,
        )
        status_response.raise_for_status()
        status = status_response.json()
        if not isinstance(status, dict) or not isinstance(status.get("status"), str):
            raise HTTPException(
                status_code=502,
                detail="Sarvam Document AI returned an invalid job status.",
            )
        state = status["status"].lower()
        if state in TERMINAL:
            break
        if time.monotonic() >= deadline:
            raise HTTPException(
                status_code=504,
                detail="Timed out while waiting for document extraction.",
            )
        time.sleep(2)

    if state in {"failed", "rejected"}:
        raise HTTPException(
            status_code=422,
            detail="Sarvam Document AI could not read the uploaded document.",
        )

    results_response = requests.get(
        f"{BASE}/job/{job_id}/results",
        headers=headers,
        params={"format": "json"},
        timeout=60,
    )
    results_response.raise_for_status()
    results = results_response.json()
    if not isinstance(results, dict) or not isinstance(results.get("result"), dict):
        raise HTTPException(
            status_code=502,
            detail="Sarvam Document AI returned no extracted result.",
        )
    return omit_empty_values(results["result"])


def save_extraction(
    source_file: str,
    extracted_data: dict[str, Any],
    clerk_user_id: str,
    patient_code: str,
) -> int:
    database_url = required_environment_variable("postgresql://postgres:Supabase%40445456@db.fhzbdhoavlocadduczkn.supabase.co:5432/postgres")
    encrypted_record = get_data_protector().encrypt(
        json.dumps(
            {
                "source_file": source_file,
                "patient_code": patient_code,
                "extracted_data": extracted_data,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8"),
        clerk_user_id,
    )
    encrypted_data = Jsonb(
        {
            "version": 1,
            "encrypted": True,
            "ciphertext": encrypted_record.decode("ascii"),
        }
    )
    safe_source_file = f"document{Path(source_file).suffix.lower()}"

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS public.medical_document_extractions (
                    extraction_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    source_file TEXT NOT NULL,
                    extracted_data JSONB NOT NULL,
                    clerk_user_id TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
                """
            )
            cursor.execute(
                """
                ALTER TABLE public.medical_document_extractions
                    ADD COLUMN IF NOT EXISTS clerk_user_id TEXT
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS
                    medical_document_extractions_clerk_user_id_idx
                ON public.medical_document_extractions (clerk_user_id)
                """
            )
            cursor.execute(
                """
                INSERT INTO public.medical_document_extractions
                    (source_file, extracted_data, clerk_user_id)
                VALUES (%s, %s, %s)
                RETURNING extraction_id
                """,
                (
                    safe_source_file,
                    encrypted_data,
                    clerk_user_id,
                ),
            )
            extraction_id = cursor.fetchone()[0]
    return extraction_id


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/upload-report")
def upload_report(
    file: UploadFile = File(...),
    patient_code: str = Form(...),
    clerk_user_id: str = Depends(get_current_clerk_user),
) -> dict[str, Any]:
    patient_code = patient_code.strip()
    if not patient_code or len(patient_code) > 128:
        raise HTTPException(
            status_code=422,
            detail="patient_code must contain between 1 and 128 characters.",
        )

    file_name = Path((file.filename or "").replace("\\", "/")).name
    try:
        content_type = get_content_type(Path(file_name))
    except ValueError as error:
        raise HTTPException(
            status_code=415,
            detail="Only PDF, JPG, and JPEG documents are supported.",
        ) from error

    try:
        max_upload_bytes = int(os.getenv("MAX_UPLOAD_BYTES", str(MAX_UPLOAD_BYTES)))
    except ValueError as error:
        raise HTTPException(
            status_code=500,
            detail="MAX_UPLOAD_BYTES must be an integer.",
        ) from error
    if max_upload_bytes <= 0:
        raise HTTPException(
            status_code=500,
            detail="MAX_UPLOAD_BYTES must be positive.",
        )

    required_environment_variable("postgresql://postgres:Supabase%40445456@db.fhzbdhoavlocadduczkn.supabase.co:5432/postgres")
    required_environment_variable("sk_rk0w58r8_49DlOaHDy40YUKC7jKd93gMY")
    get_data_protector()

    with tempfile.TemporaryDirectory(prefix="swasthsetu-upload-") as temporary_directory:
        document_path = Path(temporary_directory) / file_name
        file_size = 0
        with document_path.open("wb") as destination:
            while True:
                chunk = file.file.read(1024 * 1024)
                if not chunk:
                    break
                file_size += len(chunk)
                if file_size > max_upload_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail="The uploaded document exceeds the configured size limit.",
                    )
                destination.write(chunk)
        if file_size == 0:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")

        try:
            extracted_data = extract_document(document_path, file_name, content_type)
        except requests.RequestException as error:
            logger.warning("Sarvam Document AI request failed.")
            raise HTTPException(
                status_code=502,
                detail="The document extraction service is unavailable.",
            ) from error

        try:
            extraction_id = save_extraction(
                file_name,
                extracted_data,
                clerk_user_id,
                patient_code,
            )
        except psycopg.Error as error:
            logger.error("Database write failed (SQLSTATE=%s).", error.sqlstate)
            raise HTTPException(
                status_code=503,
                detail="The extracted document could not be saved.",
            ) from error

    return {
        "status": "success",
        "message": "Document extracted and saved.",
        "extraction_id": extraction_id,
        "source_file": file_name,
        "patient_code": patient_code,
        "extracted_data": extracted_data,
    }
# camera access
from flask import Flask, request, jsonify
import base64
import os
import uuid

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/upload-camera", methods=["POST"])
def upload_camera():

    try:
        data = request.json

        image_data = data["image"]

        image_data = image_data.split(",")[1]

        image_bytes = base64.b64decode(image_data)

        filename = f"{uuid.uuid4()}.jpg"

        filepath = os.path.join(UPLOAD_FOLDER, filename)

        with open(filepath, "wb") as file:
            file.write(image_bytes)

        return jsonify({
            "success": True,
            "filename": filename,
            "message": "Image uploaded successfully"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


if __name__ == "__main__":
    app.run(debug=True)