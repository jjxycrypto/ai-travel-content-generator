import { useRef, useEffect, useState } from "react";

export default function LivePreview({ liveOutput, agentName, visible }) {
  const preRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [liveOutput]);

  if (!visible) return null;

  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 16, background: "#fafafa" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: collapsed ? 0 : 8 }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "#1a73e8" }}>
          {agentName} 实时输出
          <span style={{ marginLeft: 4, fontSize: 11, color: "#aaa" }}>{collapsed ? "▶ 展开" : "▼ 折叠"}</span>
        </span>
        <span style={{ fontSize: 11, color: "#aaa" }}>{liveOutput.length} 字</span>
      </div>
      {!collapsed && (
        <pre
          ref={preRef}
          style={{
            fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all",
            color: "#555", margin: 0, maxHeight: 240, overflowY: "auto",
            fontFamily: "monospace",
          }}
        >
          {liveOutput || "等待响应..."}
        </pre>
      )}
    </div>
  );
}
