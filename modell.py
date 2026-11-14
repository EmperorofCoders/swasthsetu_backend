"""SwasthSetu health-record interpreter.

The workflow is:

1. Read one patient record from Supabase.
2. Ask Sarvam's 105B chat model to explain the record in simple language.
3. Translate the explanation with Sarvam.
4. Convert the translated explanation to speech with Sarvam.

Credentials are read from environment variables. Never commit API keys or a
Supabase database connection string to this file.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
from typing import Any

import psycopg
from psycopg.rows import dict_row
import requests


DEFAULT_EXPLANATION_MODEL = "sarvam-105b-conversations"
DEFAULT_EXPLANATION_URL = "https://api.sarvam.ai/v2/chat/completions"
DEFAULT_TRANSLATION_MODEL = "mayura:v1"
DEFAULT_TTS_MODEL = "bulbul:v4-flash"


def required_env(name: str) -> str:
    """Return a required environment variable or raise a useful error."""

    value = os.getenv(name)
    if not value:
        raise RuntimeError(
            f"Missing {name}. Set it in the environment before running modell.py."
        )
    return value


def database_identifier(name: str, variable_name: str) -> str:
    """Validate a configured PostgreSQL identifier before interpolating it."""

    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name):
        raise ValueError(f"Invalid SQL identifier in {variable_name}: {name!r}")
    return name


def fetch_one_record(
    table_name: str,
    lookup_column: str,
    lookup_value: object,
    not_found_message: str,
) -> dict[str, Any]:
    """Fetch one row from PostgreSQL using the configured database URI."""

    database_url = required_env("DATABASE_URL")
    table_name = database_identifier(table_name, "SUPABASE_TABLE")
    lookup_column = database_identifier(lookup_column, "SUPABASE_LOOKUP_COLUMN")
    query = (
        f"SELECT * FROM public.{table_name} "
        f"WHERE {lookup_column} = %s LIMIT 1"
    )

    with psycopg.connect(database_url, row_factory=dict_row) as connection:
        record = connection.execute(query, (lookup_value,)).fetchone()

    if record is None:
        raise LookupError(not_found_message)
    return dict(record)


def fetch_patient_record(patient_code: int) -> dict[str, Any]:
    """Fetch one patient record from the configured PostgreSQL table."""

    table_name = os.getenv("SUPABASE_TABLE", "medical_records")
    return fetch_one_record(
        table_name=table_name,
        lookup_column=os.getenv("SUPABASE_LOOKUP_COLUMN", "patient_code"),
        lookup_value=patient_code,
        not_found_message=f"No patient found for patient_code={patient_code}.",
    )


def fetch_hospital_request(request_id: str) -> dict[str, Any]:
    """Fetch one hospital request from the configured PostgreSQL table.

    By default this expects a ``hospital_requests`` table with a ``request_id``
    column. Set ``HOSPITAL_REQUESTS_TABLE`` and
    ``HOSPITAL_REQUEST_ID_COLUMN`` when the backend uses different names.
    """

    table_name = os.getenv("HOSPITAL_REQUESTS_TABLE", "hospital_requests")
    id_column = os.getenv("HOSPITAL_REQUEST_ID_COLUMN", "request_id")
    return fetch_one_record(
        table_name=table_name,
        lookup_column=id_column,
        lookup_value=request_id,
        not_found_message=f"No hospital request found for request_id={request_id!r}.",
    )


def explain_record(record: dict[str, Any]) -> str:
    """Generate a simple-language explanation of a health record."""

    model_api_key = required_env("SARVAM_API_KEY")
    model_url = os.getenv("MODEL_API_URL", DEFAULT_EXPLANATION_URL)
    model_name = os.getenv("MODEL_NAME", DEFAULT_EXPLANATION_MODEL)

    # The model does not need direct identifiers to explain the clinical data.
    record_for_model = {
        key: value
        for key, value in record.items()
        if key not in {"patient_code", "patient_name", "email", "phone"}
    }
    prompt = (
        "Explain this health record in simple, reassuring language for a patient. "
        "Define medical terms, explain what each value means, and clearly point out "
        "anything the patient should discuss with a qualified healthcare professional. "
        "Do not diagnose, prescribe medication, or invent missing information. "
        "Use short headings and bullet points.\n\n"
        f"Health record:\n{json.dumps(record_for_model, indent=2, default=str)}"
    )

    explanation_parts: list[str] = []
    with requests.post(
        model_url,
        headers={
            "api-subscription-key": model_api_key,
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        },
        json={
            "model": model_name,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a careful health-record interpreter. Give general "
                        "educational information, not medical advice."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "stream": True,
            "temperature": 0.5,
            "top_p": 0.95,
            "max_tokens": 2048,
        },
        stream=True,
        timeout=90,
    ) as response:
        response.raise_for_status()

        for line in response.iter_lines():
            if not line:
                continue
            if isinstance(line, bytes):
                line = line.decode("utf-8")
            if not line.startswith("data:"):
                continue

            data = line[5:].strip()
            if data == "[DONE]":
                break

            try:
                chunk = json.loads(data)
                delta = chunk["choices"][0]["delta"]
            except (json.JSONDecodeError, KeyError, IndexError, TypeError) as error:
                raise RuntimeError(
                    f"Unexpected Sarvam explanation-stream chunk: {data}"
                ) from error

            content = delta.get("content")
            if isinstance(content, str) and content:
                explanation_parts.append(content)

    explanation = "".join(explanation_parts).strip()
    if not explanation:
        raise RuntimeError("Sarvam chat model returned an empty explanation.")
    return explanation


def translate_text(text: str, target_language_code: str) -> str:
    """Translate the explanation using Sarvam."""

    from sarvamai import SarvamAI

    client = SarvamAI(api_subscription_key=required_env("SARVAM_API_KEY"))
    response = client.text.translate(
        input=text,
        source_language_code="en-IN",
        target_language_code=target_language_code,
        model=os.getenv("TRANSLATION_MODEL", DEFAULT_TRANSLATION_MODEL),
        numerals_format=os.getenv("NUMERALS_FORMAT", "international"),
        mode=os.getenv("TRANSLATION_MODE", "formal"),
    )
    return response.translated_text


def text_to_speech(text: str, language_code: str, output_path: Path) -> Path:
    """Convert translated text to an MP3 file using Sarvam."""

    if len(text) > 3500:
        raise ValueError(
            "The translated explanation is longer than Sarvam's 3,500-character "
            "streaming limit. Reduce the explanation length before generating audio."
        )

    from sarvamai import SarvamAI

    client = SarvamAI(api_subscription_key=required_env("SARVAM_API_KEY"))
    audio_stream = client.text_to_speech.convert_stream(
        text=text,
        language_code=language_code,
        speaker=os.getenv("TTS_SPEAKER", "aparna_hi_customer"),
        model=os.getenv("TTS_MODEL", DEFAULT_TTS_MODEL),
        pace=float(os.getenv("TTS_PACE", "1")),
        speech_sample_rate=int(os.getenv("TTS_SAMPLE_RATE", "24000")),
        output_audio_codec="mp3",
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("wb") as audio_file:
        for chunk in audio_stream:
            audio_file.write(chunk)
    return output_path


def interpret_patient_record(
    patient_code: int,
    target_language_code: str = "hi-IN",
    audio_path: str = "output/swasthsetu_explanation.mp3",
) -> dict[str, Any]:
    """Run the complete fetch, explain, translate, and speech workflow."""

    record = fetch_patient_record(patient_code)
    explanation = explain_record(record)
    translation = translate_text(explanation, target_language_code)
    saved_audio = text_to_speech(
        translation,
        target_language_code,
        Path(audio_path),
    )

    return {
        "record": record,
        "explanation_en": explanation,
        "explanation_translated": translation,
        "audio_file": str(saved_audio),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Explain a SwasthSetu patient record and create translated speech."
    )
    parser.add_argument(
        "patient_code",
        type=int,
        nargs="?",
        help="Patient code for the full explanation workflow.",
    )
    parser.add_argument(
        "--hospital-request-id",
        help="Fetch and print one hospital request, without calling any model.",
    )
    parser.add_argument(
        "--language",
        default="hi-IN",
        help="Sarvam language code, for example hi-IN, ta-IN, or te-IN.",
    )
    parser.add_argument(
        "--audio",
        default="output/swasthsetu_explanation.mp3",
        help="Path for the generated MP3 file.",
    )
    args = parser.parse_args()

    if args.hospital_request_id is not None:
        hospital_request = fetch_hospital_request(args.hospital_request_id)
        print(json.dumps(hospital_request, indent=2, default=str))
        return

    if args.patient_code is None:
        parser.error("provide patient_code or --hospital-request-id")

    result = interpret_patient_record(
        patient_code=args.patient_code,
        target_language_code=args.language,
        audio_path=args.audio,
    )
    print(result["explanation_en"])
    print(f"\nTranslated explanation ({args.language}):\n{result['explanation_translated']}")
    print(f"\nAudio saved to: {result['audio_file']}")


if __name__ == "__main__":
    main()
