const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const supabase = require('./database');

const app = express();
app.use(express.json());
app.use(cors());

// Feature A: Upload Encrypted Note
app.post('/api/notes', async (req, res) => {
    const { ciphertext, iv } = req.body;
    const id = crypto.randomBytes(8).toString('hex');
    
    const { error } = await supabase.from('notes').insert([{ id, ciphertext, iv }]);
    if (error) return res.status(500).json({ error: 'Database insertion failed' });
    res.json({ id });
});

// Feature B & D: Retrieve, Burn, and Active Defense Logging
app.get('/api/notes/:id', async (req, res) => {
    const { id } = req.params;

    // CY321 Deliverable 2: Active Defense (HoneyLinks) Logging 
    if (id.startsWith('honey_')) {
        await supabase.from('intruder_logs').insert([{ 
            ip: req.ip || 'unknown', 
            user_agent: req.get('User-Agent') 
        }]);
        // Silently fail so the attacker is unaware they are logged
        return res.status(404).json({ error: 'Note not found' });
    }

    // CY321 Deliverable 2: Burn-After-Reading Logic
    const { data: note, error } = await supabase.from('notes').select('*').eq('id', id).single();
    if (error || !note) return res.status(404).json({ error: 'Note burned or missing' });

    // Secure Coding: Immediate deletion to prevent multiple reads
    await supabase.from('notes').delete().eq('id', id);
    
    res.json({ ciphertext: note.ciphertext, iv: note.iv });
});

app.listen(3000, () => console.log('Enigma Backend running on http://localhost:3000'));