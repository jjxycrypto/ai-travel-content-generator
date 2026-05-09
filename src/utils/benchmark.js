import { callAPI, parseResponse } from "../api";
import { MODEL } from "../config";

const BENCHMARK_KEY = "travel-ai-benchmarks";
const ANALYSIS_KEY = "travel-ai-benchmark-analysis";

// --- Pre-built viral samples ---

const PRESET_SAMPLES = [
  {
    id: "preset-official-1",
    platform: "official",
    title: "丽江古城 — 一城一世界的千年回响",
    content: "踏上丽江古城的青石板路，时光仿佛在这里慢下了脚步。玉龙雪山的融水穿城而过，纳西古乐在四方街的夜风中悠扬回荡。这里是茶马古道的起点，也是无数旅人心中的乌托邦。清晨在狮子山看日出洒满古城屋顶，午后在木府感受土司文化的厚重，夜晚在酒吧街邂逅一场不期而遇的故事。无论你是文化探寻者还是自然爱好者，丽江都能给你一个留下来的理由。",
    tags: ["丽江", "古城", "文化", "纳西", "玉龙雪山", "感染力"],
    analysis: null,
  },
  {
    id: "preset-official-2",
    platform: "official",
    title: "三亚 — 北纬18°的热带天堂",
    content: "椰风海韵，碧浪银沙，三亚用26°C的恒温拥抱每一位远道而来的客人。亚龙湾的细软白沙延伸至天际，蜈支洲岛的珊瑚在水下绽放五彩斑斓，天涯海角的巨石见证无数誓言。从南山寺108米的南海观音到第一市场的海鲜盛宴，从热带雨林探险到免税购物狂欢，三亚不仅是一座海滨城市，更是一种度假生活方式的极致表达。",
    tags: ["三亚", "海滩", "热带", "度假", "亚龙湾", "感染力"],
    analysis: null,
  },
  {
    id: "preset-xhs-1",
    platform: "xiaohongshu",
    title: "姐妹们！大理真的太太太美了！！",
    content: "  刚从大理回来！这趟旅行简直刷新我的认知\n\n  苍山洱海真的不是滤镜！骑着小电驴环洱海，风吹过脸颊的那一刻我觉得自己就是偶像剧女主哈哈哈\n\n  喜洲古镇的白族建筑超出片！随便一拍就是大片  老板娘做的喜洲粑粑也太香了吧\n\n  一定要去双廊住一晚海景房！躺在床上看日落 真的会哭 \n\n  Tips：\n  ✈️ 飞昆明转高铁到大理只要2小时\n   住宿推荐双廊和古城各住两晚\n   防晒！防晒！防晒！重要的事说三遍\n\n#大理旅游 #洱海骑行 #云南旅行 #闺蜜出游 #旅行攻略",
    tags: ["大理", "洱海", "小红书", "闺蜜", "种草", "emoji", "互动"],
    analysis: null,
  },
  {
    id: "preset-xhs-2",
    platform: "xiaohongshu",
    title: "西藏7天6晚超详细攻略来了！",
    content: "  终于去了心心念念的西藏！整理了一份保姆级攻略给你们～\n\n ️ Day1-2 拉萨：布达拉宫一定要提前预约！大昭寺转经超治愈\n ️ Day3-4 林芝：被称为'西藏江南'真的名不虚传，鲁朗林海美到窒息\n ️ Day5-6 纳木错：圣湖的蓝是调色盘调不出来的那种！海拔4718记得带氧气\n ️ Day7 返程：八廓街买买买！藏式手工艺品真的很有特色\n\n⚠️ 高反tips：提前一周吃红景天，到了别剧烈运动，多喝水\n\n  有问题评论区问我！看到都会回！\n\n#西藏旅行 #拉萨 #纳木错 #林芝 #高原旅行 #旅行攻略",
    tags: ["西藏", "拉萨", "攻略", "小红书", "互动引导", "标签"],
    analysis: null,
  },
  {
    id: "preset-video-1",
    platform: "video",
    title: "成都3天2夜短视频脚本",
    content: "【镜头1 — 开场】\n画面：宽窄巷子入口航拍，晨光穿过竹林\n配音：\"有一座城市，来了就不想走。\"\n\n【镜头2 — 美食】\n画面：火锅特写，红油翻滚，筷子夹起毛肚\n配音：\"早上一碗担担面，中午一顿串串香，晚上当然要来一顿正宗的成都火锅。辣，是这座城市的态度。\"\n\n【镜头3 — 文化】\n画面：大熊猫基地，憨态可掬的大熊猫啃竹子\n配音：\"这里生活着全球最多的圈养大熊猫，看它们吃竹子的样子，能治愈一切不开心。\"\n\n【镜头4 — 生活】\n画面：人民公园，老人喝茶掏耳朵，年轻人打麻将\n配音：\"成都人的生活哲学就两个字：巴适。一杯盖碗茶，一下午时光，这就是成都。\"\n\n【镜头5 — 结尾】\n画面：锦里夜景，红灯笼倒映在河面\n配音：\"成都，一座来了就不想走的城市。你，什么时候来？\"",
    tags: ["成都", "短视频", "分镜头", "火锅", "熊猫", "配音"],
    analysis: null,
  },
  {
    id: "preset-seo-1",
    platform: "seo",
    title: "厦门旅游SEO分析示例",
    content: "【核心关键词】\n1. 厦门旅游攻略（搜索量高，竞争中等）\n2. 鼓浪屿门票预约（长尾词，转化率高）\n3. 厦门必去景点（信息类，引流效果好）\n4. 厦门美食推荐（种草属性强）\n5. 厦门住宿攻略（决策类，用户意向强）\n\n【标题优化建议】\n原标题：厦门旅游\n优化为：2024厦门旅游攻略｜鼓浪屿+环岛路+曾厝垵｜本地人推荐路线\n\n【内容差异化亮点】\n1. 加入本地人私藏路线（如八市早市+沙坡尾），区别于千篇一律的景点罗列\n2. 配实拍图+价格标注，增强可信度\n3. 按3天/5天/7天分层推荐，覆盖不同需求",
    tags: ["SEO", "关键词", "标题优化", "厦门", "差异化"],
    analysis: null,
  },
];

