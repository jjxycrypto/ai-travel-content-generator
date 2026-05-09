// Vercel Serverless Function — API proxy
// API Key stays server-side, never exposed to the browser
const BASE_URL = process.env.API_BASE_URL || "https://token-plan-cn.xiaomimimo.com/anthropic";
const API_KEY = process.env.API_KEY || "";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: "API_KEY not configured in Vercel environment variables" });
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
      // Stream SSE back to the client
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
      // Non-streaming: return JSON
      const data = await upstream.json();
      return res.status(200).json(data);
    }
  } catch (err) {
    return res.status(500).json({ error: "Proxy error: " + err.message });
  }
}

// Disable Vercel body parser so we can handle raw/streaming bodies
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};
