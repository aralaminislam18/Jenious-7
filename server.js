const express = require("express");
const cors = require("cors");

const app = express();

// CORS
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Jenious Guard Backend Running ✅"
    });
});

app.post("/wake-device", async (req, res) => {

    const { playerId, command = "wake" } = req.body;

    if (!playerId) {
        return res.status(400).json({
            success: false,
            error: "playerId required"
        });
    }

    try {

        console.log("======================================");
        console.log("Incoming Wake Request");
        console.log("Subscription ID:", playerId);
        console.log("Command:", command);

        const body = {
            app_id: process.env.ONESIGNAL_APP_ID,

            include_player_ids: [playerId],

            priority: 10,

            contents: {
                en: " "
            },

            headings: {
                en: " "
            },

            android_visibility: 0,

            data: {
                command: command
            }
        };

        console.log(JSON.stringify(body, null, 2));

        const response = await fetch(
            "https://onesignal.com/api/v1/notifications",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${process.env.ONESIGNAL_REST_KEY}`
                },
                body: JSON.stringify(body)
            }
        );

        const result = await response.json();

        console.log("HTTP Status:", response.status);
        console.log(JSON.stringify(result, null, 2));

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                response: result
            });
        }

        res.json({
            success: true,
            response: result
        });

    } catch (e) {

        console.error(e);

        res.status(500).json({
            success: false,
            error: e.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("======================================");
    console.log("Jenious Guard Backend Started");
    console.log("Port:", PORT);
    console.log("App ID:", process.env.ONESIGNAL_APP_ID);
    console.log(
        "REST KEY:",
        process.env.ONESIGNAL_REST_KEY ? "Loaded ✅" : "Missing ❌"
    );
    console.log("======================================");
});