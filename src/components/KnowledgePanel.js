import { useState } from "react";

const TYPE_LABELS = { brand_style: "品牌风格", destination: "目的地", template: "模板", feedback: "学习反馈" };
const TYPE_COLORS = {
  brand_style: { bg: "#e8f0fe", color: "#1a73e8", border: "#1a73e8" },
  destination: { bg: "#e6f4ea", color: "#137333", border: "#137333" },
  template: { bg: "#fef7e0", color: "#b45309", border: "#b45309" },
  feedback: { bg: "#f3e8fd", color: "#7c3aed", border: "#7c3aed" },
};

export default function KnowledgePanel({ showKnowledge, knowledgeEntries, onAdd, onUpdate, onDelete, onClose }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ type: "brand_style", category: "", title: "", content: "", tags: "" });

  if (!showKnowledge) return null;

  const resetForm = () => { setForm({ type: "brand_style", category: "", title: "", content: "", tags: "" }); setEditId(null); setShowForm(false); };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editId) {
      onUpdate(editId, { ...form, tags: form.tags.split(/[,，、\s]+/).filter(Boolean) });
    } else {
      onAdd({ ...form, tags: form.tags.split(/[,，、\s]+/).filter(Boolean) });
    }
    resetForm();
  };

  const handleEdit = (entry) => {
    setForm({ type: entry.type, category: entry.category, title: entry.title, content: entry.content, tags: entry.tags.join(", ") });
    setEditId(entry.id);
    setShowForm(true);
  };

  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 20, marginBottom: 16, marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>📚 知识库管理</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={btnStyle("#e8f0fe", "#1a73e8")}>+ 添加条目</button>
          <button onClick={onClose} style={btnStyle("#f5f5f5", "#666")}>关闭</button>
        </div>
      </div>

      {showForm && (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 14, marginBottom: 12, background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>类型</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>分类</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="如：tone, structure, keywords" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>标题</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="知识条目标题" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>内容</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value.slice(0, 500) })} placeholder="知识内容（最多500字）" rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "sans-serif" }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>标签（逗号分隔）</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="如：品牌, 专业, 温馨" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} style={btnStyle("#e8f0fe", "#1a73e8")}>{editId ? "保存修改" : "添加"}</button>
            <button onClick={resetForm} style={btnStyle("#f5f5f5", "#666")}>取消</button>
          </div>
        </div>
      )}

      {knowledgeEntries.length === 0 ? (
        <p style={{ color: "#aaa", fontSize: 13 }}>暂无知识条目，点击"添加条目"开始构建知识库</p>
      ) : (
        knowledgeEntries.map((entry) => {
          const tc = TYPE_COLORS[entry.type] || TYPE_COLORS.feedback;
          return (
            <div key={entry.id} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, background: tc.bg, color: tc.color, border: "1px solid " + tc.border, marginRight: 8 }}>
                    {TYPE_LABELS[entry.type] || entry.type}
                  </span>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{entry.title}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => handleEdit(entry)} style={smallBtnStyle}>编辑</button>
                  <button onClick={() => onDelete(entry.id)} style={{ ...smallBtnStyle, color: "#c0392b" }}>删除</button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 6, lineHeight: 1.5 }}>
                {entry.content.length > 80 ? entry.content.slice(0, 80) + "..." : entry.content}
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                {entry.tags.map((tag) => (
                  <span key={tag} style={{ padding: "1px 6px", borderRadius: 4, fontSize: 11, background: "#f5f5f5", color: "#888", border: "1px solid #e5e5e5" }}>{tag}</span>
                ))}
                <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>使用 {entry.usageCount} 次</span>
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
