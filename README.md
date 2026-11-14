# SwasthSetu

## Health-record interpreter

`modell.py` fetches a patient record from Supabase, explains it in simple
English with the configured chat model, translates the explanation with Sarvam,
and saves translated speech as an MP3.

Install the dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Copy `.env.example` to `.env`, fill in the credentials, and export them before
running the script. The script intentionally does not load or store secrets in
source code.

```bash
set -a
source .env
set +a
python3 modell.py 1 --language hi-IN
```

The patient table defaults to `patients` and is queried by `patient_code`.
The MP3 is written to `output/swasthsetu_explanation.mp3` by default.

To test only the hospital-request backend fetch, without calling any model:

```bash
python3 modell.py --hospital-request-id REQUEST_ID
```

This expects a `hospital_requests` table with a `request_id` column by default.
Set `HOSPITAL_REQUESTS_TABLE` or `HOSPITAL_REQUEST_ID_COLUMN` if your backend
uses different names.

The explanation is educational only and does not replace advice from a
qualified healthcare professional.

## Medical document scanner portal

The Vite portal in `swasthsethu/` uses Clerk for sign-in and sends uploads to
the FastAPI service in `record.py`. The service accepts PDF, JPG, or JPEG
documents, scans them with Sarvam Document AI, and stores the extracted record
encrypted in `public.medical_document_extractions`.

Configure the backend variables in a root `.env` file using `.env.example` as a
template. Set `SARVAM_API_KEY`, `DATABASE_URL`, `DATA_ENCRYPTION_KEY`,
`CLERK_ISSUER`, `CLERK_JWKS_URL`, and `CORS_ORIGINS`. Generate an encryption
key with:

```bash
python -c "from immunity import generate_encryption_key; print(generate_encryption_key())"
```

Start the API from the repository root:

```bash
python -m pip install -r requirements.txt
python -m uvicorn record:app --reload --host 0.0.0.0 --port 8000
```

Copy `swasthsethu/.env.example` to `swasthsethu/.env.local`, then set
`VITE_CLERK_PUBLISHABLE_KEY` and `VITE_RECORD_API_URL=http://localhost:8000`.
In a second terminal:

```bash
cd swasthsethu
npm ci
npm run dev
```

Sign in, enter a patient code, select a document, and choose **Scan document**.
The portal displays the extracted JSON and lets you download it. The API derives
the record owner from the verified Clerk token; it does not trust a submitted
Clerk user ID. The patient-code-to-Clerk ownership mapping is not present in the
current database schema, so the patient code itself is not validated against
an existing patient account. The API also retains an authenticated
`POST /upload-camera` endpoint for JPEG data URLs; camera images are encrypted
and saved under an owner-specific directory. The portal UI currently uses the
document scanner endpoint.

