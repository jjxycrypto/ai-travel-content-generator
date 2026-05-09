export default function HistoryPanel({ history, showHistory, onLoad }) {
  if (!showHistory) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: "#333" }}>生成历史</h3>
      {history.length === 0 ? (
        <p style={{ color: "#aaa", fontSize: 13 }}>暂无历史记录</p>
      ) : (
        history.map((item) => (
          <div key={item.id} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 14, marginBottom: 10, cursor: "pointer" }} onClick={() => onLoad(item)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>📍 {item.dest}</span>
              <span style={{ fontSize: 12, color: "#aaa" }}>{item.time}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#888" }}>{item.audience} · {item.season} · {Object.keys(item.results).length} 个格式</div>
          </div>
        ))
      )}
    </div>
  );
}
