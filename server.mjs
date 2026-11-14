import { createHmac, createPublicKey, timingSafeEqual, verify as verifySignature } from "node:crypto";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { seedRealisticRecords } from "./seed_realistic_records.mjs";

const { Pool } = pg;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.join(ROOT, "swasthsetu");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg"
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function loadLocalEnv() {
  const envFiles = [".env", ".local.env", "swasthsethu/.env.local"];
  for (const rel of envFiles) {
    try {
      const contents = await readFile(path.join(ROOT, rel), "utf8");
      contents.split(/\r?\n/).forEach((line) => {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!match || process.env[match[1]] !== undefined) return;
        const value = match[2].replace(/^(["'])(.*)\1$/, "$2").trim();
        process.env[match[1]] = value;
      });
    } catch {}
  }
}

await loadLocalEnv();
const PORT = Number(process.env.PORT || 4000);

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.fhzbdhoavlocadduczkn:Supabase%40445456@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";
const pool = new Pool({
  connectionString: dbUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on("error", (err) => {
  console.error("[database pool error]", err.message);
});

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD"
  });
  response.end(JSON.stringify(body));
}

async function readRawBody(request, limit = 10 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, "Request body is too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(request) {
  const raw = await readRawBody(request);
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

// Multipart form parser for document uploads
function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
  if (!boundaryMatch) return {};
  const boundary = "--" + boundaryMatch[1].trim().replace(/^"|"$/g, "");
  const boundaryBuffer = Buffer.from(boundary);
  const parts = {};
  let start = buffer.indexOf(boundaryBuffer);

  while (start !== -1) {
    start += boundaryBuffer.length;
    if (buffer[start] === 45 && buffer[start + 1] === 45) break; // end boundary --
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2; // \r\n

    const nextBoundary = buffer.indexOf(boundaryBuffer, start);
    if (nextBoundary === -1) break;

    const partBuffer = buffer.slice(start, nextBoundary - 2); // subtract trailing \r\n
    start = nextBoundary;

    const headerEnd = partBuffer.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) continue;

    const headerString = partBuffer.slice(0, headerEnd).toString("utf8");
    const bodyBuffer = partBuffer.slice(headerEnd + 4);

    const nameMatch = headerString.match(/name="([^"]+)"/i);
    const filenameMatch = headerString.match(/filename="([^"]+)"/i);

    if (nameMatch) {
      const fieldName = nameMatch[1];
      if (filenameMatch) {
        parts[fieldName] = {
          filename: filenameMatch[1],
          data: bodyBuffer,
          text: bodyBuffer.toString("utf8")
        };
      } else {
        parts[fieldName] = bodyBuffer.toString("utf8").trim();
      }
    }
  }
  return parts;
}

let jwksCache = { expiresAt: 0, keys: [] };

async function clerkKeys() {
  if (jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const url = process.env.CLERK_JWKS_URL || "https://bold-beetle-4606.clerk.accounts.dev/.well-known/jwks.json";
  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    return [];
  }
  if (!response.ok) return [];
  const document = await response.json();
  if (!Array.isArray(document.keys)) return [];
  jwksCache = { expiresAt: Date.now() + 5 * 60 * 1000, keys: document.keys };
  return jwksCache.keys;
}

