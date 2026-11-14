import { Clerk } from "@clerk/clerk-js";
import { ui } from "@clerk/ui";
import "./style.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const apiBaseUrl = (
  import.meta.env.VITE_RECORD_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");
const maxFileSize = 20 * 1024 * 1024;
const app = document.querySelector("#app");

const brand = `
  <a class="brand" href="/" aria-label="SwasthSetu home">
    <span class="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="13" fill="currentColor" />
        <path d="M20 9v22M9 20h22" stroke="white" stroke-width="4" stroke-linecap="round" />
      </svg>
    </span>
    <span class="brand-name">SwasthSetu<span>Care, connected.</span></span>
  </a>
`;

function showConfigurationError(message) {
  app.innerHTML = `
    <main class="message-page">
      <div class="message-card">
        <div class="brand-lockup">${brand}</div>
        <h1>Portal setup needed</h1>
        <p>${message}</p>
        <p class="muted">Set the frontend values in <code>swasthsethu/.env.local</code>, then restart Vite.</p>
      </div>
    </main>
  `;
}

if (!publishableKey) {
  showConfigurationError("The Clerk publishable key is not configured.");
} else {
  try {
    const clerkDomain = atob(publishableKey.split("_")[2]).slice(0, -1);
    const clerkUi = await loadClerkUi(clerkDomain);
    const clerk = new Clerk(publishableKey);
    await clerk.load({ ui: { ClerkUI: clerkUi } });

    if (clerk.user) {
      renderPortal(clerk);
    } else {
      renderSignIn(clerk);
    }
  } catch (error) {
    console.error("Clerk portal initialization failed.", error);
    showConfigurationError("Clerk could not load. Check the publishable key and try again.");
  }
}

async function loadClerkUi(domain) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load Clerk's sign-in components."));
    document.head.appendChild(script);
  });

  if (!window.__internal_ClerkUICtor) {
    throw new Error("Clerk's sign-in components did not initialize.");
  }
  return window.__internal_ClerkUICtor;
}

function renderSignIn(clerk) {
  app.innerHTML = `
    <div class="auth-page">
      <header class="topbar">${brand}</header>
      <main class="auth-layout">
        <section class="auth-copy">
          <p class="eyebrow">SWASTHSETU DOCUMENT PORTAL</p>
          <h1>Your health records, in one place.</h1>
          <p>Sign in securely to extract and review information from a medical document.</p>
          <div class="trust-note">
            <span class="trust-icon" aria-hidden="true">+</span>
            <span>Your records are associated with your signed-in account.</span>
          </div>
        </section>
        <section class="auth-card" aria-label="Sign in">
          <div id="sign-in-mount"></div>
        </section>
      </main>
      <footer class="page-footer">Private document processing · SwasthSetu</footer>
    </div>
  `;

  clerk.mountSignIn(document.querySelector("#sign-in-mount"));
}

