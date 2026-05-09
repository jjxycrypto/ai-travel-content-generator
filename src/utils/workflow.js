const WORKFLOW_KEY = "travel-ai-workflows";
const ACTIVE_KEY = "travel-ai-active-workflow";

// Default agent definitions (serializable — no functions)
export const DEFAULT_AGENTS = [
  {
    id: "agent-research",
    name: "目的地研究",
    enabled: true,
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
    maxTokens: 1500,
    readFields: ["knowledgeEntries"],
    writeField: "research",
    parseType: "json",
    isCustom: false,
  },
  {
    id: "agent-audience",
    name: "受众画像",
    enabled: true,
    systemPrompt: [
      "你是一个旅游营销策略专家。根据目的地研究数据和目标受众，输出精准的营销策略。",
      "严格只输出JSON，不要任何其他文字。JSON格式：",
      '{ "audienceProfile": "目标受众画像描述（50字以内）",',
      '  "sellingPoints": ["针对该受众的卖点1", "卖点2", "卖点3"],',
      '  "tone": "推荐语气风格（如：温馨亲切、活力四射）",',
      '  "style": "内容风格建议（如：多用emoji、口语化、数据支撑）" }',
    ].join("\n"),
    maxTokens: 1500,
    readFields: ["research", "knowledgeEntries"],
    writeField: "audienceProfile",
    parseType: "json",
    isCustom: false,
  },
  {
    id: "agent-content",
    name: "内容创作",
    enabled: true,
    systemPrompt: [
      "你是一个专业旅游内容创作专家。根据提供的目的地研究和受众策略，创作高质量旅游内容。",
      '每个内容块用"===内容名称==="作为开头，内容名称必须和指定的完全一致。',
      "只输出内容，不要额外说明。",
    ].join("\n"),
    maxTokens: 3000,
    readFields: ["research", "audienceProfile", "knowledgeEntries", "benchmarkContext"],
    writeField: "content",
    parseType: "sections",
    isCustom: false,
  },
  {
    id: "agent-seo",
    name: "SEO优化",
    enabled: true,
    systemPrompt: [
      "你是一个旅游内容SEO专家。对提供的旅游内容进行SEO优化。",
      '输入的内容用"===内容名称==="分隔。请保持相同的分隔格式输出优化后的内容。',
      "优化要点：融入热门搜索关键词、优化标题吸引力、增加结构化信息。",
      '在最后额外添加一个"===SEO分析==="部分，列出核心关键词和优化亮点。',
      "只输出优化后的内容，不要额外说明。",
    ].join("\n"),
    maxTokens: 1500,
    readFields: ["content", "knowledgeEntries"],
    writeField: null,
    parseType: "sections",
    isCustom: false,
  },
];

function generateId() {
  return "wf-" + Date.now() + "-" + String(Math.random()).slice(2, 8);
}

export function getDefaultWorkflow() {
  return {
    id: "default",
    name: "默认工作流",
    agents: DEFAULT_AGENTS.map((a) => ({ ...a })),
    isDefault: true,
  };
}

export function loadWorkflows() {
  try {
    const raw = localStorage.getItem(WORKFLOW_KEY);
    return raw ? JSON.parse(raw) : [getDefaultWorkflow()];
  } catch {
    return [getDefaultWorkflow()];
  }
}

export function saveWorkflows(workflows) {
  try { localStorage.setItem(WORKFLOW_KEY, JSON.stringify(workflows)); } catch { /* quota */ }
}

export function loadActiveWorkflow() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return getDefaultWorkflow();
}

export function saveActiveWorkflow(workflow) {
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify(workflow)); } catch { /* quota */ }
}

export function createCustomAgent(data) {
  return {
    id: generateId(),
    name: data.name || "自定义Agent",
    enabled: true,
    systemPrompt: data.systemPrompt || "你是一个旅游内容助手。根据输入完成任务。",
    maxTokens: data.maxTokens || 1500,
    readFields: data.readFields || [],
    writeField: data.writeField || null,
    parseType: data.parseType || "sections",
    isCustom: true,
  };
}
