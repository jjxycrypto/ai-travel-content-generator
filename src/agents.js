import { callAPIStreaming, parseSections } from "./api";
import { MODEL, FORMATS } from "./config";

// --- JSON parse helper (handles markdown-wrapped, dirty JSON) ---
function parseJSON(text) {
  if (!text || typeof text !== "string") return null;

  // 1. Try direct parse
  try { return JSON.parse(text); } catch { /* continue */ }

  // 2. Strip markdown code fences: ```json ... ``` or ``` ... ```
  let cleaned = text.replace(/```(?:json)?\s*\n?/g, "").replace(/```\s*$/g, "").trim();

  try { return JSON.parse(cleaned); } catch { /* continue */ }

  // 3. Extract the outermost {...} block
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    let jsonStr = cleaned.slice(start, end + 1);
    // Fix trailing commas before } or ]
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");
    // Fix single-quoted strings (convert to double quotes)
    jsonStr = jsonStr.replace(/'/g, '"');
    try { return JSON.parse(jsonStr); } catch { /* continue */ }
  }

  // 4. Try extracting from original text (before cleaning)
  const origStart = text.indexOf("{");
  const origEnd = text.lastIndexOf("}");
  if (origStart !== -1 && origEnd > origStart) {
    let jsonStr = text.slice(origStart, origEnd + 1);
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");
    try { return JSON.parse(jsonStr); } catch { /* continue */ }
  }

  return null;
}

function parseSectionsOrFallback(text) {
  const parsed = parseSections(text);
  if (Object.keys(parsed).length === 0) {
    return { result: { label: "生成结果", content: text } };
  }
  return parsed;
}

// --- Agent Definitions ---

