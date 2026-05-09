export default function ScoreCard({ score }) {
  const color = score.score >= 8 ? "#137333" : score.score >= 6 ? "#b45309" : "#c0392b";
  return (
    <div style={{ marginTop: 16, padding: 12, background: "#f8f9fa", borderRadius: 8, border: "1px solid #e5e5e5" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "#666" }}>AI 评分</span>
        <span style={{ fontSize: 22, fontWeight: 500, color }}>{score.score}</span>
        <span style={{ fontSize: 13, color: "#aaa" }}>/10</span>
      </div>
      <div style={{ fontSize: 13, color: "#555" }}>💡 优化建议：{score.tip}</div>
    </div>
  );
}
