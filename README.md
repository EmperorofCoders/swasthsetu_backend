# SwasthSetu

## Health-record interpreter

`modell.py` fetches a patient record from Supabase, explains it in simple
English with Sarvam's `sarvam-105b-conversations` model, translates the
explanation with Sarvam, and saves translated speech as an MP3.

Install the dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Copy `.env.example` to `.env`, fill in the credentials, and export them before
running the script. The script intentionally does not load or store secrets in
source code.

Set `DATABASE_URL` to the PostgreSQL connection URI for the Supabase project and
`SARVAM_API_KEY` for both the chat model and Sarvam translation and speech.
Do not commit either value. Rotate the database password if it has been shared
outside your secret manager.
The chat model defaults to `sarvam-105b-conversations` at Sarvam's v2 chat
completions endpoint. `MODEL_NAME` and `MODEL_API_URL` can override those defaults.

```bash
set -a
source .env
set +a
python3 modell.py 1 --language hi-IN
```

The patient table defaults to `medical_records` and is queried by
`patient_code`. Set `SUPABASE_TABLE` if your database uses a different table.
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

