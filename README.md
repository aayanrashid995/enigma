# ENIGMA 🔐 | Zero-Trust Vault & Active Defense

![Version](https://img.shields.io/badge/version-1.0.0-emerald?style=for-the-badge)
![License](https://img.shields.io/badge/license-Academic-blue?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Zero--Trust-critical?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20|%20Supabase%20|%20WebCrypto-orange?style=for-the-badge)

**Enigma** is a secure, self-destructing digital vault designed for sharing sensitive data—such as passwords, API keys, and private notes—under a strict **Zero-Trust model**. 

Developed as the final semester project for **CY321: Secure Software Development** at the GIK Institute of Engineering Sciences and Technology.

---

## 🛡️ Core Security Architecture

*   **Zero-Trust Client-Side Cryptography:** Payloads are encrypted locally in the browser using the WebCrypto API (`AES-256-GCM`). The decryption key is attached to the URL as a hash fragment (`#KEY`), ensuring it is never transmitted over the network or stored on the backend server.
*   **Burn-After-Reading Semantic:** Once a legitimate note is retrieved, the backend API immediately executes a destructive delete operation, permanently purging the record from the database.
*   **Plausible Deniability (Brute-Force Mitigation):** Incorrect decryption attempts (due to invalid keys or tampered ciphertext) do not trigger system errors. Instead, the application generates structurally valid "Decoy Notes" (e.g., *"Meeting moved to 4 PM"*) to mislead adversaries and thwart brute-force verification.
*   **HoneyLinks (Active Defense):** Users can generate trackable "trap links". If a malicious actor scans or accesses a HoneyLink, the API silently logs the intruder's IP address and User-Agent to an isolated telemetry database table.

---

## 🧪 Dynamic Security Testing (Deliverable 3 Evidence)

The following controls have been dynamically tested and verified in the production environment:

### 1. Zero-Trust Verification
Intercepted network payloads confirm the server only receives unreadable `ciphertext` and `iv`. The decryption key remains securely isolated in the client-side hash fragment.

![Zero-Trust Payload Evidence](https://placehold.co/800x400/0a0e17/10b981?text=Zero-Trust+Network+Payload+Verified)

### 2. Intrusion Telemetry (Active Defense)
The Active Defense mechanism successfully captures metadata in the Supabase PostgreSQL database when a HoneyLink is triggered by an unauthorized party.

![Intrusion Logs Evidence](https://placehold.co/800x400/0a0e17/10b981?text=Supabase+Intruder+Telemetry+Captured)

### 3. Fail-Secure Integrity
Verified that accessing a burned note or tampering with the decryption key triggers a silent decoy fallback, protecting the cryptographic failure state.

![Plausible Deniability Evidence](https://placehold.co/800x400/0a0e17/10b981?text=Plausible+Deniability+Decoy+Triggered)

## 🎓 CY321 Syllabus Mapping

This project explicitly implements the following core concepts from the CY321 curriculum:

*   **Week 2 & 4 (Secure SDLC & STRIDE):** Implemented HoneyLink-based active defense to mitigate *Reconnaissance* and *Spoofing* threats.
*   **Week 7 & 8 (Defensive Coding):** Strict XSS prevention achieved by rendering decrypted data exclusively via `textContent`. Enforced 5000-byte input validation bounds on the client side.
*   **Week 9 (Secure Implementation):** Explicit memory safety achieved through JavaScript object nullification (`key = null; text = null;`) immediately following cryptographic operations.
*   **Week 13 & 14 (Web Defense):** Zero-Trust key transport via URL hash fragments. Server-side hardening implemented using `helmet`, strict CORS, and API rate-limiting to mitigate DoS.

---

## 🛠️ Technical Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Vanilla JS, HTML5, CSS3 | Lightweight, zero-dependency client execution. |
| **Cryptography** | WebCrypto API | Native browser implementation of `AES-256-GCM`. |
| **Backend API** | Node.js + Express | Handles routing, rate-limiting, and DB interfacing. |
| **Database** | Supabase (PostgreSQL) | Stores ciphertext and intruder telemetry logs. |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16+)
*   A Supabase Project (for PostgreSQL database)

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/aayanrashid/enigma.git](https://github.com/aayanrashid/enigma.git)
   cd enigma

