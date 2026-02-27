

# Enigma 🔐  
**Zero-Trust Secure Vault & Active Defense Web App**

Enigma is a highly secure, self-destructing digital vault designed for sharing sensitive text such as passwords, API keys, and private notes. Built with a strict **Zero-Trust architecture**, it ensures that your data is encrypted directly in your browser before it ever leaves your device.

This project was developed as part of the **Secure Software Development (CY321)** course.

---

## ✨ Core Features

- **Client-Side Cryptography**  
  - Uses AES-256 (via WebCrypto API) to encrypt text locally.  
  - Decryption key is passed via the URL hash fragment (`#KEY`), meaning the server never sees or stores your password.  

- **Burn-After-Reading**  
  - Once a legitimate note is decrypted and viewed, it is cryptographically shredded and permanently deleted from the database.  

- **Plausible Deniability (Decoys)**  
  - Incorrect passwords do not trigger an error. Instead, a fake *Decoy Note* is generated to mislead brute-force attempts.  

- **HoneyLinks (Active Defense)**  
  - Generate fake, trackable secret links as traps.  
  - If a malicious actor opens a HoneyLink, the app silently logs their IP address and User-Agent to detect breaches.  

---

## 🛠 Tech Stack (Proposed)

| Layer      | Technology Options |
|------------|--------------------|
| **Frontend** | HTML, CSS, JavaScript (WebCrypto API) |
| **Backend**  | Node.js / Python FastAPI |
| **Database** | Firebase / SQLite |

---

## 🚀 Getting Started

### Clone the repository
```bash
git clone https://github.com/yourusername/enigma.git
```

### Navigate to the project directory
```bash
cd enigma
```

### Run the development server
```bash
# Add your start command here (e.g., npm start / uvicorn main:app --reload)
```

---

## ⚠️ Security Disclaimer

This project is an **academic prototype** developed for a cybersecurity course.  
It demonstrates theoretical and practical applications of cryptography and active defense.  
**Do not use this project in production environments.**

---

## 👨‍💻 Developer

- **Name:** Aayan Rashid (2023002)  
- **Institution:** GIK Institute of Engineering Sciences and Technology  


