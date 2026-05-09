import useTravelAI from "./hooks/useTravelAI";
import InputPanel from "./components/InputPanel";
import StepIndicator from "./components/StepIndicator";
import LivePreview from "./components/LivePreview";
import OutputPanel from "./components/OutputPanel";
import KnowledgeHits from "./components/KnowledgeHits";
import BatchPanel from "./components/BatchPanel";
import HistoryPanel from "./components/HistoryPanel";
import KnowledgePanel from "./components/KnowledgePanel";
import BenchmarkPanel from "./components/BenchmarkPanel";
import WorkflowPanel from "./components/WorkflowPanel";

export default function App() {
  const ai = useTravelAI();

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ fontSize: 22, fontWeight: 500 }}>旅游 AI 内容生成器</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => ai.setBatchMode(!ai.batchMode)} style={{
            padding: "6px 14px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, cursor: "pointer",
            background: ai.batchMode ? "#e8f0fe" : "#f5f5f5",
            color: ai.batchMode ? "#1a73e8" : "#666",
          }}>
            {ai.batchMode ? "✕ 退出批量" : "⚡ 批量生成"}
          </button>
          <button onClick={() => ai.setShowHistory(!ai.showHistory)} style={{
            padding: "6px 14px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, cursor: "pointer",
            background: ai.showHistory ? "#e8f0fe" : "#f5f5f5",
            color: ai.showHistory ? "#1a73e8" : "#666",
          }}>
            📋 历史记录{ai.history.length > 0 && " (" + ai.history.length + ")"}
          </button>
          <button onClick={() => ai.setShowKnowledge(!ai.showKnowledge)} style={{
            padding: "6px 14px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, cursor: "pointer",
            background: ai.showKnowledge ? "#e8f0fe" : "#f5f5f5",
            color: ai.showKnowledge ? "#1a73e8" : "#666",
          }}>
            📚 知识库{ai.knowledgeEntries.length > 0 && " (" + ai.knowledgeEntries.length + ")"}
          </button>
          <button onClick={() => ai.setShowBenchmark(!ai.showBenchmark)} style={{
            padding: "6px 14px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, cursor: "pointer",
            background: ai.showBenchmark ? "#e8f0fe" : "#f5f5f5",
            color: ai.showBenchmark ? "#1a73e8" : "#666",
          }}>
            🔥 爆款对标
          </button>
          <button onClick={() => ai.setShowWorkflow(!ai.showWorkflow)} style={{
            padding: "6px 14px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, cursor: "pointer",
            background: ai.showWorkflow ? "#e8f0fe" : "#f5f5f5",
            color: ai.showWorkflow ? "#1a73e8" : "#666",
          }}>
            ⚙️ 工作流
          </button>
        </div>
      </div>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>多 Agent 协作 · 自动适配平台格式 · SEO 优化</p>

      <InputPanel
        dest={ai.dest} onDestChange={ai.setDest}
        audience={ai.audience} onAudienceChange={ai.setAudience}
        season={ai.season} onSeasonChange={ai.setSeason}
        customPrompt={ai.customPrompt} onCustomPromptChange={ai.setCustomPrompt}
        activeFormats={ai.activeFormats} onToggleFormat={ai.toggleFormat}
        loading={ai.loading} loadingText={ai.loadingText} dots={ai.dots}
        onGenerate={ai.generate}
      />

      <StepIndicator step={ai.step} steps={ai.steps} />

      <LivePreview
        liveOutput={ai.liveOutput}
        agentName={ai.agentName}
        visible={ai.loading}
      />

      <OutputPanel
        results={ai.results} activeTab={ai.activeTab} onTabChange={ai.setActiveTab}
        scores={ai.scores} onScore={ai.getScore}
        onCopy={ai.copyText} onExportTxt={ai.exportTxt} onExportWord={ai.exportWord}
      />

      <KnowledgeHits
        knowledgeHits={ai.knowledgeHits}
        visible={!ai.loading && ai.knowledgeHits.length > 0}
      />

      <BatchPanel
        batchMode={ai.batchMode}
        batchDests={ai.batchDests} onBatchDestsChange={ai.setBatchDests}
        batchLoading={ai.batchLoading} batchProgress={ai.batchProgress}
        totalBatch={ai.batchDests.split("\n").filter(Boolean).length}
        onBatchGenerate={ai.batchGenerate}
        batchResults={ai.batchResults} onLoadBatch={ai.loadFromBatch}
        onExportAll={ai.exportAllBatch}
      />

      <HistoryPanel
        history={ai.history} showHistory={ai.showHistory}
        onLoad={ai.loadFromHistory}
      />

      <KnowledgePanel
        showKnowledge={ai.showKnowledge}
        knowledgeEntries={ai.knowledgeEntries}
        onAdd={ai.addKnowledgeEntry}
        onUpdate={ai.updateKnowledgeEntry}
        onDelete={ai.deleteKnowledgeEntry}
        onClose={() => ai.setShowKnowledge(false)}
      />

      <BenchmarkPanel
        showBenchmark={ai.showBenchmark}
        benchmarks={ai.benchmarks}
        onAnalyze={ai.analyzeBenchmarkItem}
        onImport={ai.importBenchmark}
        onDelete={ai.deleteBenchmark}
        onClose={() => ai.setShowBenchmark(false)}
      />

      <WorkflowPanel
        showWorkflow={ai.showWorkflow}
        workflowConfig={ai.workflowConfig}
        onWorkflowChange={ai.updateWorkflow}
        onReset={ai.resetWorkflow}
        onClose={() => ai.setShowWorkflow(false)}
      />
    </div>
  );
}
