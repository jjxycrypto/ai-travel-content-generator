import { useState } from "react";

const FORMATS = { official: "官网详情页", xiaohongshu: "小红书种草", video: "短视频脚本", seo: "SEO 分析" };
const AUDIENCE_MAP = { couple: "情侣游客", family: "亲子家庭", backpacker: "背包客", senior: "银发游客" };
const SEASON_MAP = { spring: "春季", summer: "夏季", autumn: "秋季", winter: "冬季", any: "全年" };

const API_KEY = "tp-criayefsdinzkz2sl4munqgmaql929gqdd7adnzzuo1epweh";
const BASE_URL = "https://token-plan-cn.xiaomimimo.com/anthropic";
const MODEL = "mimo-v2.5-pro";

export default function App() {
  const [dest, setDest] = useState("");
  const [audience, setAudience] = useState("couple");
  const [season, setSeason] = useState("spring");
  const [activeFormats, setActiveFormats] = useState(["official", "xiaohongshu", "video"]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(-1);
  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState("");
  const [loadingText, setLoadingText] = useState("");
  const [dots, setDots] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [scores, setScores] = useState({});
  const [batchMode, setBatchMode] = useState(false);
  const [batchDests, setBatchDests] = useState("");
  const [batchResults, setBatchResults] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const toggleFormat = (fmt) => {
    setActiveFormats((prev) =>
      prev.includes(fmt) ? (prev.length > 1 ? prev.filter((f) => f !== fmt) : prev) : [...prev, fmt]
    );
  };

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  const generate = async () => {
    if (!dest.trim()) return;
    setLoading(true);
    setResults({});
    setScores({});
    setStep(0);
    const msgs = ["正在解析目的地信息...", "正在匹配用户画像...", "正在生成多平台内容...", "正在进行 SEO 优化..."];
    let dotInterval = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    setLoadingText(msgs[0]);
    await delay(600);
    setStep(1); setLoadingText(msgs[1]);
    await delay(500);
    setStep(2); setLoadingText(msgs[2]);

    const fmtInstructions = activeFormats.map((f) => {
      if (f === "official") return "【官网详情页】：300字左右，包含核心吸引力、特色体验、最佳游览时间，语言专业有感染力";
      if (f === "xiaohongshu") return "【小红书种草帖】：200字左右，带emoji，口语化，有标题和话题标签，结尾有互动引导";
      if (f === "video") return "【短视频解说脚本】：分镜头格式，约4-5个镜头，每镜头标注画面描述和配音文字";
      if (f === "seo") return "【SEO分析】：列出5个核心关键词、标题优化建议、内容差异化亮点3条";
      return "";
    }).join("\n\n");

    const prompt = "你是专业旅游内容创作AI，请为目的地\"" + dest + "\"生成内容，目标受众是" + AUDIENCE_MAP[audience] + "，主推" + SEASON_MAP[season] + "出行。" + (customPrompt ? "\n\n额外要求：" + customPrompt : "") + "\n\n每个内容块用\"===内容名称===\" 作为开头，内容名称必须和下面完全一致：\n\n" + fmtInstructions;

    try {
      const res = await fetch(BASE_URL + "/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], max_tokens: 2000 }),
      });
      const data = await res.json();
      const text = data.content ? data.content.filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text || ""; }).join("") : "";
      setStep(3); setLoadingText(msgs[3]);
      await delay(400);

      const sectionMap = { "官网详情页": "official", "小红书种草帖": "xiaohongshu", "短视频解说脚本": "video", "SEO分析": "seo" };
      const parts = text.split(/===([^=]+)===/);
      const parsed = {};
      for (let i = 1; i < parts.length - 1; i += 2) {
        const name = parts[i].trim();
        const content = parts[i + 1].trim();
        const key = sectionMap[name] || name;
        parsed[key] = { label: name, content };
      }
      if (Object.keys(parsed).length === 0) parsed["official"] = { label: "生成结果", content: text };
      setResults(parsed);
      setActiveTab(Object.keys(parsed)[0]);
      setHistory((prev) => [{ id: Date.now(), dest, audience: AUDIENCE_MAP[audience], season: SEASON_MAP[season], results: parsed, time: new Date().toLocaleString("zh-CN") }, ...prev.slice(0, 9)]);
    } catch (e) {
      setResults({ error: { label: "错误", content: "生成失败，请检查 API Key 和网络后重试。" } });
      setActiveTab("error");
    }
    clearInterval(dotInterval);
    setLoadingText(""); setDots("");
    setLoading(false); setStep(-1);
  };

  const getScore = async () => {
    if (Object.keys(results).length === 0) return;
    const lines = Object.entries(results).map(function(entry) { return "【" + entry[1].label + "】\n" + entry[1].content.slice(0, 200); }).join("\n\n");
    const scorePrompt = "请对以下旅游文案逐一评分（满分10分），并给出1条优化建议。\n每个文案用以下格式输出，不要有其他内容：\n文案名称|分数|建议\n\n例如：\n官网详情页|8|建议加入具体价格区间\n\n文案内容：\n" + lines;
    try {
      const r = await fetch(BASE_URL + "/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: 1024, messages: [{ role: "user", content: scorePrompt }] }),
      });
      const d = await r.json();
      const text = d.content ? d.content.filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text || ""; }).join("") : "";
      const scoreMap = {};
      const keyMap = { "官网详情页": "official", "小红书种草帖": "xiaohongshu", "短视频解说脚本": "video", "SEO分析": "seo" };
      text.split("\n").forEach(function(line) {
        const parts = line.split("|");
        if (parts.length >= 3) {
          const key = keyMap[parts[0].trim()] || parts[0].trim();
          scoreMap[key] = { score: parseInt(parts[1]) || 0, tip: parts[2].trim() };
        }
      });
      setScores(scoreMap);
    } catch (e) { console.log("评分错误", e); }
  };

  const batchGenerate = async () => {
    const dests = batchDests.split("\n").map(function(d) { return d.trim(); }).filter(function(d) { return d.length > 0; });
    if (dests.length === 0) return;
    setBatchLoading(true);
    setBatchResults([]);
    setBatchProgress(0);
    for (let i = 0; i < dests.length; i++) {
      const currentDest = dests[i];
      const prompt = "你是专业旅游内容创作AI，请为目的地\"" + currentDest + "\"生成内容，目标受众是" + AUDIENCE_MAP[audience] + "，主推" + SEASON_MAP[season] + "出行。" + (customPrompt ? "\n\n额外要求：" + customPrompt : "") + "\n\n每个内容块用\"===内容名称===\" 作为开头：\n\n【官网详情页】：300字左右，包含核心吸引力、特色体验\n\n【小红书种草帖】：200字左右，带emoji，口语化";
      try {
        const res = await fetch(BASE_URL + "/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": API_KEY, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], max_tokens: 1500 }),
        });
        const data = await res.json();
        const text = data.content ? data.content.filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text || ""; }).join("") : "";
        const sectionMap = { "官网详情页": "official", "小红书种草帖": "xiaohongshu" };
        const parts = text.split(/===([^=]+)===/);
        const parsed = {};
        for (let j = 1; j < parts.length - 1; j += 2) {
          const name = parts[j].trim();
          const content = parts[j + 1].trim();
          const key = sectionMap[name] || name;
          parsed[key] = { label: name, content };
        }
        if (Object.keys(parsed).length === 0) parsed["official"] = { label: "生成结果", content: text };
        setBatchResults(function(prev) { return [...prev, { dest: currentDest, results: parsed, time: new Date().toLocaleString("zh-CN") }]; });
      } catch (e) {
        setBatchResults(function(prev) { return [...prev, { dest: currentDest, results: { error: { label: "错误", content: "生成失败" } }, time: new Date().toLocaleString("zh-CN") }]; });
      }
      setBatchProgress(i + 1);
    }
    setBatchLoading(false);
  };

  const exportBatch = () => {
    if (batchResults.length === 0) return;
    const content = batchResults.map(function(item) {
      return "📍 " + item.dest + "\n" + "=".repeat(40) + "\n\n" + Object.entries(item.results).map(function(entry) { return "【" + entry[1].label + "】\n\n" + entry[1].content; }).join("\n\n" + "-".repeat(30) + "\n\n");
    }).join("\n\n" + "=".repeat(60) + "\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "批量旅游内容.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = () => { if (results[activeTab]) navigator.clipboard.writeText(results[activeTab].content); };

  const exportTxt = () => {
    if (!activeTab || !results[activeTab]) return;
    const content = Object.entries(results).map(function(entry) { return "【" + entry[1].label + "】\n\n" + entry[1].content; }).join("\n\n" + "=".repeat(40) + "\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = dest + "-旅游内容.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportWord = () => {
    if (!results[activeTab]) return;
    const content = Object.entries(results).map(function(entry) { return "<h2>" + entry[1].label + "</h2><p>" + entry[1].content.replace(/\n/g, "</p><p>") + "</p>"; }).join("<hr/>");
    const html = "<html><head><meta charset='utf-8'><title>旅游内容</title></head><body>" + content + "</body></html>";
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = dest + "-旅游内容.doc"; a.click();
    URL.revokeObjectURL(url);
  };

  const steps = ["目的地解析", "画像匹配", "内容生成", "SEO 优化"];

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ fontSize: 22, fontWeight: 500 }}>旅游 AI 内容生成器</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setBatchMode(!batchMode)} style={{ padding: "6px 14px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", background: batchMode ? "#e8f0fe" : "#f5f5f5", color: batchMode ? "#1a73e8" : "#666" }}>
            {batchMode ? "✕ 退出批量" : "⚡ 批量生成"}
          </button>
          <button onClick={() => setShowHistory(!showHistory)} style={{ padding: "6px 14px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", background: showHistory ? "#e8f0fe" : "#f5f5f5", color: showHistory ? "#1a73e8" : "#666" }}>
            📋 历史记录 {history.length > 0 && "(" + history.length + ")"}
          </button>
        </div>
      </div>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>多 Agent 协作 · 自动适配平台格式 · SEO 优化</p>

      <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>目的地</label>
          <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="例如：云南大理、三亚、西藏拉萨..." style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>目标受众</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}>
              <option value="couple">情侣游</option>
              <option value="family">亲子游</option>
              <option value="backpacker">背包客</option>
              <option value="senior">银发游</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>季节</label>
            <select value={season} onChange={(e) => setSeason(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}>
              <option value="spring">春季</option>
              <option value="summer">夏季</option>
              <option value="autumn">秋季</option>
              <option value="winter">冬季</option>
              <option value="any">全年皆宜</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>自定义风格要求（选填）</label>
          <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="例如：语气活泼，多用网络用语；重点突出美食；文风古典一点..." rows={2} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, resize: "vertical", fontFamily: "sans-serif", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>输出格式（可多选）</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(FORMATS).map(([key, label]) => (
              <button key={key} onClick={() => toggleFormat(key)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid", fontSize: 13, cursor: "pointer", backgroundColor: activeFormats.includes(key) ? "#e8f0fe" : "#f5f5f5", color: activeFormats.includes(key) ? "#1a73e8" : "#666", borderColor: activeFormats.includes(key) ? "#1a73e8" : "#ddd" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={loading} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", backgroundColor: loading ? "#f5f5f5" : "#fff", color: loading ? "#aaa" : "#333" }}>
          {loading ? loadingText + dots : "✨ 开始生成内容"}
        </button>
      </div>

      {step >= 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, backgroundColor: step === i ? "#e8f0fe" : step > i ? "#e6f4ea" : "#f5f5f5", color: step === i ? "#1a73e8" : step > i ? "#137333" : "#aaa", border: "1px solid", borderColor: step === i ? "#1a73e8" : step > i ? "#137333" : "#e5e5e5" }}>
                {s}
              </div>
              {i < steps.length - 1 && <span style={{ color: "#ccc", fontSize: 12 }}>›</span>}
            </div>
          ))}
        </div>
      )}

      {Object.keys(results).length > 0 && (
        <div>
          <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5" }}>
            {Object.keys(results).map((key) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{ padding: "8px 16px", fontSize: 13, cursor: "pointer", background: "none", border: "none", borderBottom: activeTab === key ? "2px solid #1a73e8" : "2px solid transparent", color: activeTab === key ? "#1a73e8" : "#666", fontFamily: "sans-serif" }}>
                {results[key].label}
              </button>
            ))}
          </div>
          <div style={{ border: "1px solid #e5e5e5", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 20 }}>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginBottom: 8 }}>
              <button onClick={copyText} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#f5f5f5" }}>复制</button>
              <button onClick={exportTxt} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#f5f5f5" }}>导出 TXT</button>
              <button onClick={exportWord} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#f5f5f5" }}>导出 Word</button>
              <button onClick={getScore} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#e8f0fe", color: "#1a73e8" }}>✨ AI 评分</button>
            </div>
            <pre style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#333", margin: 0 }}>
              {results[activeTab] && results[activeTab].content}
            </pre>
            {scores[activeTab] && (
              <div style={{ marginTop: 16, padding: 12, background: "#f8f9fa", borderRadius: 8, border: "1px solid #e5e5e5" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#666" }}>AI 评分</span>
                  <span style={{ fontSize: 22, fontWeight: 500, color: scores[activeTab].score >= 8 ? "#137333" : scores[activeTab].score >= 6 ? "#b45309" : "#c0392b" }}>{scores[activeTab].score}</span>
                  <span style={{ fontSize: 13, color: "#aaa" }}>/10</span>
                </div>
                <div style={{ fontSize: 13, color: "#555" }}>💡 优化建议：{scores[activeTab].tip}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {batchMode && (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 20, marginBottom: 16, marginTop: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>⚡ 批量生成</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>输入多个目的地（每行一个）</label>
            <textarea value={batchDests} onChange={(e) => setBatchDests(e.target.value)} placeholder={"云南大理\n三亚\n西藏拉萨\n杭州西湖"} rows={5} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, resize: "vertical", fontFamily: "sans-serif", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={batchGenerate} disabled={batchLoading} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 14, fontWeight: 500, cursor: batchLoading ? "not-allowed" : "pointer", background: batchLoading ? "#f5f5f5" : "#fff", color: batchLoading ? "#aaa" : "#333" }}>
              {batchLoading ? "生成中 " + batchProgress + "/" + batchDests.split("\n").filter(function(d) { return d.trim(); }).length + "..." : "⚡ 开始批量生成"}
            </button>
            {batchResults.length > 0 && (
              <button onClick={exportBatch} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, cursor: "pointer", background: "#f5f5f5" }}>导出全部</button>
            )}
          </div>
          {batchResults.length > 0 && (
            <div>
              {batchResults.map(function(item, idx) {
                return (
                  <div key={idx} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontWeight: 500 }}>📍 {item.dest}</span>
                      <button onClick={() => { setResults(item.results); setActiveTab(Object.keys(item.results)[0]); setBatchMode(false); }} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#e8f0fe", color: "#1a73e8" }}>查看详情</button>
                    </div>
                    <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                      {Object.values(item.results)[0] && Object.values(item.results)[0].content.slice(0, 80) + "..."}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showHistory && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: "#333" }}>生成历史</h3>
          {history.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 13 }}>暂无历史记录</p>
          ) : (
            history.map((item) => (
              <div key={item.id} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 14, marginBottom: 10, cursor: "pointer" }}
                onClick={() => { setResults(item.results); setActiveTab(Object.keys(item.results)[0]); setShowHistory(false); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>📍 {item.dest}</span>
                  <span style={{ fontSize: 12, color: "#aaa" }}>{item.time}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#888" }}>{item.audience} · {item.season} · {Object.keys(item.results).length} 个格式</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}