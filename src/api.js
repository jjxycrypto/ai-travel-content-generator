import { SECTION_MAP } from "./config";

export function parseResponse(data) {
  return data.content
    ? data.content.filter((b) => b.type === "text").map((b) => b.text || "").join("")
    : "";
}

export function parseSections(text) {
  const parts = text.split(/===([^=]+)===/);
  const parsed = {};
  for (let i = 1; i < parts.length - 1; i += 2) {
    const name = parts[i].trim();
    const content = parts[i + 1].trim();
    const key = SECTION_MAP[name] || name;
    parsed[key] = { label: name, content };
  }
  return parsed;
}

function buildPrompt(dest, audienceLabel, seasonLabel, customPrompt, formatInstructions) {
  return (
    "你是专业旅游内容创作AI，请为目的地\"" + dest + "\"生成内容，目标受众是" +
    audienceLabel + "，主推" + seasonLabel + "出行。" +
    (customPrompt ? "\n\n额外要求：" + customPrompt : "") +
    "\n\n每个内容块用\"===内容名称===\" 作为开头，内容名称必须和下面完全一致：\n\n" +
    formatInstructions
  );
}

function getFormatInstructions(activeFormats) {
  const map = {
    official: "【官网详情页】：300字左右，包含核心吸引力、特色体验、最佳游览时间，语言专业有感染力",
    xiaohongshu: "【小红书种草帖】：200字左右，带emoji，口语化，有标题和话题标签，结尾有互动引导",
    video: "【短视频解说脚本】：分镜头格式，约4-5个镜头，每镜头标注画面描述和配音文字",
    seo: "【SEO分析】：列出5个核心关键词、标题优化建议、内容差异化亮点3条",
  };
  return activeFormats.map((f) => map[f] || "").filter(Boolean).join("\n\n");
}

// All API calls go through the /api/chat proxy — API Key stays on the server
const PROXY_URL = "/api/chat";

export async function callAPI(body) {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error("API 请求失败 (" + res.status + "): " + (errText || res.statusText));
  }
  return res.json();
}

export async function callAPIStreaming(body, onChunk) {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error("API 请求失败 (" + res.status + "): " + (errText || res.statusText));
  }

  const contentType = res.headers.get("content-type") || "";

  // Non-SSE response: proxy doesn't support streaming
  if (!contentType.includes("text/event-stream")) {
    const data = await res.json();
    if (data.error) {
      throw new Error("API 错误: " + (data.error.message || JSON.stringify(data.error)));
    }
    const text = parseResponse(data);
    if (text) onChunk(text);
    return text;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop(); // keep incomplete event in buffer

    for (const event of events) {
      const lines = event.split("\n");
      let eventType = "";
      let dataLine = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) eventType = line.slice(7);
        if (line.startsWith("data: ")) dataLine = line.slice(6);
      }
      if (eventType === "content_block_delta" && dataLine) {
        try {
          const parsed = JSON.parse(dataLine);
          if (parsed.delta && parsed.delta.type === "text_delta" && parsed.delta.text) {
            fullText += parsed.delta.text;
            onChunk(parsed.delta.text);
          }
        } catch { /* skip malformed JSON */ }
      }
    }
  }

  return fullText;
}

export async function generateContent(dest, audience, season, customPrompt, activeFormats) {
  const prompt = buildPrompt(
    dest, audience, season, customPrompt,
    getFormatInstructions(activeFormats)
  );
  const data = await callAPI({
    model: "mimo-v2-pro",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
  });
  const text = parseResponse(data);
  const parsed = parseSections(text);
  if (Object.keys(parsed).length === 0) {
    parsed["official"] = { label: "生成结果", content: text };
  }
  return parsed;
}

export async function getScore(results) {
  if (Object.keys(results).length === 0) return {};
  const lines = Object.entries(results)
    .map((entry) => "【" + entry[1].label + "】\n" + entry[1].content.slice(0, 200))
    .join("\n\n");
  const scorePrompt =
    "请对以下旅游文案逐一评分（满分10分），并给出1条优化建议。\n" +
    "每个文案用以下格式输出，不要有其他内容：\n文案名称|分数|建议\n\n" +
    "例如：\n官网详情页|8|建议加入具体价格区间\n\n文案内容：\n" + lines;

  try {
    const d = await callAPI({ model: "mimo-v2-pro", max_tokens: 1024, messages: [{ role: "user", content: scorePrompt }] });
    const text = parseResponse(d);
    const scoreMap = {};
    text.split("\n").forEach(function (line) {
      const parts = line.split("|");
      if (parts.length >= 3) {
        const key = SECTION_MAP[parts[0].trim()] || parts[0].trim();
        scoreMap[key] = { score: parseInt(parts[1]) || 0, tip: parts[2].trim() };
      }
    });
    return scoreMap;
  } catch {
    return {};
  }
}

export async function batchGenerateItem(dest, audience, season, customPrompt) {
  const prompt =
    "你是专业旅游内容创作AI，请为目的地\"" + dest + "\"生成内容，目标受众是" +
    audience + "，主推" + season + "出行。" +
    (customPrompt ? "\n\n额外要求：" + customPrompt : "") +
    "\n\n每个内容块用\"===内容名称===\" 作为开头：\n\n" +
    "【官网详情页】：300字左右，包含核心吸引力、特色体验\n\n" +
    "【小红书种草帖】：200字左右，带emoji，口语化";

  try {
    const data = await callAPI({ model: "mimo-v2-pro", messages: [{ role: "user", content: prompt }], max_tokens: 1500 });
    const text = parseResponse(data);
    const parsed = parseSections(text);
    if (Object.keys(parsed).length === 0) parsed["official"] = { label: "生成结果", content: text };
    return { dest, results: parsed, time: new Date().toLocaleString("zh-CN") };
  } catch {
    return { dest, results: { error: { label: "错误", content: "生成失败" } }, time: new Date().toLocaleString("zh-CN") };
  }
}
