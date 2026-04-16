// Utility functions for buffer/base64 conversion
const buf2b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b642buf = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;

async function handleEncryptAndShare() {
    const text = document.getElementById('noteInput').value;
    if (!text) return;

    // CY321 Deliverable 2: AES-256 Client-Side Cryptography
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
    const exportedKey = await crypto.subtle.exportKey("raw", key);

    // Transmit ONLY ciphertext and IV to server. Key stays local.
    const res = await fetch('http://localhost:3000/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciphertext: buf2b64(ciphertext), iv: buf2b64(iv) })
    });
    
    const { id } = await res.json();
    
    // Attach key to URL Hash Fragment (never sent to server)
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${id}#${buf2b64(exportedKey)}`;
    
    document.getElementById('output').textContent = "Secure Link: " + shareUrl;
    
    // Secure Coding: Memory safety (clear input)
    document.getElementById('noteInput').value = ""; 
}

async function decryptSequence() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const keyB64 = window.location.hash.substring(1);

    if (id && keyB64) {
        document.getElementById('createMode').classList.add('hidden');
        document.getElementById('readMode').classList.remove('hidden');
        
        try {
            const res = await fetch(`http://localhost:3000/api/notes/${id}`);
            if (!res.ok) throw new Error();
            const { ciphertext, iv } = await res.json();

            // Import Key & Decrypt locally
            const key = await crypto.subtle.importKey("raw", b642buf(keyB64), "AES-GCM", false, ["decrypt"]);
            const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b642buf(iv) }, key, b642buf(ciphertext));
            
            // XSS Prevention: Strict use of textContent
            document.getElementById('displayArea').textContent = new TextDecoder().decode(decrypted);
        } catch (e) {
            // CY321 Proposal: Plausible Deniability (Show decoy instead of error)
            document.getElementById('displayArea').textContent = "Meeting moved to 4 PM.";
        }
        
        // Clear sensitive hash from URL to prevent history leaks
        history.replaceState(null, null, " "); 
    }
}

decryptSequence();
// --- NEW: Active Defense (HoneyLink Generator) ---
function generateHoneyLink() {
    // 1. Generate a random 8-byte string to look like a real database ID
    const randomBuffer = new Uint8Array(8);
    crypto.getRandomValues(randomBuffer);
    const randomHex = Array.from(randomBuffer).map(b => b.toString(16).padStart(2, '0')).join('');

    // 2. Construct the fake ID
    const fakeId = `honey_${randomHex}`;

    // 3. Generate a fake 32-byte key so the URL hash looks realistic
    const fakeKeyBuffer = new Uint8Array(32);
    crypto.getRandomValues(fakeKeyBuffer);
    const fakeKeyB64 = buf2b64(fakeKeyBuffer);

    // 4. Construct the final URL
    const trapUrl = `${window.location.origin}${window.location.pathname}?id=${fakeId}#${fakeKeyB64}`;

    // 5. Display the trap link to the user
    const outputEl = document.getElementById('output');
    outputEl.textContent = "Trap Link: " + trapUrl;
    outputEl.style.color = "#ef4444"; // Make it red so the user knows it's a decoy
    
    // Clear input for memory safety
    document.getElementById('noteInput').value = ""; 
}