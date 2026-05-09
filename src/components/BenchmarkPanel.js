import { useState } from "react";

const PLATFORM_LABELS = { official: "官网详情页", xiaohongshu: "小红书", video: "短视频", seo: "SEO" };
const PLATFORM_COLORS = {
  official: { bg: "#e8f0fe", color: "#1a73e8" },
  xiaohongshu: { bg: "#fce4ec", color: "#c62828" },
  video: { bg: "#e8f5e9", color: "#2e7d32" },
  seo: { bg: "#fff3e0", color: "#e65100" },
};

export default function BenchmarkPanel({ showBenchmark, benchmarks, onAnalyze, onImport, onDelete, onClose }) {
  const [showImport, setShowImport] = useState(false);
  const [importForm, setImportForm] = useState({ platform: "official", title: "", content: "" });
  const [analyzing, setAnalyzing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  if (!showBenchmark) return null;

  const handleImport = () => {
    if (!importForm.content.trim()) return;
    onImport(importForm);
    setImportForm({ platform: "official", title: "", content: "" });
    setShowImport(false);
  };

  const handleAnalyze = async (id, content, platform) => {
    setAnalyzing(id);
    try {
      await onAnalyze(id, content, platform);
    } catch (err) {
      alert("AI分析失败: " + (err.message || "请检查网络"));
    }
    setAnalyzing(null);
  };

  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 20, marginBottom: 16, marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>🔥 爆款对标学习</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowImport(!showImport)} style={btnStyle("#e8f0fe", "#1a73e8")}>+ 导入爆款</button>
          <button onClick={onClose} style={btnStyle("#f5f5f5", "#666")}>关闭</button>
        </div>
      </div>

      {showImport && (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 14, marginBottom: 12, background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>平台</label>
              <select value={importForm.platform} onChange={(e) => setImportForm({ ...importForm, platform: e.target.value })} style={inputStyle}>
                {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>标题（选填）</label>
              <input value={importForm.title} onChange={(e) => setImportForm({ ...importForm, title: e.target.value })} placeholder="爆款内容标题" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>爆款内容原文</label>
            <textarea value={importForm.content} onChange={(e) => setImportForm({ ...importForm, content: e.target.value })} placeholder="粘贴你看到的爆款内容..." rows={5} style={{ ...inputStyle, resize: "vertical", fontFamily: "sans-serif" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleImport} style={btnStyle("#e8f0fe", "#1a73e8")}>导入并分析</button>
            <button onClick={() => setShowImport(false)} style={btnStyle("#f5f5f5", "#666")}>取消</button>
          </div>
        </div>
      )}

      {benchmarks.length === 0 ? (
        <p style={{ color: "#aaa", fontSize: 13 }}>暂无爆款内容，点击"导入爆款"开始对标学习</p>
      ) : (
        benchmarks.map((b) => {
          const pc = PLATFORM_COLORS[b.platform] || PLATFORM_COLORS.official;
          const isExpanded = expandedId === b.id;
          const isAnalyzing = analyzing === b.id;
          return (
            <div key={b.id} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, background: pc.bg, color: pc.color, marginRight: 8 }}>
                    {PLATFORM_LABELS[b.platform] || b.platform}
                  </span>
                  <span style={{ fontWeight: 500, fontSize: 14, cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : b.id)}>
                    {b.title}
                  </span>
                  {!b.analysis && <span style={{ fontSize: 11, color: "#e65100", marginLeft: 8 }}>未分析</span>}
                  {b.analysis && <span style={{ fontSize: 11, color: "#2e7d32", marginLeft: 8 }}>已分析</span>}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => handleAnalyze(b.id, b.content, b.platform)} disabled={isAnalyzing} style={{ ...smallBtnStyle, color: "#1a73e8" }}>
                    {isAnalyzing ? "分析中..." : "AI分析"}
                  </button>
                  {b.source === "user" && (
                    <button onClick={() => onDelete(b.id)} style={{ ...smallBtnStyle, color: "#c0392b" }}>删除</button>
                  )}
                </div>
              </div>

              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5, cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : b.id)}>
                {isExpanded ? b.content : (b.content.length > 100 ? b.content.slice(0, 100) + "..." : b.content)}
              </div>

              {b.analysis && (
                <div style={{ marginTop: 8, padding: 10, background: "#f8f9fa", borderRadius: 8, fontSize: 12, color: "#444", lineHeight: 1.6 }}>
                  <div><strong>吸引力：</strong>{b.analysis.hook}</div>
                  <div><strong>结构：</strong>{b.analysis.structure}</div>
                  <div><strong>差异化：</strong>{b.analysis.uniqueAngle}</div>
                  <div><strong>情感词：</strong>{(b.analysis.emotionalWords || []).join("、")}</div>
                  <div><strong>关键词：</strong>{(b.analysis.keywords || []).join("、")}</div>
                  <div><strong>成功秘诀：</strong>{b.analysis.summary}</div>
                  {b.analysis.score && <div><strong>评分：</strong><span style={{ color: b.analysis.score >= 8 ? "#2e7d32" : "#e65100", fontWeight: 500 }}>{b.analysis.score}/10</span></div>}
                </div>
              )}

              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                {b.tags.map((tag) => (
                  <span key={tag} style={{ padding: "1px 6px", borderRadius: 4, fontSize: 10, background: "#f5f5f5", color: "#888" }}>{tag}</span>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

const labelStyle = { fontSize: 12, color: "#888", display: "block", marginBottom: 4 };
const inputStyle = { width: "100%", padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" };
const btnStyle = (bg, color) => ({ padding: "6px 14px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", background: bg, color });
const smallBtnStyle = { padding: "2px 8px", fontSize: 11, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#f5f5f5" };
