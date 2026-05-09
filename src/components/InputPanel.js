import { FORMATS } from "../config";

export default function InputPanel({ dest, onDestChange, audience, onAudienceChange, season, onSeasonChange, customPrompt, onCustomPromptChange, activeFormats, onToggleFormat, loading, loadingText, dots, onGenerate }) {
  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>目的地</label>
        <input value={dest} onChange={(e) => onDestChange(e.target.value)} placeholder="例如：云南大理、三亚、西藏拉萨..." style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>目标受众</label>
          <select value={audience} onChange={(e) => onAudienceChange(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}>
            <option value="couple">情侣游</option>
            <option value="family">亲子游</option>
            <option value="backpacker">背包客</option>
            <option value="senior">银发游</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>季节</label>
          <select value={season} onChange={(e) => onSeasonChange(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}>
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
        <textarea value={customPrompt} onChange={(e) => onCustomPromptChange(e.target.value)} placeholder="例如：语气活泼，多用网络用语；重点突出美食；文风古典一点..." rows={2} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, resize: "vertical", fontFamily: "sans-serif", boxSizing: "border-box" }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>输出格式（可多选）</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(FORMATS).map(([key, label]) => (
            <button key={key} onClick={() => onToggleFormat(key)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid", fontSize: 13, cursor: "pointer", backgroundColor: activeFormats.includes(key) ? "#e8f0fe" : "#f5f5f5", color: activeFormats.includes(key) ? "#1a73e8" : "#666", borderColor: activeFormats.includes(key) ? "#1a73e8" : "#ddd" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onGenerate} disabled={loading} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", backgroundColor: loading ? "#f5f5f5" : "#fff", color: loading ? "#aaa" : "#333" }}>
        {loading ? loadingText + dots : "✨ 开始生成内容"}
      </button>
    </div>
  );
}
