const API_BASE = "http://localhost:3000";

// Utility functions for buffer/base64 conversion.
const buf2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b642buf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;

let activeTab = "password";
let lastGeneratedUrl = "";
const DECOY_MESSAGES = [
    "Meeting moved to 4 PM.",
    "Reminder: submit sprint notes by 18:00.",
    "VPN maintenance window starts at 22:30.",
    "Standup moved to Conference Room B.",
    "Access review scheduled for next Tuesday.",
    "Backup completed successfully at 03:00 UTC."
];

function getRandomDecoyMessage() {
    const index = Math.floor(Math.random() * DECOY_MESSAGES.length);
    return DECOY_MESSAGES[index];
}

function setTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
    document.getElementById(`tab-${tabName}`).classList.add("active");

    document.querySelectorAll(".tab-view").forEach((view) => view.classList.add("hidden"));
    document.getElementById(`view-${tabName}`).classList.remove("hidden");
    updateLiveByteCount();
}

function showToast(message, isDanger = false) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.toggle("danger", Boolean(isDanger));
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2000);
}

function setEncryptLoading(isLoading) {
    const btn = document.getElementById("encryptBtn");
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "Encrypting Payload..." : "Encrypt & Generate Link";
}

function buildStructuredPayload() {
    const expires = document.getElementById("expiresAfter").value;
    const payload = {
        type: activeTab,
        expires_after: expires,
        created_at: new Date().toISOString()
    };

    if (activeTab === "password") {
        payload.url = document.getElementById("loginUrl").value.trim();
        payload.username = document.getElementById("username").value.trim();
        payload.password = document.getElementById("password").value;
        if (!payload.password) {
            throw new Error("Password field is required.");
        }
    } else {
        payload.message = document.getElementById("secureMessage").value.trim();
        if (!payload.message) {
            throw new Error("Secure message is required.");
        }
    }
    return payload;
}

function updateLiveByteCount() {
    const byteEl = document.getElementById("byteCount");
    let payload = "";

    if (activeTab === "password") {
        const url = document.getElementById("loginUrl").value.trim();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        payload = JSON.stringify({ type: "password", url, username, password });
    } else {
        const message = document.getElementById("secureMessage").value.trim();
        payload = JSON.stringify({ type: "message", message });
    }

    const byteLength = new TextEncoder().encode(payload).length;
    byteEl.textContent = `${byteLength}/5000 bytes`;
    byteEl.classList.toggle("danger", byteLength > 5000);
}

// CY321 Week 7 & 8: explicit input validation at the client boundary.
function validatePayloadSize(payloadString) {
    const bytes = new TextEncoder().encode(payloadString).length;
    if (bytes > 5000) {
        throw new Error("Payload exceeds 5000 byte secure limit.");
    }
}

function resetInputFields() {
    document.getElementById("loginUrl").value = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("secureMessage").value = "";
    updateLiveByteCount();
}

function setResultLink(link, isTrap = false) {
    const box = document.getElementById("resultBox");
    const linkEl = document.getElementById("outputLink");
    box.classList.remove("hidden");
    linkEl.textContent = link;
    linkEl.classList.toggle("danger", Boolean(isTrap));
}

async function handleEncryptAndShare() {
    setEncryptLoading(true);
    let payloadObject = null;
    let payloadString = null;
    let key = null;
    let iv = null;
    let cipherBuffer = null;
    let rawKey = null;
    try {
        payloadObject = buildStructuredPayload();
        payloadString = JSON.stringify(payloadObject);
        validatePayloadSize(payloadString);

        key = await crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
        iv = crypto.getRandomValues(new Uint8Array(12));
        cipherBuffer = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            new TextEncoder().encode(payloadString)
        );
        rawKey = await crypto.subtle.exportKey("raw", key);

        // CY321 Week 13 & 14: key remains client-side inside URL fragment only.
        const response = await fetch(`${API_BASE}/api/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ciphertext: buf2b64(cipherBuffer),
                iv: buf2b64(iv)
            })
        });

        if (!response.ok) {
            throw new Error("Server rejected encrypted payload.");
        }

        const { id } = await response.json();
        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${id}#${buf2b64(rawKey)}`;
        lastGeneratedUrl = shareUrl;
        setResultLink(shareUrl, false);
        resetInputFields();
        showToast("Secure link generated.");

    } catch (error) {
        showToast(error.message || "Failed to encrypt and share.", true);
    } finally {
        // CY321 Week 9: memory safety wipe of plaintext/key references.
        payloadObject = null;
        payloadString = null;
        key = null;
        iv = null;
        cipherBuffer = null;
        rawKey = null;
        setEncryptLoading(false);
    }
}