function renderPortal(clerk) {
  app.innerHTML = `
    <div class="portal-page">
      <header class="topbar">
        ${brand}
        <div class="account-area">
          <span class="signed-in-label">Signed in</span>
          <div id="user-button"></div>
        </div>
      </header>

      <main class="portal-main">
        <section class="welcome">
          <div class="welcome-copy">
            <p class="eyebrow">MEDICAL DOCUMENT SCANNER</p>
            <h1>Make a report easier to read.</h1>
            <p>Upload a PDF or image and Sarvam AI will extract the information into a structured result.</p>
          </div>
          <div class="secure-badge">
            <span class="secure-dot" aria-hidden="true"></span>
            Clerk protected
          </div>
        </section>

        <div class="portal-grid">
          <section class="panel upload-panel">
            <div class="panel-heading">
              <div>
                <p class="step-label">STEP 1</p>
                <h2>Choose a document</h2>
              </div>
              <span class="file-limit">PDF · JPG · JPEG</span>
            </div>

            <form id="upload-form">
              <label class="drop-zone" for="document-file">
                <span class="upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 32 32" fill="none">
                    <path d="M16 21V5m0 0-6 6m6-6 6 6M6 20v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span class="drop-title">Choose a file to scan</span>
                <span class="drop-subtitle">PDF, JPG, or JPEG · up to 20 MB</span>
                <input id="document-file" name="file" type="file" accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg" required />
              </label>

              <p id="file-summary" class="file-summary" hidden></p>

              <label class="field-label" for="patient-code">Patient code</label>
              <input
                id="patient-code"
                name="patient_code"
                class="text-input"
                type="text"
                maxlength="128"
                autocomplete="off"
                placeholder="Enter the patient code"
                required
              />
              <p class="field-help">This code is stored inside the encrypted record.</p>

              <div id="upload-status" class="status-message" role="status" aria-live="polite"></div>
              <button id="scan-button" class="primary-button" type="submit">
                <span>Scan document</span>
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>

          <aside class="panel details-panel">
            <p class="step-label">WHAT HAPPENS NEXT</p>
            <h2>From document to details</h2>
            <ol class="process-list">
              <li><span>1</span><div><strong>Secure upload</strong><p>Your file is sent to the scanner over HTTPS.</p></div></li>
              <li><span>2</span><div><strong>Sarvam extraction</strong><p>Document AI extracts fields defined by the scanner.</p></div></li>
              <li><span>3</span><div><strong>Protected storage</strong><p>The extracted record is encrypted and linked to your Clerk account.</p></div></li>
            </ol>
            <div class="privacy-note">
              <span class="privacy-icon" aria-hidden="true">i</span>
              <p>A temporary server copy is removed after processing. The document is sent to Sarvam AI for extraction.</p>
            </div>
          </aside>
        </div>

        <section id="scan-result" class="panel result-panel" aria-live="polite" hidden>
          <div class="result-heading">
            <div>
              <p class="step-label">SCAN COMPLETE</p>
              <h2>Extracted information</h2>
              <p id="record-reference" class="result-reference"></p>
            </div>
            <button id="download-result" class="secondary-button" type="button">Download JSON</button>
          </div>
          <pre id="result-json" class="result-json"></pre>
        </section>
      </main>

      <footer class="page-footer">SwasthSetu · Medical document processing</footer>
    </div>
  `;

  clerk.mountUserButton(document.querySelector("#user-button"));

  const form = document.querySelector("#upload-form");
  const fileInput = document.querySelector("#document-file");
  const fileSummary = document.querySelector("#file-summary");
  const status = document.querySelector("#upload-status");
  const scanButton = document.querySelector("#scan-button");
  const resultPanel = document.querySelector("#scan-result");
  const resultJson = document.querySelector("#result-json");

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    fileSummary.hidden = !file;
    fileSummary.textContent = file
      ? `${file.name} · ${formatFileSize(file.size)}`
      : "";
    status.textContent = "";
    status.className = "status-message";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    status.className = "status-message";
    resultPanel.hidden = true;

    const file = fileInput.files?.[0];
    const patientCode = document.querySelector("#patient-code").value.trim();
    const extension = file?.name.split(".").pop()?.toLowerCase();

    if (!file || !["pdf", "jpg", "jpeg"].includes(extension)) {
      showStatus(status, "Choose a PDF, JPG, or JPEG file.", "error");
      return;
    }
    if (file.size === 0) {
      showStatus(status, "The selected file is empty.", "error");
      return;
    }
    if (file.size > maxFileSize) {
      showStatus(status, "The selected file exceeds the 20 MB limit.", "error");
      return;
    }
    if (!patientCode) {
      showStatus(status, "Enter the patient code.", "error");
      return;
    }

    scanButton.disabled = true;
    scanButton.setAttribute("aria-busy", "true");
    scanButton.querySelector("span:first-child").textContent = "Scanning with Sarvam…";
    showStatus(status, "Uploading and scanning. This can take a few minutes.", "pending");

    try {
      const token = await clerk.session?.getToken();
      if (!token) {
        throw new Error("Your Clerk session has expired. Sign in again to continue.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient_code", patientCode);

      const response = await fetch(`${apiBaseUrl}/upload-report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = typeof payload?.detail === "string"
          ? payload.detail
          : `The scan request failed (${response.status}).`;
        throw new Error(detail);
      }

      if (!payload || payload.status !== "success" || !payload.extracted_data) {
        throw new Error("The scanner returned an unexpected response.");
      }

      document.querySelector("#record-reference").textContent =
        `Record #${payload.extraction_id} · ${payload.source_file}`;
      resultJson.textContent = JSON.stringify(payload.extracted_data, null, 2);
      resultPanel.hidden = false;
      showStatus(status, "Scan complete. Your extracted data is ready below.", "success");
      resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showStatus(
        status,
        error instanceof Error ? error.message : "The scan could not be completed.",
        "error",
      );
    } finally {
      scanButton.disabled = false;
      scanButton.removeAttribute("aria-busy");
      scanButton.querySelector("span:first-child").textContent = "Scan document";
    }
  });

  document.querySelector("#download-result").addEventListener("click", () => {
    const blob = new Blob([resultJson.textContent], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "swasthsetu-extraction.json";
    link.click();
    URL.revokeObjectURL(downloadUrl);
  });
}

function formatFileSize(bytes) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showStatus(element, message, type) {
  element.textContent = message;
  element.className = `status-message status-${type}`;
}
