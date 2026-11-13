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

## Medical document scanner UI

Install the dependencies with `python -m pip install -r requirements.txt`.
Create a local `.env` file in the project root with `SARVAM_API_KEY` and
`DATABASE_URL` (the `.env` file is ignored by Git), or set those variables in
the environment. Start the uploader with:

```bash
python -m streamlit run streamlit_app.py
```

The UI accepts one PDF, JPG, or JPEG at a time. It invokes `record.py`, which
extracts the document fields and saves them to
`public.medical_document_extractions`. The uploaded file is held in a temporary
directory during scanning; the UI also offers the generated SQL export for
download.

