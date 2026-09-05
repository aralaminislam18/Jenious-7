const express = require("express");
const cors = require("cors");

const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// =========================
// Middleware
// =========================
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

app.use(express.json());

// =========================
// Health Check
// =========================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Jenious Guard Backend Running ✅",
        timestamp: new Date().toISOString()
    });
});

// =========================
// Wake Device API
// =========================
app.post("/wake-device", async (req, res) => {

    try {

        const { playerId, command = "wake" } = req.body;

        if (!playerId) {
            return res.status(400).json({
                success: false,
                error: "playerId required"
            });
        }

        console.log("\n==============================");
        console.log("Incoming Wake Request");
        console.log("Player ID :", playerId);
        console.log("Command   :", command);

        // ✅ FIXED: Proper notification payload with visible content
        const body = {
            app_id: process.env.ONESIGNAL_APP_ID,

            include_player_ids: [playerId],

            priority: 10,

            // ✅ Visible content (user দেখবে)
            contents: {
                en: "🛡️ Jenious Guard Wake Command"
            },

            headings: {
                en: "Jenious Guard"
            },

            // ✅ High priority — foreground/background উভয়েই deliver হবে
            android_priority: "high",
            
            // ✅ Heads up notification দেখাবে (notification panel এ)
            android_visibility: 1,

            // ✅ Data payload handler এ যাবে (command identify করার জন্য)
            data: {
                command: command,
                wake: true,
                timestamp: Date.now()
            },

            // ✅ BigText format (বেশি content দেখাবে)
            big_text: {
                en: `Device wake command received. Command: ${command}`
            },

            // ✅ Custom sound + vibration + LED (visual feedback)
            android_sound: "default",
            android_led_color: "FF0000FF",  // Blue LED
            android_vibrate: [100, 200, 100]
        };

        console.log("Request Body:");
        console.log(JSON.stringify(body, null, 2));

        const response = await fetch(
            "https://onesignal.com/api/v1/notifications",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Basic ${process.env.ONESIGNAL_REST_KEY}`
                },
                body: JSON.stringify(body)
            }
        );

        const result = await response.json();

        console.log("------------------------------");
        console.log("HTTP Status :", response.status);
        console.log("Response:");
        console.log(JSON.stringify(result, null, 2));
        console.log("==============================\n");

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                response: result
            });
        }

        return res.json({
            success: true,
            response: result
        });

    } catch (err) {

        console.error("Wake Device Error:");
        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });

    }

});

// =========================
// 404
// =========================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "API Not Found"
    });
});

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log("======================================");
    console.log("Jenious Guard Backend Started");
    console.log("Port:", PORT);
    console.log("App ID:",
        process.env.ONESIGNAL_APP_ID ? "Loaded ✅" : "Missing ❌");

    console.log("REST KEY:",
        process.env.ONESIGNAL_REST_KEY ? "Loaded ✅" : "Missing ❌");

    console.log("======================================");

});