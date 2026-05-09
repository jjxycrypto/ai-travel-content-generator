const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

const BASE_URL = process.env.API_BASE_URL || "https://token-plan-cn.xiaomimimo.com/anthropic";
const API_KEY = process.env.API_KEY || "";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.post("/api/chat", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "API_KEY not configured in server/.env" });
  }

  try {
    const body = req.body;
    const isStream = body.stream === true;

    const upstream = await fetch(BASE_URL + "/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      return res.status(upstream.status).json({ error: errText || upstream.statusText });
    }

    if (isStream) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }

      res.end();
    } else {
      const data = await upstream.json();
      return res.status(200).json(data);
    }
  } catch (err) {
    return res.status(500).json({ error: "Proxy error: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log("API proxy running on http://localhost:" + PORT);
  if (!API_KEY) {
    console.warn("WARNING: API_KEY not set. Create server/.env with your API_KEY.");
  }
});
