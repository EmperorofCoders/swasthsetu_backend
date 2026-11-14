import os
import time
import json
import tempfile
import requests
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from sarvamai import SarvamAI

app = FastAPI()

# Allow your hosted frontend website to talk to this online server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load keys from Render's online Environment Variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY")

API_URL = "https://api.sarvam.ai/v2/chat/completions"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
sarvam_client = SarvamAI(api_subscription_key=SARVAM_API_KEY)


@app.post("/upload-report")
async def upload_report(
    file: UploadFile = File(...),
    clerk_user_id: str = Form(...),
    patient_code: str = Form(...)
):
    # STEP 1: Save the uploaded PDF/Image temporarily so Sarvam AI can read it
    suffix = os.path.splitext(file.filename)[1] or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # STEP 2: Extract text from the PDF/Image using Sarvam Document AI (Parse)
        mime_type = file.content_type or "application/pdf"
        with open(tmp_path, "rb") as f:
            job = sarvam_client.doc_ai.parse(
                file=[(file.filename, f, mime_type)],
                language="en-IN",
                output_format="md"
            )

        # Wait a few seconds for Sarvam AI to finish reading the document
        while True:
            status_res = sarvam_client.doc_ai.get_status(job_id=job.job_id)
            state = status_res.status.lower()
            if state in ("completed", "partially_completed"):
                break
            elif state in ("failed", "rejected"):
                raise HTTPException(status_code=500, detail="Sarvam AI could not read the file.")
            time.sleep(2)

        # Fetch the extracted Markdown text from Sarvam AI
        parsed_output = sarvam_client.doc_ai.get_results(job_id=job.job_id, format="md")
        extracted_text = str(parsed_output)

        # STEP 3: Ask Gemma 4 31B (gemma4) via v2/chat/completions to generate the SQL INSERT query
        prompt_message = f"""You are a medical SQL generator. Convert the medical report text below into a single valid PostgreSQL INSERT statement for the table `public.medical_records`.

Columns you MUST include in the INSERT statement:
- clerk_user_id: MUST be '{clerk_user_id}'
- patient_code: MUST be '{patient_code}'
- document_name: Create a specific name based on what the document is (e.g. 'Cardiology Prescription - Dr. Sharma' or 'ACL Surgery Report')
- document_type: Category such as 'Prescription', 'Lab Report', 'Surgery Report', or 'Discharge Summary'
- doctor_or_hospital: Doctor or hospital name mentioned (or 'Unknown')
- diagnosis_or_findings: Key test numbers, diagnosis, or surgical findings
- medications_or_procedures: Medicines with dosages or procedures performed
- raw_transcript: Short summary of the raw text

Strict Rules:
1. Output ONLY the raw SQL query starting with: INSERT INTO public.medical_records
2. Do NOT include ```sql or any explanation.
3. Escape any single quotes inside text by doubling them ('').

Medical Report Text:
{extracted_text[:6000]}"""

        headers = {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json",
        }
        payload = {
            "model": "gemma4",
            "messages": [
                {
                    "role": "user",
                    "content": prompt_message
                }
            ],
            "stream": True,
            "temperature": 0.1,
            "top_p": 0.95,
            "max_tokens": 8192
        }

        response = requests.post(API_URL, headers=headers, json=payload, stream=True)
        response.raise_for_status()

        # Collect the streamed chunks into a single SQL query string
        sql_chunks = []
        for line in response.iter_lines():
            if line:
                line_str = line.decode("utf-8")
                if line_str.startswith("data: "):
                    data = line_str[6:]
                    if data == "[DONE]":
                        break
                    chunk = json.loads(data)
                    delta = chunk["choices"][0]["delta"]
                    if "content" in delta and delta["content"]:
                        sql_chunks.append(delta["content"])

        sql_query = "".join(sql_chunks).strip()
        # Clean markdown fences just in case the AI added them
        sql_query = sql_query.replace("```sql", "").replace("```", "").strip()

        # STEP 4: Push the SQL query directly into Supabase
        supabase.rpc("exec_ai_sql", {"sql_query": sql_query}).execute()

        return {
            "status": "success",
            "message": "Document extracted with Gemma 4 31B and saved to Supabase!",
            "executed_sql": sql_query
        }

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)