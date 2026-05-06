require("dotenv").config(); // <-- Added this line to load the .env file
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const supabase = require("./supabase"); // <-- Your modular database connection!

const app = express();
const PORT = process.env.PORT || 3000;

// CY321 Week 13 & 14: Web security defenses (secure headers, CORS, payload limits, anti-DoS).
app.use(helmet());
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS origin not allowed"), false);
    }
}));
app.use(express.json({ limit: "10kb" }));

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." }
});
app.use("/api", apiLimiter);

function isSafeBase64(input, maxLength) {
    return typeof input === "string" && input.length > 0 && input.length <= maxLength && /^[A-Za-z0-9+/=]+$/.test(input);
}

function extractClientIp(req) {
    const fwd = req.headers["x-forwarded-for"];
    if (typeof fwd === "string" && fwd.length > 0) {
        return fwd.split(",")[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || "unknown";
}

// Feature A: Upload encrypted note (ciphertext + IV only).
app.post("/api/notes", async (req, res) => {
    try {
        const { ciphertext, iv } = req.body || {};
        if (!isSafeBase64(ciphertext, 7000) || !isSafeBase64(iv, 128)) {
            return res.status(400).json({ error: "Invalid payload format." });
        }

        const id = crypto.randomBytes(8).toString("hex");
        const { error } = await supabase.from("notes").insert([{ id, ciphertext, iv }]);
        if (error) {
            return res.status(500).json({ error: "Database insertion failed." });
        }

        return res.status(201).json({ id });
    } catch (err) {
        return res.status(500).json({ error: "Unexpected server error." });
    }
});

// Feature B + D: Burn-after-reading + active defense on HoneyLinks.
app.get("/api/notes/:id", async (req, res) => {
    const { id } = req.params;
    if (!id || id.length > 128) {
        return res.status(400).json({ error: "Invalid note id." });
    }

    try {
        // CY321 Week 2 & 4: STRIDE mitigation via Active Defense HoneyLinks.
        if (id.startsWith("honey_")) {
            await supabase.from("intruder_logs").insert([{
                ip: extractClientIp(req),
                user_agent: req.get("user-agent") || "unknown"
            }]);
            return res.status(404).json({ error: "Note not found." });
        }

        const { data: note, error: selectError } = await supabase
            .from("notes")
            .select("id, ciphertext, iv")
            .eq("id", id)
            .single();

        if (selectError || !note) {
            return res.status(404).json({ error: "Note burned or missing." });
        }

        // CY321 Week 13 & 14: Burn-after-reading with immediate delete on first GET.
        await supabase.from("notes").delete().eq("id", id);

        return res.json({ ciphertext: note.ciphertext, iv: note.iv });
    } catch (err) {
        return res.status(500).json({ error: "Unexpected server error." });
    }
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Enigma Backend running on http://localhost:${PORT}`);
});