export default function BatchPanel({ batchDests, onBatchDestsChange, batchLoading, batchProgress, totalBatch, onBatchGenerate, batchResults, onLoadBatch, onExportAll, batchMode }) {
  if (!batchMode) return null;

  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 20, marginBottom: 16, marginTop: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>⚡ 批量生成</h3>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>输入多个目的地（每行一个）</label>
        <textarea value={batchDests} onChange={(e) => onBatchDestsChange(e.target.value)} placeholder={"云南大理\n三亚\n西藏拉萨\n杭州西湖"} rows={5} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, resize: "vertical", fontFamily: "sans-serif", boxSizing: "border-box" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={onBatchGenerate} disabled={batchLoading} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 14, fontWeight: 500, cursor: batchLoading ? "not-allowed" : "pointer", background: batchLoading ? "#f5f5f5" : "#fff", color: batchLoading ? "#aaa" : "#333" }}>
          {batchLoading ? "生成中 " + batchProgress + "/" + totalBatch + "..." : "⚡ 开始批量生成"}
        </button>
        {batchResults.length > 0 && (
          <button onClick={onExportAll} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, cursor: "pointer", background: "#f5f5f5" }}>导出全部</button>
        )}
      </div>
      {batchResults.length > 0 && (
        <div>
          {batchResults.map((item, idx) => (
            <div key={idx} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>📍 {item.dest}</span>
                <button onClick={() => onLoadBatch(item)} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#e8f0fe", color: "#1a73e8" }}>查看详情</button>
              </div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                {Object.values(item.results)[0] && Object.values(item.results)[0].content.slice(0, 80) + "..."}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