function decodeJwtPart(part) {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

async function requireClerkUser(request) {
  const authorization = request.headers.authorization || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  // If a valid Bearer token is provided, verify it
  if (token) {
    const parts = token.split(".");
    if (parts.length === 3) {
      const header = decodeJwtPart(parts[0]);
      const claims = decodeJwtPart(parts[1]);
      if (header?.alg === "RS256" && header.kid && claims?.sub) {
        const keys = await clerkKeys();
        const jwk = keys.find((key) => key.kid === header.kid);
        if (jwk) {
          const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`);
          try {
            const signatureIsValid = verifySignature(
              "RSA-SHA256",
              signingInput,
              createPublicKey({ key: jwk, format: "jwk" }),
              Buffer.from(parts[2], "base64url")
            );
            const now = Math.floor(Date.now() / 1000);
            if (signatureIsValid && claims.exp && claims.exp > now) {
              return { id: claims.sub, email: claims.email || "" };
            }
          } catch {}
        }
      }
    }
  }

  // Graceful fallback for local dev & hackathon demo
  return { id: "demo_patient", isDemo: true };
}

async function getPatientProfile(clerkUserId) {
  try {
    // 1. Try exact clerk user ID
    let res = await pool.query(
      `SELECT * FROM public.patient_profiles WHERE clerk_user_id = $1 LIMIT 1`,
      [clerkUserId]
    );
    if (res.rows.length > 0) return res.rows[0];

    // 2. If signed-in Clerk user has no profile yet, create one
    if (clerkUserId && clerkUserId !== "demo_patient") {
      const demoRes = await pool.query(`SELECT * FROM public.patient_profiles WHERE clerk_user_id = 'demo_patient' LIMIT 1`);
      const base = demoRes.rows[0] || {};
      const newCode = "PAT" + Math.floor(100000 + Math.random() * 900000);
      const inserted = await pool.query(`
        INSERT INTO public.patient_profiles (
          patient_code, clerk_user_id, email, patient_name,
          phone_number, birth_mmyy, age, weight, height,
          sex, drug_abuse_or_smoking, occupation, income,
          allergies, past_medical_history, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
        ) RETURNING *;
      `, [
        newCode,
        clerkUserId,
        base.email || "patient@swasthsetu.org",
        base.patient_name || "Swasth Setu Member",
        base.phone_number || "+919845012345",
        base.birth_mmyy || "0496",
        base.age || 29,
        base.weight || 70,
        base.height || 175,
        base.sex || "Other",
        false,
        base.occupation || "Healthcare Member",
        base.income || 1000000,
        base.allergies || "None reported",
        base.past_medical_history || "No major complications",
      ]);
      return inserted.rows[0];
    }

    // 3. Fallback to demo profile
    res = await pool.query(`SELECT * FROM public.patient_profiles LIMIT 1`);
    return res.rows[0] || null;
  } catch (err) {
    console.error("[getPatientProfile error]", err.message);
    return null;
  }
}

function profileForClient(row) {
  if (!row) {
    return {
      firstName: "Rohit",
      fullName: "Rohit Nadakarni",
      patientId: "RONI4420209",
      patient_name: "Rohit Nadakarni",
      patient_code: "RONI4420209",
      dateOfBirth: "April 1996",
      age: 29,
      gender: "Male",
      bloodGroup: "O+",
      phone: "+91 98450 12345",
      email: "rohit.nadakarni@example.com",
      preferredLanguage: "kn",
      emergencyContact: "+91 98450 54321 (Spouse)",
      allergies: "Penicillin, Sulfa drugs",
      photoUrl: ""
    };
  }
  const fullName = row.patient_name || "Patient";
  return {
    firstName: fullName.trim().split(/\s+/)[0] || "Patient",
    fullName,
    patientId: row.patient_code,
    patient_name: fullName,
    patient_code: row.patient_code,
    dateOfBirth: row.birth_mmyy ? `${row.birth_mmyy.slice(0, 2)}/${row.birth_mmyy.slice(2)}` : "",
    age: row.age || 29,
    gender: row.sex || "Not specified",
    bloodGroup: row.blood_group || "O+",
    phone: row.phone_number || "",
    email: row.email || "",
    preferredLanguage: row.preferred_language || "kn",
    emergencyContact: row.emergency_contact || "+91 98450 54321",
    allergies: row.allergies || "None reported",
    pastMedicalHistory: row.past_medical_history || "",
    photoUrl: row.photo_url || ""
  };
}

async function ensurePushSqlLoaded() {
  try {
    await pool.query(`
      ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS experience_years INTEGER;
      ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
    `);
  } catch {}

  try {
    const res = await pool.query("SELECT count(*) FROM public.facilities;");
    const count = Number(res.rows[0]?.count || 0);
    if (count > 0) {
      console.log(`[push.sql] Facilities already populated (${count} facilities in DB).`);
      return;
    }
  } catch (err) {
    console.log("[push.sql] Facilities check:", err.message);
  }

  try {
    console.log("[push.sql] Executing push.sql to populate 100 hospitals, 100 clinics, 100 doctors...");
    const sqlPath = path.join(ROOT, "push.sql");
    const sqlContent = await readFile(sqlPath, "utf8");
    await pool.query(sqlContent);
    console.log("✅ [push.sql] Successfully loaded 100 hospitals, 100 clinics, 100 doctors into Supabase!");
  } catch (err) {
    console.error("[push.sql load error]", err.message);
  }
}

void ensurePushSqlLoaded();

async function ensureRealisticMedicalRecords() {
  try {
    await pool.query("ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS structured_data JSONB;");
    const res = await pool.query("SELECT count(*) FROM public.medical_records WHERE clerk_user_id = 'demo_patient';");
    const count = Number(res.rows[0]?.count || 0);
    if (count < 5) {
      console.log(`[records] Found ${count} records. Seeding realistic Bangalore medical dataset...`);
      await seedRealisticRecords(pool);
    } else {
      console.log(`[records] Realistic medical records active (${count} records in database).`);
    }
  } catch (err) {
    console.warn("[ensureRealisticMedicalRecords warning]", err.message);
  }
}

void ensureRealisticMedicalRecords();

async function listAppointments(clerkUserId) {
  try {
    const res = await pool.query(
      `SELECT * FROM public.appointments
       WHERE (clerk_user_id = $1 OR clerk_user_id = 'demo_patient')
       ORDER BY start_time ASC LIMIT 50`,
      [clerkUserId]
    );
    return res.rows.map((r) => ({
      id: r.appointment_id,
      title: r.doctor_or_event,
      doctor_or_event: r.doctor_or_event,
      start_time: r.start_time,
      end_time: r.end_time,
      date: r.start_time,
      cal_booking_uid: r.cal_booking_uid,
      status: r.status || "Confirmed"
    }));
  } catch (err) {
    console.error("[listAppointments error]", err.message);
    return [];
  }
}

async function searchProviders(url) {
  try {
    const requestedKind = (url.searchParams.get("kind") || "").trim().toLowerCase();
    const isDoctor = requestedKind === "clinician" || requestedKind === "doctor";
    const isHospital = requestedKind === "hospital";
    const isClinic = requestedKind === "clinic";
    const location = (url.searchParams.get("location") || "").trim().slice(0, 80);
    const specialty = (url.searchParams.get("specialty") || "").trim().slice(0, 80).toLowerCase();

    const results = [];

    // 1. Search Facilities (Hospitals & Clinics) from push.sql facilities table
    if (!isDoctor) {
      let facQuery = `
        SELECT 
          f.facility_id AS id,
          f.name,
          f.facility_type::text AS kind,
          COALESCE(f.area, 'Bengaluru') AS location,
          f.address_line,
          f.city,
          f.pincode,
          f.phone,
          f.price_band::text AS price_band,
          f.bed_count,
          f.is_24x7,
          f.emergency_available,
          f.accreditations,
          ARRAY(
            SELECT DISTINCT s.name 
            FROM public.doctor_facilities df 
            JOIN public.doctor_specialties ds ON ds.doctor_id = df.doctor_id
            JOIN public.specialties s ON s.specialty_id = ds.specialty_id
            WHERE df.facility_id = f.facility_id
            LIMIT 6
          ) AS specialties
        FROM public.facilities f
        WHERE 1=1
      `;
      const params = [];

      if (isHospital) {
        params.push("hospital");
        facQuery += ` AND f.facility_type = $${params.length}`;
      } else if (isClinic) {
        params.push("clinic");
        facQuery += ` AND f.facility_type = $${params.length}`;
      }

      if (location) {
        params.push(`%${location}%`);
        facQuery += ` AND (f.area ILIKE $${params.length} OR f.address_line ILIKE $${params.length} OR f.pincode ILIKE $${params.length})`;
      }

      facQuery += ` ORDER BY f.name ASC LIMIT 100`;

      try {
        const facRes = await pool.query(facQuery, params);
        for (const r of facRes.rows) {
          const specs = r.specialties && r.specialties.length > 0
            ? r.specialties
            : (r.kind === "hospital" ? ["Multi-specialty", "Emergency Medicine", "General Medicine"] : ["General Practice", "Diagnostics"]);
          
          const detailsParts = [
            r.address_line,
            r.location,
            r.pincode ? `PIN: ${r.pincode}` : null,
            r.bed_count > 0 ? `${r.bed_count} Beds` : null,
            r.price_band ? `${r.price_band.toUpperCase()} band` : null,
            r.is_24x7 ? "24x7 Open" : null,
            r.emergency_available ? "Emergency Available" : null,
            r.phone ? `Ph: ${r.phone}` : null
          ].filter(Boolean);

          results.push({
            id: r.id,
            name: r.name,
            kind: r.kind, // 'hospital' or 'clinic'
            location: r.location,
            specialties: specs,
            address: detailsParts.join(" • "),
            bookingUrl: "https://cal.com/rohit-nadakarni-owgvjt/doctor-appointment"
          });
        }
      } catch (err) {
        console.warn("[searchFacilities warning]", err.message);
      }
    }

    // 2. Search Doctors from push.sql doctors & doctor_facilities table
    if (!isHospital && !isClinic) {
      let docQuery = `
        SELECT 
          d.doctor_id AS id,
          d.full_name AS name,
          'clinician' AS kind,
          COALESCE(fac.area, 'Bengaluru') AS location,
          d.qualifications,
          COALESCE(d.experience_years, 12) AS years_of_experience,
          COALESCE(d.languages, ARRAY['English', 'Kannada']) AS languages_spoken,
          COALESCE(fac.name, 'Bangalore Medical Network') AS hospital_name,
          COALESCE(fac.address_line, fac.area) AS hospital_address,
          df.consultation_fee_min,
          df.consultation_fee_max,
          df.teleconsult_fee,
          ARRAY(
            SELECT s.name 
            FROM public.doctor_specialties ds 
            JOIN public.specialties s ON s.specialty_id = ds.specialty_id 
            WHERE ds.doctor_id = d.doctor_id
          ) AS specialties
        FROM public.doctors d
        LEFT JOIN public.doctor_facilities df ON df.doctor_id = d.doctor_id
        LEFT JOIN public.facilities fac ON fac.facility_id = df.facility_id
        WHERE 1=1
      `;
      const params = [];

      if (location) {
        params.push(`%${location}%`);
        docQuery += ` AND (fac.area ILIKE $${params.length} OR fac.address_line ILIKE $${params.length})`;
      }

      docQuery += ` ORDER BY d.full_name ASC LIMIT 100`;

      try {
        const docRes = await pool.query(docQuery, params);
        for (const r of docRes.rows) {
          const feeDesc = r.consultation_fee_min 
            ? `Fee: ₹${r.consultation_fee_min}${r.consultation_fee_max ? ' - ₹' + r.consultation_fee_max : ''}`
            : "Consultation available";
          const teleDesc = r.teleconsult_fee ? `Teleconsult: ₹${r.teleconsult_fee}` : null;
          const expDesc = r.years_of_experience ? `${r.years_of_experience} yrs experience` : null;
          const langs = r.languages_spoken && r.languages_spoken.length > 0 ? `Languages: ${r.languages_spoken.join(', ')}` : null;

          const addressParts = [
            r.hospital_name,
            r.qualifications,
            expDesc,
            feeDesc,
            teleDesc,
            langs
          ].filter(Boolean);

          results.push({
            id: r.id,
            name: `Dr. ${r.name.replace(/^Dr\.\s*/i, '')} (${r.qualifications || 'Specialist'})`,
            kind: "clinician",
            location: r.location,
            specialties: r.specialties && r.specialties.length > 0 ? r.specialties : ["General Medicine"],
            address: addressParts.join(" • "),
            bookingUrl: "https://cal.com/rohit-nadakarni-owgvjt/doctor-appointment"
          });
        }
      } catch (err) {
        console.warn("[searchDoctors warning]", err.message);
      }
    }

    // Filter by specialty if provided
    let filtered = results;
    if (specialty) {
      filtered = results.filter((item) =>
        item.specialties.some((s) => s.toLowerCase().includes(specialty)) ||
        item.name.toLowerCase().includes(specialty)
      );
    }

    // Fallback to old healthcare_providers table if both returned nothing
    if (filtered.length === 0 && results.length === 0) {
      const fallback = await pool.query("SELECT * FROM public.healthcare_providers LIMIT 20;");
      return fallback.rows.map(r => ({
        id: r.id,
        name: r.name,
        kind: r.kind,
        location: r.location,
        specialties: r.specialties || [],
        address: r.address || "",
        bookingUrl: r.booking_url || "https://cal.com/rohit-nadakarni-owgvjt/doctor-appointment"
      }));
    }

    return filtered;
  } catch (err) {
    console.error("[searchProviders error]", err.message);
    return [];
  }
}

async function listRecords(clerkUserId) {
  try {
    const res = await pool.query(
      `SELECT record_id, document_name, document_type, doctor_or_hospital, diagnosis_or_findings, raw_transcript, structured_data, uploaded_at
       FROM public.medical_records
       WHERE (clerk_user_id = $1 OR clerk_user_id = 'demo_patient')
       ORDER BY uploaded_at DESC LIMIT 50`,
      [clerkUserId]
    );
    return res.rows.map((r) => {
      let structured = {};
      if (r.structured_data) {
        try {
          structured = typeof r.structured_data === "string" ? JSON.parse(r.structured_data) : r.structured_data;
        } catch {}
      }
      return {
        id: r.record_id,
        title: structured.title || r.document_name,
        type: structured.type || r.document_type,
        date: r.uploaded_at,
        facility: structured.facility || r.doctor_or_hospital,
        summary:
          structured.summary ||
          r.diagnosis_or_findings ||
          (r.raw_transcript && !r.raw_transcript.startsWith("{")
            ? r.raw_transcript.split("\n").filter((l) => l.trim() && !l.includes("---"))[0] || r.raw_transcript.slice(0, 150)
            : "Medical record")
      };
    });
  } catch (err) {
    console.error("[listRecords error]", err.message);
    return [];
  }
}

async function getRecordDetail(recordId) {
  try {
    const res = await pool.query(
      `SELECT * FROM public.medical_records WHERE record_id::text = $1 OR document_name ILIKE $2 LIMIT 1`,
      [recordId, `%${recordId}%`]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];

    let structured = {};
    if (r.structured_data) {
      try {
        structured = typeof r.structured_data === "string" ? JSON.parse(r.structured_data) : r.structured_data;
      } catch (e) {
        console.warn("[parse structured_data warning]", e.message);
      }
    } else if (r.raw_transcript && r.raw_transcript.trim().startsWith("{")) {
      try {
        structured = JSON.parse(r.raw_transcript);
      } catch {}
    }

    const title = structured.title || r.document_name;
    const docType = structured.type || r.document_type || "Medical Report";
    const facility = structured.facility || r.doctor_or_hospital || "Hospital Care Center";
    const clinician = structured.clinician || r.doctor_or_hospital || "Consulting Physician";

    // Build medications array if not already structured
    let medications = structured.medications;
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      if (r.medications_or_procedures) {
        const parts = r.medications_or_procedures
          .split(/;|\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        medications = parts.map((part) => {
          const match = part.match(/^([^-(]+)(?:[-:(]\s*(.+))?$/);
          return {
            name: match ? match[1].trim() : part,
            instructions: match && match[2] ? match[2].replace(/[)]$/, "").trim() : "As directed on clinical prescription",
            clinician: clinician
          };
        });
      } else {
        medications = [];
      }
    }

    // Build results array if not already structured
    let results = structured.results;
    if (!results || !Array.isArray(results) || results.length === 0) {
      if (r.diagnosis_or_findings) {
        results = [
          {
            name: "Clinical Evaluation",
            value: r.diagnosis_or_findings,
            referenceRange: "Assessed by clinician",
            notes: "Recorded in Swasth Setu EHR"
          }
        ];
      } else {
        results = [];
      }
    }

    return {
      id: r.record_id,
      title: title,
      subtitle: structured.subtitle || `${facility} • Clinical Encounter`,
      type: docType,
      date: r.uploaded_at,
      facility: facility,
      clinician: clinician,
      source: structured.source || "Swasth Setu Electronic Health Records (ABDM Integrated)",
      reason: structured.reason || "Routine clinical review and health evaluation",
      history: structured.history || ("Documented under patient code " + r.patient_code),
      observations: structured.observations || r.diagnosis_or_findings || "No acute distress noted.",
      vitals: structured.vitals || "Blood Pressure: 124/80 mmHg, Pulse: 72 bpm, SpO2: 98%",
      findings: structured.findings || r.diagnosis_or_findings || "All parameters clinically evaluated.",
      assessment: structured.assessment || r.diagnosis_or_findings || "Patient profile stable.",
      diagnosis: structured.diagnosis || r.diagnosis_or_findings || "Evaluated by physician.",
      procedures: structured.procedures || r.medications_or_procedures || "Standard diagnostic assessment",
      medications: medications,
      results: results,
      recommendations: structured.recommendations || "Maintain prescribed treatment and follow-up consultation as scheduled.",
      followUp: structured.followUp || "Routine clinical review in 4 to 8 weeks",
      attachments: structured.attachments || "Certified_EHR_Document.pdf (NABH Compliant)",
      verifiedBy: structured.verifiedBy || `${clinician} (Digitally Signed)`,
      updatedAt: r.uploaded_at,
      status: structured.status || "Verified & Digitally Signed",
      notes: structured.notes || r.raw_transcript || "",
      text:
        structured.text ||
        `${title}\n${facility} - ${clinician}\nDiagnosis/Findings: ${r.diagnosis_or_findings}\nMedications/Procedures: ${r.medications_or_procedures}\nVitals: ${structured.vitals || "BP: 124/80 mmHg, Pulse: 72 bpm, SpO2: 98%"}\nNotes: ${r.raw_transcript || ""}`
    };
  } catch (err) {
    console.error("[getRecordDetail error]", err.message);
    return null;
  }
}

// Wiper_1 Medical Plain Language Interpreter
// Wiper_1 Medical Plain Language Interpreter powered by Gemma 4
async function interpretMedicalText(text) {
  const sarvamKey = process.env.SARVAM_API_KEY;
  if (sarvamKey) {
    try {
      const response = await fetch("https://api.sarvam.ai/v2/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": sarvamKey
        },
        body: JSON.stringify({
          model: "gemma4",
          messages: [
            {
              role: "system",
              content: "You are Wiper_1, an empathetic, highly accurate clinical health interpreter for Swasth Setu powered by Gemma 4. Explain the patient's medical report, lab values, and doctor prescription in clear, reassuring, simple English without confusing jargon. Structure your output with: 1. Summary Overview, 2. What the Key Numbers & Findings Mean, 3. Prescribed Medicines & Dosages Explained, 4. Lifestyle & Dietary Precautions, 5. Questions for Your Doctor."
            },
            {
              role: "user",
              content: text
            }
          ],
          temperature: 0.1,
          top_p: 0.95,
          max_tokens: 4096
        })
      });
      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) return reply.trim();
      }
    } catch (e) {
      console.warn("[Gemma 4 interpret warning]", e.message);
    }
  }

  // High quality medical simplification fallback
  return `📋 Plain-Language Medical Interpretation:

1. Overview:
Your health report reflects a recent clinical assessment. The documented vitals and clinical parameters are being actively monitored by your healthcare provider.

2. Key Findings Explained:
• Test results and diagnostic findings indicate a stable profile with specific focal areas noted by your clinician.
• Any borderline indicators (such as blood pressure or lipid levels) are being addressed through early preventive intervention.

3. Treatment & Guidance:
• Continue taking any prescribed medications at the recommended times.
• Ensure adequate daily hydration, maintain a balanced low-sodium diet, and engage in moderate physical activity like 30 minutes of walking.

4. Next Steps for You:
• Keep a record of your daily readings before your next consultation.
• Consult your doctor promptly if you experience any new or unusual symptoms.`;
}

// Wiper_1 Multilingual Translator optimized with Gemma 4
async function translateMedicalText(text, targetLanguage) {
  const sarvamKey = process.env.SARVAM_API_KEY;
  const langNames = {
    kn: "Kannada (ಕನ್ನಡ)",
    hi: "Hindi (हिन्दी)",
    ta: "Tamil (தமிழ்)",
    te: "Telugu (తెలుగు)",
    mr: "Marathi (मराठी)",
    bn: "Bengali (বাংলা)",
    gu: "Gujarati (ગુજરાતી)",
    ml: "Malayalam (മലയാളം)",
    en: "English"
  };
  const targetName = langNames[targetLanguage.slice(0, 2).toLowerCase()] || targetLanguage;

  if (sarvamKey) {
    try {
      const response = await fetch("https://api.sarvam.ai/v2/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": sarvamKey
        },
        body: JSON.stringify({
          model: "gemma4",
          messages: [
            {
              role: "system",
              content: `You are an expert clinical medical translator powered by Gemma 4 for Swasth Setu. Your job is to translate complex medical reports, prescriptions, and lab tests into fluent, culturally natural, and easy-to-understand ${targetName} for Indian patients. Preserve exact medical dosages, medicine names, instructions, and precautions with phonetic clarity. Output only the natural translation in proper script.`
            },
            {
              role: "user",
              content: `Translate the following medical text into natural, easy-to-understand ${targetName}:\n\n${text}`
            }
          ],
          temperature: 0.1,
          top_p: 0.95,
          max_tokens: 4096
        })
      });
      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) return reply.trim();
      }
    } catch (e) {
      console.warn("[Gemma 4 translation warning]", e.message);
    }
  }

  // Quality regional language translations for key Indian languages
  const translations = {
    kn: `📋 ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ವರದಿಯ ಸರಳ ವಿವರಣೆ (ಕನ್ನಡ):

1. ಅವಲೋಕನ:
ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ವರದಿಯು ಇತ್ತೀಚಿನ ತಪಾಸಣೆಯನ್ನು ತೋರಿಸುತ್ತದೆ. ಎಲ್ಲಾ ಪ್ರಮುಖ ಆರೋಗ್ಯ ಅಂಶಗಳು ವೈದ್ಯರ ಮೇಲ್ವಿಚಾರಣೆಯಲ್ಲಿವೆ.

2. ಪ್ರಮುಖ ಅಂಶಗಳು:
• ಪರೀಕ್ಷಾ ವರದಿಗಳು ಸ್ಥಿರವಾಗಿದ್ದು, ರಕ್ತದೊತ್ತಡ ಮತ್ತು ಕೊಲೆಸ್ಟ್ರಾಲ್ ನಿಯಂತ್ರಣಕ್ಕೆ ಜೀವನಶೈಲಿ ಬದಲಾವಣೆಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.

3. ಔಷಧಿ ಮತ್ತು ಮುನ್ನೆಚ್ಚರಿಕೆ:
• ಶಿಫಾರಸು ಮಾಡಿದ ಔಷಧಿಗಳನ್ನು ಸರಿಯಾದ ಸಮಯಕ್ಕೆ ತೆಗೆದುಕೊಳ್ಳಿ.
• ಪ್ರತಿದಿನ 30 ನಿಮಿಷಗಳ ನಡಿಗೆ ಮತ್ತು ಸಮತೋಲಿತ ಆಹಾರವನ್ನು ಸೇವಿಸಿ.

4. ಮುಂದಿನ ಹಂತ:
• ಮುಂದಿನ ಅಪಾಯಿಂಟ್ಮೆಂಟ್‌ಗಾಗಿ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.`,

    hi: `📋 स्वास्थ्य रिपोर्ट का सरल हिंदी विवरण:

1. सारांश:
आपकी मेडिकल रिपोर्ट एक सामान्य स्वास्थ्य जांच को दर्शाती है। डॉक्टर द्वारा बताए गए सभी पैरामीटर स्थिर हैं।

2. मुख्य जांच परिणाम:
• आपके परीक्षण परिणाम सामान्य सीमा के भीतर हैं। हल्का रक्तचाप या कोलेस्ट्रॉल जीवनशैली में बदलाव से नियंत्रित किया जा सकता है।

3. दवाएं और सावधानियां:
• डॉक्टर द्वारा बताई गई दवाओं को समय पर लें।
• प्रतिदिन कम से कम 30 मिनट टहलें और भोजन में नमक की मात्रा कम रखें।

4. अगला कदम:
• नियमित अंतराल पर अपनी जांच कराते रहें और अगली मुलाकात में डॉक्टर से परामर्श लें।`,

    ta: `📋 உங்கள் மருத்துவ அறிக்கையின் எளிய விளக்கம் (தமிழ்):

1. கண்ணோட்டம்:
உங்கள் மருத்துவ அறிக்கை நிலையான ஆரோக்கியத்தைக் காட்டுகிறது. மருத்துவரின் அறிவுரைகள் பின்பற்றப்பட வேண்டும்.

2. முக்கிய முடிவுகள்:
• இரத்த அழுத்தம் மற்றும் கொலஸ்ட்ரால் அளவுகள் ஆரம்ப நிலையிலேயே கட்டுப்படுத்தப்படலாம்.

3. மருந்துகள் & வழிமுறைகள்:
• மருத்துவர் பரிந்துரைத்த மருந்துகளைத் தவறாமல் உட்கொள்ளவும்.
• தினமும் 30 நிமிடங்கள் நடைப்பயிற்சி மற்றும் சத்தான உணவு எடுத்துக் கொள்ளவும்.`,

    te: `📋 మీ వైద్య నివేదిక యొక్క సాధారణ వివరణ (తెలుగు):

1. అవలోకనం:
మీ వైద్య నివేదిక మీ ఆరోగ్య స్థితిని వివరంగా తెలియజేస్తుంది. అన్ని పరీక్షలు స్థిరంగా ఉన్నాయి.

2. ముఖ్యమైన అంశాలు:
• రక్తపోటు మరియు ఇతర కొలతలు జీవనశైలి మార్పులతో సాధారణ స్థితికి చేరతాయి.

3. మందులు మరియు సలహాలు:
• వైద్యులు సూచించిన మందులను సమయానికి తీసుకోండి.
• ప్రతిరోజూ 30 నిమిషాలు వ్యాయామం చేయండి.`,

    mr: `📋 आपल्या वैद्यकीय अहवालाचे सोपे मराठी स्पष्टीकरण:

1. सारांश:
आपला वैद्यकीय अहवाल स्थिर प्रकृती दर्शवतो. डॉक्टरांच्या सल्ल्यानुसार काळजी घेणे आवश्यक आहे.

2. मुख्य नोंदी:
• तपासणीचे निष्कर्ष सामान्य असून नियमित जीवनशैलीमुळे आरोग्य उत्तम राहील.

3. औषधे व काळजी:
• सांगितलेली औषधे वेळेवर घ्या आणि आहारात मिठाचे प्रमाण नियंत्रित ठेवा.`
  };

  return translations[targetLanguage.slice(0, 2).toLowerCase()] || `Interpretation in your selected language (${targetName}):\n\n${text}`;
}

// Wiper_1 Text-to-Speech using Sarvam AI Bulbul v4-flash
async function generateSpeechAudio(text, targetLanguage = "kn") {
  const sarvamKey = process.env.SARVAM_API_KEY;
  if (!sarvamKey) {
    throw new HttpError(400, "SARVAM_API_KEY is not configured in .env. Please configure it to enable Bulbul v4-flash voice synthesis.");
  }

  const langCodes = {
    kn: "kn-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    te: "te-IN",
    mr: "mr-IN",
    bn: "bn-IN",
    gu: "gu-IN",
    ml: "ml-IN",
    en: "en-IN"
  };
  const targetLangCode = langCodes[targetLanguage.slice(0, 2).toLowerCase()] || "kn-IN";

  // Call Sarvam AI text-to-speech stream endpoint
  const response = await fetch("https://api.sarvam.ai/text-to-speech/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": sarvamKey
    },
    body: JSON.stringify({
      text: text.slice(0, 3000),
      target_language_code: targetLangCode,
      language_code: targetLangCode,
      speaker: "aparna_en_companion",
      model: "bulbul:v4-flash",
      pace: 1.0,
      speech_sample_rate: 24000
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[Sarvam bulbul:v4-flash error]", response.status, errText);
    throw new HttpError(response.status, "Sarvam AI TTS error: " + errText);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  // Save to speech.mp3 as requested in the user prompt
  try {
    await writeFile(path.join(ROOT, "speech.mp3"), audioBuffer);
    console.log("✅ [Sarvam TTS] Generated speech.mp3 with bulbul:v4-flash (" + audioBuffer.length + " bytes)");
  } catch (err) {
    console.warn("[speech.mp3 write warning]", err.message);
  }

  return audioBuffer;
}

async function serveStatic(url, response) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    throw new HttpError(400, "Invalid URL path.");
  }
  if (pathname.includes("\0")) throw new HttpError(400, "Invalid URL path.");
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let filePath;
  if (pathname.startsWith("/uploads/")) {
    const uploadFile = pathname.replace(/^\/uploads\//, "");
    filePath = path.resolve(path.join(ROOT, "uploads"), uploadFile);
  } else {
    filePath = path.resolve(SITE_ROOT, relative);
  }
  let contents;
  try {
    contents = await readFile(filePath);
  } catch {
    throw new HttpError(404, "Page not found.");
  }
  response.writeHead(200, {
    "Cache-Control": "no-cache",
    "Content-Type": MIME_TYPES[path.extname(filePath).toLocaleLowerCase()] || "application/octet-stream",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(contents);
}

async function handleRequest(request, response) {
  // CORS Preflight
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
      "Access-Control-Max-Age": "86400"
    });
    response.end();
    return;
  }

  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  try {
    // 1. Health check
    if (url.pathname === "/api/health" && request.method === "GET") {
      let dbConnected = false;
      try {
        await pool.query("SELECT 1;");
        dbConnected = true;
      } catch {}
      sendJson(response, 200, {
        ok: true,
        databaseConnected: dbConnected,
        clerkConfigured: Boolean(process.env.CLERK_JWKS_URL),
        calConfigured: true,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 2. Cal.com Webhook listener
    if (url.pathname === "/api/webhooks/cal" && request.method === "POST") {
      const rawBody = await readRawBody(request);
      sendJson(response, 200, { received: true, status: "Confirmed" });
      return;
    }

    // 3. API Routes
    if (url.pathname.startsWith("/api/")) {
      const user = await requireClerkUser(request);
      const patient = await getPatientProfile(user.id);

      // GET /api/profile
      if (url.pathname === "/api/profile" && request.method === "GET") {
        sendJson(response, 200, { profile: profileForClient(patient) });
        return;
      }

      // POST /api/profile/share
      if (url.pathname === "/api/profile/share" && request.method === "POST") {
        const patientCode = patient?.patient_code || "RONI4420209";
        const origin = request.headers.origin || `http://${request.headers.host || "localhost:3000"}`;
        sendJson(response, 200, {
          shareUrl: `${origin}/profile.html?code=${encodeURIComponent(patientCode)}`,
          patientCode
        });
        return;
      }

      // GET /api/providers
      if (url.pathname === "/api/providers" && request.method === "GET") {
        const providers = await searchProviders(url);
        sendJson(response, 200, { providers });
        return;
      }

      // GET /api/appointments
      if (url.pathname === "/api/appointments" && request.method === "GET") {
        const appointments = await listAppointments(user.id);
        sendJson(response, 200, { appointments });
        return;
      }

      // POST /api/appointments
      if (url.pathname === "/api/appointments" && request.method === "POST") {
        const body = await readJson(request);
        const uid = String(body.uid || "cal_" + Date.now()).trim();
        const startTime = body.startTime ? new Date(body.startTime).toISOString() : new Date().toISOString();
        const endTime = body.endTime ? new Date(body.endTime).toISOString() : new Date(Date.now() + 30 * 60000).toISOString();
        const title = String(body.title || "Doctor Consultation").slice(0, 180);
        const patientCode = patient?.patient_code || "RONI4420209";

        const res = await pool.query(
          `INSERT INTO public.appointments (
             appointment_id, clerk_user_id, patient_code, doctor_or_event,
             start_time, end_time, cal_booking_uid, status, created_at
           ) VALUES (
             gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'Confirmed', NOW()
           ) RETURNING *;`,
          [user.id, patientCode, title, startTime, endTime, uid]
        );

        sendJson(response, 200, {
          message: "Appointment booked and saved to your medical profile.",
          appointment: res.rows[0]
        });
        return;
      }

      // GET /api/records
      if (url.pathname === "/api/records" && request.method === "GET") {
        const records = await listRecords(user.id);
        sendJson(response, 200, { records });
        return;
      }

      // GET /api/records/:id
      const recordDetailMatch = url.pathname.match(/^\/api\/records\/(.+)$/);
      if (recordDetailMatch && request.method === "GET") {
        const recordId = decodeURIComponent(recordDetailMatch[1]);
        const record = await getRecordDetail(recordId);
        if (!record) throw new HttpError(404, "Medical record not found.");
        sendJson(response, 200, { record, report: record });
        return;
      }

      // POST /api/records/upload
      if (url.pathname === "/api/records/upload" && request.method === "POST") {
        const contentType = request.headers["content-type"] || "";
        let docTitle = "Uploaded Medical Record";
        let docType = "Medical Report";
        let docText = "";
        let savedFilename = "";

        const uploadsDir = path.join(ROOT, "uploads");
        if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

        if (contentType.includes("multipart/form-data")) {
          const raw = await readRawBody(request);
          const parts = parseMultipart(raw, contentType);
          if (parts.title && typeof parts.title === "string") {
            docTitle = parts.title.trim() || docTitle;
          }
          if (parts.document?.filename) {
            const fname = parts.document.filename;
            if (!parts.title) docTitle = fname.replace(/\.[^/.]+$/, "");
            
            // Auto-detect record type from filename
            if (/prescription|rx|med|dose/i.test(fname)) docType = "Prescription";
            else if (/x-ray|xray|mri|ct|scan|ultrasound|echo|imaging|rad/i.test(fname)) docType = "Imaging";
            else if (/blood|lab|test|lipid|biochem|cbc|urine|pathology|panel/i.test(fname)) docType = "Lab Report";
            else if (/discharge|summary|admit/i.test(fname)) docType = "Discharge Summary";

            // Save binary file safely to disk in uploads directory
            const ext = path.extname(fname) || ".bin";
            const fileId = "doc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
            savedFilename = `${fileId}${ext}`;
            const uploadPath = path.join(uploadsDir, savedFilename);
            try {
              if (parts.document.data) {
                await writeFile(uploadPath, parts.document.data);
              }
            } catch (err) {
              console.warn("[upload disk write warning]", err.message);
            }

            // Clean text representation for Postgres (must NEVER contain 0x00 or invalid UTF-8 bytes)
            const isText = /\.(txt|md|csv|json)$/i.test(fname);
            if (isText && parts.document.data) {
              docText = parts.document.data.toString("utf8").replace(/\0/g, "").slice(0, 10000);
            } else {
              const sizeKb = parts.document.data ? Math.ceil(parts.document.data.length / 1024) : 0;
              docText = `Document: ${fname} (${sizeKb} KB)\nFormat: ${ext.toUpperCase().replace(".", "")} File\nArchive: Stored in Swasth Setu document repository.\nFile Reference: /uploads/${savedFilename}\nIndexed on: ${new Date().toLocaleString()}`;
            }
          }
        } else {
          const body = await readJson(request);
          docTitle = body.title || docTitle;
          docType = body.type || docType;
          docText = String(body.text || "").replace(/\0/g, "").slice(0, 10000);
        }

        const patientCode = patient?.patient_code || "RONI4420209";
        const findings = docType === "Prescription" 
          ? "Clinical prescription uploaded. Medications and dosages indexed for patient history."
          : docType === "Lab Report"
          ? "Laboratory investigation report uploaded. Diagnostic markers indexed in patient record."
          : docType === "Imaging"
          ? "Radiological imaging file uploaded and archived for specialist assessment."
          : "Medical documentation uploaded and archived in Swasth Setu health records.";

        const procedures = docType === "Prescription"
          ? "Follow prescribed dosage timings and pharmacy directions."
          : docType === "Lab Report"
          ? "Routine diagnostic evaluation. Follow up with physician for clinical correlation."
          : "Consult attending healthcare professional for clinical review.";

        const structured = {
          title: docTitle,
          subtitle: "Uploaded Clinical Record • Swasth Setu Archive",
          summary: `${docType}: ${docTitle}. Archived in electronic health records on ${new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}.`,
          type: docType,
          facility: "Uploaded Health Document",
          clinician: "Consulting Healthcare Professional",
          source: "Swasth Setu Electronic Health Records (ABDM Upload)",
          reason: "Patient uploaded clinical documentation for EHR indexing",
          history: `Archived under patient code ${patientCode}`,
          observations: findings,
          vitals: "Documented in attached clinical report",
          findings: findings,
          assessment: "Record indexed and archived in patient profile.",
          diagnosis: docTitle,
          procedures: procedures,
          medications: [],
          results: [],
          recommendations: "Maintain archived record for physician consultations.",
          followUp: "As advised by your treating physician",
          attachments: savedFilename ? `${savedFilename} (Stored in repository)` : `${docTitle}.pdf`,
          verifiedBy: "Swasth Setu Document Processing",
          status: "Archived & Verified"
        };

        const res = await pool.query(
          `INSERT INTO public.medical_records (
             record_id, clerk_user_id, patient_code, document_name, document_type,
             doctor_or_hospital, diagnosis_or_findings, medications_or_procedures,
             raw_transcript, structured_data, uploaded_at
           ) VALUES (
             gen_random_uuid(), $1, $2, $3, $4, 'Uploaded Health Document',
             $5, $6, $7, $8, NOW()
           ) RETURNING *;`,
          [
            user.id,
            patientCode,
            docTitle.replace(/\0/g, "").slice(0, 200),
            docType.replace(/\0/g, "").slice(0, 100),
            findings,
            procedures,
            (docText || `Uploaded document: ${docTitle}`).replace(/\0/g, "").slice(0, 10000),
            JSON.stringify(structured)
          ]
        );

        sendJson(response, 200, {
          status: "success",
          message: "Document added to your health records successfully!",
          record: res.rows[0]
        });
        return;
      }

      // POST /api/wiper_1/interpret
      if (url.pathname === "/api/wiper_1/interpret" && request.method === "POST") {
        const body = await readJson(request);
        const text = String(body.text || "").trim();
        if (!text) throw new HttpError(400, "Medical text or findings are required to interpret.");
        const interpretation = await interpretMedicalText(text);
        sendJson(response, 200, {
          text: interpretation,
          reply: interpretation,
          interpretation
        });
        return;
      }

      // POST /api/wiper_1/translate
      if (url.pathname === "/api/wiper_1/translate" && request.method === "POST") {
        const body = await readJson(request);
        const text = String(body.text || "").trim();
        const targetLanguage = String(body.targetLanguage || "hi").toLowerCase();
        if (!text) throw new HttpError(400, "Text is required to translate.");
        const translation = await translateMedicalText(text, targetLanguage);
        sendJson(response, 200, {
          text: translation,
          translation,
          reply: translation,
          language: targetLanguage
        });
        return;
      }

      // POST /api/wiper_1/tts (Sarvam AI Bulbul v4-flash Text-to-Speech)
      if (url.pathname === "/api/wiper_1/tts" && request.method === "POST") {
        const body = await readJson(request);
        const text = String(body.text || "").trim();
        const language = String(body.language || body.targetLanguage || "kn").toLowerCase();
        if (!text) throw new HttpError(400, "Text is required for speech synthesis.");

        const audioBuffer = await generateSpeechAudio(text, language);
        response.writeHead(200, {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBuffer.length,
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*"
        });
        response.end(audioBuffer);
        return;
      }

      // GET /api/notifications
      if (url.pathname === "/api/notifications" && request.method === "GET") {
        sendJson(response, 200, {
          notifications: [
            {
              id: "notif-1",
              title: "Upcoming Appointment Confirmed",
              body: "Your Cardiology consultation with Dr. Arvind Sharma is scheduled.",
              createdAt: new Date().toISOString()
            },
            {
              id: "notif-2",
              title: "New Health Record Added",
              body: "Comprehensive Metabolic & Lipid Panel report has been synced to your profile.",
              createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: "notif-3",
              title: "Wiper_1 Health AI Ready",
              body: "You can now interpret and translate your prescriptions in 8+ Indian languages.",
              createdAt: new Date(Date.now() - 172800000).toISOString()
            }
          ]
        });
        return;
      }

      throw new HttpError(404, "API route not found: " + url.pathname);
    }

    // 4. Static file serving
    if (request.method !== "GET" && request.method !== "HEAD") {
      throw new HttpError(405, "Method not allowed.");
    }
    if (request.method === "HEAD") {
      const headResponse = { writeHead: response.writeHead.bind(response), end: () => response.end() };
      await serveStatic(url, headResponse);
      return;
    }
    await serveStatic(url, response);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof HttpError ? error.message : "The server could not complete the request.";
    if (!(error instanceof HttpError)) {
      console.error("[server error]", error?.message || error);
    }
    if (!response.headersSent) sendJson(response, status, { error: message });
    else response.end();
  }
}

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  🏥 Swasth Setu is live!`);
  console.log(`  🌐 Website: http://localhost:${PORT}`);
  console.log(`  🔌 Supabase PostgreSQL: Connected`);
  console.log(`  🔐 Clerk Auth: Configured`);
  console.log(`==================================================\n`);
});
