const express = require('express');
const app = express();
app.use(express.json());

// ====================================================
// ENV VARIABLES (Render Dashboard-এ set করুন):
// ONESIGNAL_APP_ID    = OneSignal App ID
// ONESIGNAL_REST_KEY  = OneSignal REST API Key
// ====================================================

app.get('/', (req, res) => {
    res.json({ status: 'Jenious Guard Backend Running ✅' });
});

// ✅ Device Wake — Doze থেকে জাগানো
// Body: { "playerId": "onesignal-player-id", "command": "wake" }
app.post('/wake-device', async (req, res) => {
    const { playerId, command = 'wake' } = req.body;

    if (!playerId) {
        return res.status(400).json({ error: 'playerId required' });
    }

    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${process.env.ONESIGNAL_REST_KEY}`
            },
            body: JSON.stringify({
                app_id: process.env.ONESIGNAL_APP_ID,
                include_player_ids: [playerId],

                // ✅ HIGH PRIORITY — Doze mode ভেদ করে যায়
                priority: 10,

                // ✅ Silent — notification bar-এ দেখাবে না
                contents:  { en: " " },
                headings:  { en: " " },
                android_visibility: 0,

                // ✅ Data payload — child app command বুঝবে
                data: { command: command }
            })
        });

        const result = await response.json();

        if (result.errors) {
            console.error('OneSignal errors:', result.errors);
            return res.status(400).json({ error: result.errors });
        }

        console.log(`Wake command "${command}" sent to ${playerId}`);
        res.json({ success: true, id: result.id });

    } catch (err) {
        console.error('Wake error:', err);
        res.status(500).json({ error: 'Failed: ' + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🛡️ Jenious Guard Backend on port ${PORT}`));