// --- Storage ---

function loadAnalysisMap() {
  try {
    const raw = localStorage.getItem(ANALYSIS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAnalysisMap(map) {
  try { localStorage.setItem(ANALYSIS_KEY, JSON.stringify(map)); } catch { /* quota */ }
}

function loadUserBenchmarks() {
  try {
    const raw = localStorage.getItem(BENCHMARK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUserBenchmarks(entries) {
  try { localStorage.setItem(BENCHMARK_KEY, JSON.stringify(entries)); } catch { /* quota */ }
}

// --- Public API ---

export function loadAllBenchmarks() {
  const analysisMap = loadAnalysisMap();
  const all = [...PRESET_SAMPLES, ...loadUserBenchmarks()];
  return all.map((b) => analysisMap[b.id] ? { ...b, analysis: analysisMap[b.id] } : b);
}

export function getUserBenchmarks() {
  return loadUserBenchmarks();
}

export function addUserBenchmark(entry) {
  const entryObj = {
    id: "user-" + Date.now() + "-" + String(Math.random()).slice(2, 8),
    platform: entry.platform || "official",
    title: entry.title || "未命名爆款",
    content: entry.content,
    tags: entry.tags || [],
    analysis: null,
    source: "user",
    createdAt: new Date().toLocaleString("zh-CN"),
  };
  const current = loadUserBenchmarks();
  const next = [entryObj, ...current];
  saveUserBenchmarks(next);
  return entryObj;
}

export function deleteUserBenchmark(id) {
  const current = loadUserBenchmarks();
  saveUserBenchmarks(current.filter((e) => e.id !== id));
}

export function updateBenchmarkAnalysis(id, analysis) {
  const map = loadAnalysisMap();
  map[id] = analysis;
  saveAnalysisMap(map);
}

// --- AI Analysis ---

export async function analyzeBenchmark(content, platform) {
  const prompt = `请分析以下${PLATFORM_LABELS[platform] || "旅游"}爆款内容的成功要素，严格只输出JSON：\n\n${content}\n\nJSON格式：\n{\n  "hook": "开头吸引力分析（30字以内）",\n  "structure": "内容结构特点（50字以内）",\n  "emotionalWords": ["情感词1", "情感词2"],\n  "keywords": ["核心关键词1", "关键词2", "关键词3"],\n  "cta": "互动引导/行动号召分析（30字以内）",\n  "uniqueAngle": "差异化角度（50字以内）",\n  "score": 8,\n  "summary": "一句话总结成功秘诀（30字以内）"\n}`;

  const data = await callAPI({ model: MODEL, messages: [{ role: "user", content: prompt }], max_tokens: 800 });
  const text = parseResponse(data);

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return null;
  }
}

// --- Retrieval for generation ---

export function retrieveBenchmarks(dest, audience, platform, allBenchmarks) {
  const keywords = [dest, audience, platform].filter(Boolean).map((k) => k.toLowerCase());
  const scored = allBenchmarks.map((b) => {
    let score = 0;
    const lcTitle = b.title.toLowerCase();
    const lcContent = b.content.toLowerCase();
    const lcTags = b.tags.map((t) => t.toLowerCase());

    for (const kw of keywords) {
      if (lcTags.some((t) => t.includes(kw) || kw.includes(t))) score += 3;
      if (lcTitle.includes(kw)) score += 2;
      if (lcContent.includes(kw)) score += 1;
    }

    // Boost analyzed and preset entries
    if (b.analysis) score += 2;
    if (!b.source) score += 1; // presets have no source field

    return { entry: b, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.entry);
}

// --- Format benchmark context for agent prompts ---

export function formatBenchmarkContext(benchmarks) {
  if (!benchmarks || benchmarks.length === 0) return "";
  return benchmarks.map((b, i) => {
    const parts = [`[爆款参考${i + 1}] ${b.title}`];
    parts.push(b.content.slice(0, 300));
    if (b.analysis) {
      parts.push(`成功要素：${b.analysis.summary || ""} | 结构：${b.analysis.structure || ""} | 差异化：${b.analysis.uniqueAngle || ""}`);
    }
    return parts.join("\n");
  }).join("\n\n");
}

const PLATFORM_LABELS = { official: "官网详情页", xiaohongshu: "小红书种草帖", video: "短视频脚本", seo: "SEO分析" };