const AGENTS = [
  // Step 0: 目的地研究
  {
    id: "agent-research",
    name: "目的地研究",
    systemPrompt: [
      "你是一个旅游目的地研究专家。请深入研究指定旅游目的地，提供全面准确的信息。",
      "严格只输出JSON，不要任何其他文字。JSON格式：",
      '{ "overview": "目的地总体介绍（100字以内）",',
      '  "highlights": ["亮点1", "亮点2", "亮点3"],',
      '  "attractions": [{"name":"景点名", "desc":"简介"}],',
      '  "food": ["美食1", "美食2"],',
      '  "transport": "交通方式概述",',
      '  "seasonTips": "当季出行贴士" }',
    ].join("\n"),
    buildMessages: (ctx) => {
      const destKnowledge = (ctx.knowledgeEntries || []).filter((e) => e.type === "destination");
      const parts = [`请研究旅游目的地：${ctx.dest}，重点关注${ctx.season}出行的特色和体验。`];
      if (destKnowledge.length > 0) {
        parts.push("\n参考信息：");
        destKnowledge.forEach((e, i) => parts.push(`[参考${i + 1}] ${e.title}: ${e.content.slice(0, 200)}`));
      }
      return [{ role: "user", content: parts.join("\n") }];
    },
    parseOutput: parseJSON,
    // Workflow metadata
    readFields: ["knowledgeEntries"],
    writeField: "research",
    parseType: "json",
  },

  // Step 1: 受众画像
  {
    id: "agent-audience",
    name: "受众画像",
    systemPrompt: [
      "你是一个旅游营销策略专家。根据目的地研究数据和目标受众，输出精准的营销策略。",
      "严格只输出JSON，不要任何其他文字。JSON格式：",
      '{ "audienceProfile": "目标受众画像描述（50字以内）",',
      '  "sellingPoints": ["针对该受众的卖点1", "卖点2", "卖点3"],',
      '  "tone": "推荐语气风格（如：温馨亲切、活力四射）",',
      '  "style": "内容风格建议（如：多用emoji、口语化、数据支撑）" }',
    ].join("\n"),
    buildMessages: (ctx) => {
      const brandKnowledge = (ctx.knowledgeEntries || []).filter((e) => e.type === "brand_style");
      const parts = [
        `目标受众：${ctx.audience}`,
        `出行季节：${ctx.season}`,
        ctx.customPrompt ? `额外要求：${ctx.customPrompt}` : "",
        "",
        "以下是目的地研究数据：",
        JSON.stringify(ctx.research, null, 2),
      ];
      if (brandKnowledge.length > 0) {
        parts.push("", "品牌风格参考：");
        brandKnowledge.forEach((e, i) => parts.push(`[参考${i + 1}] ${e.title}: ${e.content.slice(0, 200)}`));
      }
      return [{ role: "user", content: parts.filter(Boolean).join("\n") }];
    },
    parseOutput: parseJSON,
    readFields: ["research", "knowledgeEntries"],
    writeField: "audienceProfile",
    parseType: "json",
  },

  // Step 2: 内容创作
  {
    id: "agent-content",
    name: "内容创作",
    systemPrompt: [
      "你是一个专业旅游内容创作专家。根据提供的目的地研究和受众策略，创作高质量旅游内容。",
      '每个内容块用"===内容名称==="作为开头，内容名称必须和指定的完全一致。',
      "只输出内容，不要额外说明。",
    ].join("\n"),
    buildMessages: (ctx) => {
      const formatInstrs = ctx.activeFormats
        .map((f) => {
          const label = FORMATS[f];
          if (!label) return "";
          if (f === "official") return `【${label}】：300字左右，包含核心吸引力、特色体验、最佳游览时间，语言专业有感染力`;
          if (f === "xiaohongshu") return `【${label}】：200字左右，带emoji，口语化，有标题和话题标签，结尾有互动引导`;
          if (f === "video") return `【${label}】：分镜头格式，约4-5个镜头，每镜头标注画面描述和配音文字`;
          if (f === "seo") return `【${label}】：列出5个核心关键词、标题优化建议、内容差异化亮点3条`;
          return "";
        })
        .filter(Boolean).join("\n\n");

      const parts = [
        `请为目的地"${ctx.dest}"生成以下内容。`,
        `目标受众：${ctx.audience}`,
        `受众策略：${ctx.audienceProfile ? JSON.stringify(ctx.audienceProfile) : "无"}`,
        `目的地研究：${ctx.research ? JSON.stringify(ctx.research) : "无"}`,
        "",
        "请生成以下格式的内容：",
        "",
        formatInstrs,
      ];

      if (ctx.knowledgeEntries && ctx.knowledgeEntries.length > 0) {
        parts.push("", "以下是品牌风格参考和历史最佳实践（请参考这些风格模式）：");
        ctx.knowledgeEntries.forEach((e, i) => parts.push(`[参考${i + 1}] ${e.title}: ${e.content.slice(0, 200)}`));
      }

      if (ctx.benchmarkContext) {
        parts.push("", "以下是爆款内容对标参考（请学习这些成功模式的结构、语气和差异化角度）：");
        parts.push(ctx.benchmarkContext);
      }

      return [{ role: "user", content: parts.join("\n") }];
    },
    parseOutput: (text) => {
      const parsed = parseSections(text);
      if (Object.keys(parsed).length === 0) {
        return { official: { label: "生成结果", content: text } };
      }
      return parsed;
    },
    maxTokens: 3000,
    readFields: ["research", "audienceProfile", "knowledgeEntries", "benchmarkContext"],
    writeField: "content",
    parseType: "sections",
  },

  // Step 3: SEO优化
  {
    id: "agent-seo",
    name: "SEO优化",
    systemPrompt: [
      "你是一个旅游内容SEO专家。对提供的旅游内容进行SEO优化。",
      '输入的内容用"===内容名称==="分隔。请保持相同的分隔格式输出优化后的内容。',
      "优化要点：融入热门搜索关键词、优化标题吸引力、增加结构化信息。",
      '在最后额外添加一个"===SEO分析==="部分，列出核心关键词和优化亮点。',
      "只输出优化后的内容，不要额外说明。",
    ].join("\n"),
    buildMessages: (ctx) => {
      const contentText = Object.entries(ctx.content || {})
        .map(([, v]) => `===${v.label}===\n${v.content}`)
        .join("\n\n");
      const seoKnowledge = (ctx.knowledgeEntries || []).filter((e) => e.type === "brand_style" || e.type === "feedback");
      const parts = [`请对以下旅游内容进行SEO优化，目的地是"${ctx.dest}"：\n\n${contentText}`];
      if (seoKnowledge.length > 0) {
        parts.push("\n品牌风格和优化参考：");
        seoKnowledge.forEach((e, i) => parts.push(`[参考${i + 1}] ${e.title}: ${e.content.slice(0, 150)}`));
      }
      return [{ role: "user", content: parts.join("\n") }];
    },
    parseOutput: (text) => {
      const parsed = parseSections(text);
      if (Object.keys(parsed).length === 0) {
        return { official: { label: "SEO优化结果", content: text } };
      }
      return parsed;
    },
    readFields: ["content", "knowledgeEntries"],
    writeField: null,
    parseType: "sections",
  },
];

