import { useState } from "react";

const TYPE_LABELS = { brand_style: "品牌风格", destination: "目的地", template: "模板", feedback: "学习反馈" };
const TYPE_COLORS = {
  brand_style: { bg: "#e8f0fe", color: "#1a73e8" },
  destination: { bg: "#e6f4ea", color: "#137333" },
  template: { bg: "#fef7e0", color: "#b45309" },
  feedback: { bg: "#f3e8fd", color: "#7c3aed" },
};

export default function KnowledgeHits({ knowledgeHits, visible }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!visible || !knowledgeHits || knowledgeHits.length === 0) return null;

  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: 12, marginBottom: 16, background: "#f8f9fa" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: collapsed ? 0 : 8 }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>
          📚 本次生成参考了 {knowledgeHits.length} 条知识库条目
          <span style={{ marginLeft: 4, fontSize: 11, color: "#aaa" }}>{collapsed ? "▶ 展开" : "▼ 折叠"}</span>
        </span>
      </div>
      {!collapsed && knowledgeHits.map((entry) => {
        const tc = TYPE_COLORS[entry.type] || TYPE_COLORS.feedback;
        return (
          <div key={entry.id} style={{ padding: "6px 10px", borderRadius: 6, marginBottom: 4, background: "#fff", border: "1px solid #e5e5e5" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 10, background: tc.bg, color: tc.color }}>{TYPE_LABELS[entry.type] || entry.type}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{entry.title}</span>
              <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>使用 {entry.usageCount} 次</span>
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {entry.content.length > 60 ? entry.content.slice(0, 60) + "..." : entry.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