function appendCard(container, label, value, highlight = false) {
    const card = document.createElement("div");
    card.className = `decrypted-card${highlight ? " highlight" : ""}`;

    const title = document.createElement("div");
    title.className = "data-label";
    title.textContent = label;

    const data = document.createElement("div");
    data.className = "data-value";
    // CY321 Week 7 & 8: strict XSS mitigation using textContent only.
    data.textContent = value;

    card.appendChild(title);
    card.appendChild(data);
    container.appendChild(card);
}

function renderDecryptedPayload(payload) {
    const displayArea = document.getElementById("displayArea");
    displayArea.replaceChildren();

    if (payload.type === "password") {
        if (payload.url) appendCard(displayArea, "URL", payload.url);
        if (payload.username) appendCard(displayArea, "Username", payload.username);
        appendCard(displayArea, "Password", payload.password || "", true);
    } else {
        appendCard(displayArea, "Secure Message", payload.message || "");
    }
}

async function decryptSequence() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const keyB64 = window.location.hash.substring(1);

    if (!id || !keyB64) return;

    document.getElementById("createMode").classList.add("hidden");
    document.getElementById("readMode").classList.remove("hidden");

    let key = null;
    let decryptedBuffer = null;
    let payloadString = null;
    let payload = null;

    try {
        const response = await fetch(`${API_BASE}/api/notes/${encodeURIComponent(id)}`);
        if (!response.ok) {
            throw new Error("Burned or unavailable");
        }
        const { ciphertext, iv } = await response.json();
        key = await crypto.subtle.importKey("raw", b642buf(keyB64), "AES-GCM", false, ["decrypt"]);
        decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: b642buf(iv) },
            key,
            b642buf(ciphertext)
        );

        payloadString = new TextDecoder().decode(decryptedBuffer);
        payload = JSON.parse(payloadString);
        renderDecryptedPayload(payload);
    } catch (_error) {
        // CY321 Week 12: plausible deniability for wrong key/bruteforce attempts.
        renderDecryptedPayload({
            type: "message",
            message: getRandomDecoyMessage()
        });
    } finally {
        // CY321 Week 9: memory safety wipe.
        key = null;
        decryptedBuffer = null;
        payloadString = null;
        payload = null;
        history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
}

function generateHoneyLink() {
    const trapId = `honey_${Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;

    const fakeKey = buf2b64(crypto.getRandomValues(new Uint8Array(32)));
    const trapUrl = `${window.location.origin}${window.location.pathname}?id=${trapId}#${fakeKey}`;

    lastGeneratedUrl = trapUrl;
    setResultLink(trapUrl, true);
    showToast("HoneyLink deployed.", true);
}

async function copyOutputLink() {
    if (!lastGeneratedUrl) {
        showToast("Generate a link first.", true);
        return;
    }
    try {
        await navigator.clipboard.writeText(lastGeneratedUrl);
        showToast("Link copied.");
    } catch {
        showToast("Clipboard blocked by browser.", true);
    }
}

function togglePassword() {
    const input = document.getElementById("password");
    input.type = input.type === "password" ? "text" : "password";
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
});

["loginUrl", "username", "password", "secureMessage"].forEach((id) => {
    document.getElementById(id).addEventListener("input", updateLiveByteCount);
});

document.getElementById("encryptBtn").addEventListener("click", handleEncryptAndShare);
document.getElementById("honeyBtn").addEventListener("click", generateHoneyLink);
document.getElementById("copyBtn").addEventListener("click", copyOutputLink);
document.getElementById("togglePasswordBtn").addEventListener("click", togglePassword);

updateLiveByteCount();
decryptSequence();