// --- Generic buildMessages for custom agents ---
function buildGenericMessages(ctx) {
  const parts = ["任务信息："];
  if (ctx.dest) parts.push("目的地：" + ctx.dest);
  if (ctx.audience) parts.push("受众：" + ctx.audience);
  if (ctx.season) parts.push("季节：" + ctx.season);
  if (ctx.customPrompt) parts.push("要求：" + ctx.customPrompt);

  // Include any context fields as JSON
  for (const [key, val] of Object.entries(ctx)) {
    if (["dest", "audience", "season", "customPrompt", "activeFormats", "knowledgeEntries"].includes(key)) continue;
    if (val !== undefined && val !== null) {
      parts.push("\n[" + key + "]:\n" + (typeof val === "object" ? JSON.stringify(val, null, 2) : String(val)));
    }
  }

  if (ctx.knowledgeEntries && ctx.knowledgeEntries.length > 0) {
    parts.push("\n参考知识：");
    ctx.knowledgeEntries.forEach((e, i) => parts.push(`[${i + 1}] ${e.title}: ${e.content.slice(0, 200)}`));
  }

  return [{ role: "user", content: parts.join("\n") }];
}

// --- Pipeline Orchestrator ---

export async function runPipeline(config, onStepChange, onChunk) {
  const { dest, audience, season, customPrompt, activeFormats } = config;
  const baseCtx = { dest, audience, season, customPrompt, activeFormats };
  const context = { ...baseCtx, knowledgeEntries: config.knowledgeEntries || [], benchmarkContext: config.benchmarkContext || "" };

  // workflowAgents: array of agent config objects (with id, name, systemPrompt, maxTokens, etc.)
  const workflowAgents = config.workflowAgents || getDefaultAgentConfigs();
  const agentOutputs = [];
  let stepIdx = 0;

  for (const agentConfig of workflowAgents) {
    if (agentConfig.enabled === false) continue;

    // Find the built-in agent by id (for buildMessages and parseOutput)
    const builtIn = AGENTS.find((a) => a.id === agentConfig.id);

    const name = agentConfig.name || (builtIn ? builtIn.name : "自定义");
    onStepChange(stepIdx, name);

    // Build context for this agent based on readFields
    const agentCtx = { ...baseCtx };
    for (const field of (agentConfig.readFields || [])) {
      if (context[field] !== undefined) agentCtx[field] = context[field];
    }

    // Build messages: use built-in buildMessages or generic fallback
    const buildMsgs = builtIn ? builtIn.buildMessages : buildGenericMessages;
    const messages = buildMsgs(agentCtx);

    // Override system prompt if customized
    const systemPrompt = agentConfig.systemPrompt || null;

    const maxTokens = agentConfig.maxTokens || (builtIn ? builtIn.maxTokens : 1500) || 1500;

    let rawText;
    const currentStep = stepIdx;
    try {
      rawText = await callAPIStreaming(
        { model: MODEL, messages, max_tokens: maxTokens, ...(systemPrompt && { system: systemPrompt }) },
        (chunk) => onChunk(currentStep, chunk)
      );
    } catch (err) {
      throw new Error(name + " Agent 请求失败: " + (err.message || "网络异常"));
    }

    if (!rawText || !rawText.trim()) {
      throw new Error(name + " Agent 返回为空，请重试");
    }

    // Parse output based on parseType
    const parseFn = builtIn ? builtIn.parseOutput : (agentConfig.parseType === "json" ? parseJSON : parseSectionsOrFallback);
    let parsed = parseFn(rawText);
    if (!parsed || Object.keys(parsed).length === 0) {
      parsed = { _raw: { label: name, content: rawText } };
    }

    agentOutputs.push(parsed);

    // Write back to context if writeField specified
    if (agentConfig.writeField) {
      context[agentConfig.writeField] = parsed;
    }

    stepIdx++;
  }

  return { outputs: agentOutputs, knowledgeHits: context.knowledgeEntries };
}

export function getDefaultAgentConfigs() {
  return AGENTS.map((a) => ({
    id: a.id,
    name: a.name,
    enabled: true,
    systemPrompt: a.systemPrompt,
    maxTokens: a.maxTokens || 1500,
    readFields: a.readFields,
    writeField: a.writeField,
    parseType: a.parseType,
    isCustom: false,
  }));
}

// Agent metadata for the workflow panel (serializable)
export const AGENT_DEFS = AGENTS.map((a) => ({
  id: a.id,
  name: a.name,
  systemPrompt: a.systemPrompt,
  maxTokens: a.maxTokens || 1500,
  readFields: a.readFields,
  writeField: a.writeField,
  parseType: a.parseType,
}));

export const AGENT_NAMES = AGENTS.map((a) => a.name);
