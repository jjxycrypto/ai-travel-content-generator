import { useState } from "react";

export default function WorkflowPanel({ showWorkflow, workflowConfig, onWorkflowChange, onReset, onClose }) {
  const [expandedId, setExpandedId] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", systemPrompt: "", maxTokens: 1500 });

  if (!showWorkflow) return null;

  const agents = workflowConfig.agents || [];

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (dropIdx) => {
    if (dragIdx === null || dragIdx === dropIdx) return;
    const next = [...agents];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(dropIdx, 0, moved);
    setDragIdx(null);
    onWorkflowChange({ ...workflowConfig, agents: next });
  };
  const handleDragEnd = () => setDragIdx(null);

  const toggleEnabled = (id) => {
    const next = agents.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a);
    onWorkflowChange({ ...workflowConfig, agents: next });
  };

  const updateAgent = (id, updates) => {
    const next = agents.map((a) => a.id === id ? { ...a, ...updates } : a);
    onWorkflowChange({ ...workflowConfig, agents: next });
  };

  const deleteAgent = (id) => {
    const next = agents.filter((a) => a.id !== id);
    onWorkflowChange({ ...workflowConfig, agents: next });
  };

  const addAgent = () => {
    if (!newAgent.name.trim()) return;
    const agent = {
      id: "custom-" + Date.now() + "-" + String(Math.random()).slice(2, 8),
      name: newAgent.name.trim(),
      enabled: true,
      systemPrompt: newAgent.systemPrompt || "你是一个旅游内容助手。",
      maxTokens: newAgent.maxTokens || 1500,
      readFields: [],
      writeField: null,
      parseType: "sections",
      isCustom: true,
    };
    onWorkflowChange({ ...workflowConfig, agents: [...agents, agent] });
    setNewAgent({ name: "", systemPrompt: "", maxTokens: 1500 });
    setShowAdd(false);
  };

  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 20, marginBottom: 16, marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>⚙️ 工作流配置</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onReset} style={btnStyle("#fff3e0", "#e65100")}>重置默认</button>
          <button onClick={onClose} style={btnStyle("#f5f5f5", "#666")}>关闭</button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
        拖拽调整Agent顺序 · 点击名称展开编辑参数 · 开关控制启用/禁用
      </p>

      {agents.map((agent, idx) => {
        const isExpanded = expandedId === agent.id;
        const isDragging = dragIdx === idx;
        return (
          <div
            key={agent.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            style={{
              border: "1px solid " + (isDragging ? "#1a73e8" : "#e5e5e5"),
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
              background: agent.enabled ? "#fff" : "#fafafa",
              opacity: agent.enabled ? 1 : 0.6,
              cursor: "grab",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, color: "#aaa", cursor: "grab", userSelect: "none" }} title="拖拽排序">⠿</span>
              <span style={{ fontSize: 11, color: "#aaa", minWidth: 20 }}>#{idx + 1}</span>

              <button
                onClick={() => toggleEnabled(agent.id)}
                style={{
                  padding: "2px 8px", fontSize: 11, borderRadius: 4, border: "1px solid #ddd", cursor: "pointer",
                  background: agent.enabled ? "#e8f5e9" : "#f5f5f5",
                  color: agent.enabled ? "#2e7d32" : "#999",
                }}
              >
                {agent.enabled ? "启用" : "禁用"}
              </button>

              <span
                style={{ fontWeight: 500, fontSize: 14, cursor: "pointer", flex: 1 }}
                onClick={() => setExpandedId(isExpanded ? null : agent.id)}
              >
                {agent.name}
              </span>

              {agent.isCustom && (
                <button onClick={() => deleteAgent(agent.id)} style={{ ...smallBtnStyle, color: "#c0392b" }}>删除</button>
              )}

              <span style={{ fontSize: 11, color: "#aaa" }}>{agent.maxTokens}tok</span>
              <span
                style={{ fontSize: 12, color: "#aaa", cursor: "pointer" }}
                onClick={() => setExpandedId(isExpanded ? null : agent.id)}
              >
                {isExpanded ? "▲" : "▼"}
              </span>
            </div>

            {isExpanded && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0f0f0" }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>名称</label>
                  <input
                    value={agent.name}
                    onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>System Prompt</label>
                  <textarea
                    value={agent.systemPrompt}
                    onChange={(e) => updateAgent(agent.id, { systemPrompt: e.target.value })}
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Max Tokens</label>
                    <input
                      type="number"
                      value={agent.maxTokens}
                      onChange={(e) => updateAgent(agent.id, { maxTokens: parseInt(e.target.value) || 1500 })}
                      min={100}
                      max={8000}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>解析方式</label>
                    <select
                      value={agent.parseType}
                      onChange={(e) => updateAgent(agent.id, { parseType: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="json">JSON</option>
                      <option value="sections">===分段===</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {!showAdd ? (
        <button onClick={() => setShowAdd(true)} style={{ ...btnStyle("#e8f0fe", "#1a73e8"), width: "100%", marginTop: 4 }}>
          + 添加自定义Agent
        </button>
      ) : (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 14, marginTop: 8, background: "#fafafa" }}>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Agent名称</label>
            <input
              value={newAgent.name}
              onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
              placeholder="如：竞品分析"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>System Prompt</label>
            <textarea
              value={newAgent.systemPrompt}
              onChange={(e) => setNewAgent({ ...newAgent, systemPrompt: e.target.value })}
              placeholder="定义这个Agent的角色和任务..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Max Tokens</label>
            <input
              type="number"
              value={newAgent.maxTokens}
              onChange={(e) => setNewAgent({ ...newAgent, maxTokens: parseInt(e.target.value) || 1500 })}
              min={100}
              max={8000}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addAgent} style={btnStyle("#e8f0fe", "#1a73e8")}>添加</button>
            <button onClick={() => setShowAdd(false)} style={btnStyle("#f5f5f5", "#666")}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: 12, color: "#888", display: "block", marginBottom: 4 };
const inputStyle = { width: "100%", padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" };
const btnStyle = (bg, color) => ({ padding: "6px 14px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", background: bg, color });
const smallBtnStyle = { padding: "2px 8px", fontSize: 11, border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#f5f5f5" };
