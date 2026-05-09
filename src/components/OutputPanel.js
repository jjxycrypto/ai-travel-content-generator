import ScoreCard from "./ScoreCard";

export default function OutputPanel({ results, activeTab, onTabChange, scores, onScore, onCopy, onExportTxt, onExportWord }) {
  const keys = Object.keys(results);
  if (keys.length === 0) return null;

  return (
    <div>
      <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5" }}>
        {keys.map((key) => (
          <button key={key} onClick={() => onTabChange(key)} style={{
            padding: "8px 16px", fontSize: 13, cursor: "pointer", background: "none", border: "none",
            borderBottom: activeTab === key ? "2px solid #1a73e8" : "2px solid transparent",
            color: activeTab === key ? "#1a73e8" : "#666", fontFamily: "sans-serif",
          }}>
            {results[key].label}
          </button>
        ))}
      </div>
      <div style={{ border: "1px solid #e5e5e5", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 20 }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginBottom: 8 }}>
          <ActionButton onClick={onCopy}>复制</ActionButton>
          <ActionButton onClick={onExportTxt}>导出 TXT</ActionButton>
          <ActionButton onClick={onExportWord}>导出 Word</ActionButton>
          <button onClick={onScore} style={{
            padding: "4px 10px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6,
            cursor: "pointer", background: "#e8f0fe", color: "#1a73e8",
          }}>
            ✨ AI 评分
          </button>
        </div>
        <pre style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#333", margin: 0 }}>
          {results[activeTab] && results[activeTab].content}
        </pre>
        {scores[activeTab] && <ScoreCard score={scores[activeTab]} />}
      </div>
    </div>
  );
}

function ActionButton({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 10px", fontSize: 12, border: "1px solid #ddd",
      borderRadius: 6, cursor: "pointer", background: "#f5f5f5",
    }}>
      {children}
    </button>
  );
}
