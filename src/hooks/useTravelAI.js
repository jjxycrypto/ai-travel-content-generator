import { useState, useCallback, useRef, useEffect } from "react";
import { getScore as fetchScore, batchGenerateItem } from "../api";
import { runPipeline } from "../agents";
import { copyText as doCopy, exportTxt as doExportTxt, exportWord as doExportWord, exportBatch as doExportBatch } from "../utils/export";
import { loadKnowledge, saveKnowledge, extractKeywords, retrieveKnowledge, learnFromContent, createEntry, addEntry, updateEntry, deleteEntry } from "../utils/knowledge";
import { loadAllBenchmarks, addUserBenchmark, deleteUserBenchmark, updateBenchmarkAnalysis, analyzeBenchmark, retrieveBenchmarks, formatBenchmarkContext } from "../utils/benchmark";
import { loadActiveWorkflow, saveActiveWorkflow, getDefaultWorkflow } from "../utils/workflow";
import { AUDIENCE_MAP, SEASON_MAP } from "../config";

const HISTORY_KEY = "travel-ai-history";
const HISTORY_MAX = 20;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function useTravelAI() {
  const [dest, setDest] = useState("");
  const [audience, setAudience] = useState("couple");
  const [season, setSeason] = useState("spring");
  const [customPrompt, setCustomPrompt] = useState("");
  const [activeFormats, setActiveFormats] = useState(["official", "xiaohongshu", "video"]);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(-1);
  const [loadingText, setLoadingText] = useState("");
  const [dots, setDots] = useState("");
  const dotRef = useRef(null);

  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState("");
  const [scores, setScores] = useState({});

  const [history, setHistory] = useState(loadHistory);
  const [showHistory, setShowHistory] = useState(false);

  // Persist history to localStorage
  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* quota exceeded */ }
  }, [history]);

  const [batchMode, setBatchMode] = useState(false);
  const [batchDests, setBatchDests] = useState("");
  const [batchResults, setBatchResults] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Multi-agent pipeline state
  const [agentStep, setAgentStep] = useState(-1);
  const [agentName, setAgentName] = useState("");
  const [liveOutput, setLiveOutput] = useState("");
  const [agentOutputs, setAgentOutputs] = useState([]);

  // Knowledge base state
  const [knowledgeEntries, setKnowledgeEntries] = useState(loadKnowledge);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [knowledgeHits, setKnowledgeHits] = useState([]);

  // Persist knowledge to localStorage
  useEffect(() => {
    try { saveKnowledge(knowledgeEntries); } catch { /* quota exceeded */ }
  }, [knowledgeEntries]);

  // Benchmark state
  const [benchmarks, setBenchmarks] = useState(loadAllBenchmarks);
  const [showBenchmark, setShowBenchmark] = useState(false);

  // Workflow config state
  const [workflowConfig, setWorkflowConfig] = useState(loadActiveWorkflow);
  const [showWorkflow, setShowWorkflow] = useState(false);

  const updateWorkflow = useCallback((next) => {
    setWorkflowConfig(next);
    saveActiveWorkflow(next);
  }, []);

  const resetWorkflow = useCallback(() => {
    const def = getDefaultWorkflow();
    setWorkflowConfig(def);
    saveActiveWorkflow(def);
  }, []);

  const refreshBenchmarks = useCallback(() => setBenchmarks(loadAllBenchmarks()), []);

  const importBenchmark = useCallback((entry) => {
    addUserBenchmark(entry);
    refreshBenchmarks();
  }, [refreshBenchmarks]);

  const deleteBenchmark = useCallback((id) => {
    deleteUserBenchmark(id);
    refreshBenchmarks();
  }, [refreshBenchmarks]);

  const analyzeBenchmarkItem = useCallback(async (id, content, platform) => {
    const analysis = await analyzeBenchmark(content, platform);
    if (analysis) {
      updateBenchmarkAnalysis(id, analysis);
      const learned = createEntry({
        type: "template",
        category: "benchmark",
        title: "爆款分析: " + (analysis.summary || content.slice(0, 20)),
        content: JSON.stringify(analysis),
        tags: analysis.keywords || [],
        source: "auto-learn",
      });
      setKnowledgeEntries((prev) => addEntry(prev, learned));
      refreshBenchmarks();
    } else {
      throw new Error("AI返回结果解析失败，请重试");
    }
  }, [refreshBenchmarks]);

  const steps = workflowConfig.agents.filter((a) => a.enabled !== false).map((a) => a.name);

  const toggleFormat = useCallback((fmt) => {
    setActiveFormats((prev) =>
      prev.includes(fmt)
        ? (prev.length > 1 ? prev.filter((f) => f !== fmt) : prev)
        : [...prev, fmt]
    );
  }, []);

  const startDots = () => {
    dotRef.current = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
  };

  const stopDots = () => {
    if (dotRef.current) clearInterval(dotRef.current);
    setDots("");
  };

  const generate = useCallback(async () => {
    if (!dest.trim()) return;
    setLoading(true);
    setResults({});
    setScores({});
    setKnowledgeHits([]);
    setAgentStep(0);
    setAgentOutputs([]);
    setLiveOutput("");
    startDots();

    // Retrieve relevant knowledge
    const keywords = extractKeywords(dest, AUDIENCE_MAP[audience], SEASON_MAP[season], customPrompt);
    const relevantKnowledge = retrieveKnowledge(keywords, knowledgeEntries);
    const relevantBenchmarks = retrieveBenchmarks(dest, AUDIENCE_MAP[audience], activeFormats[0], benchmarks);
    const benchmarkCtx = formatBenchmarkContext(relevantBenchmarks);

    try {
      const { outputs, knowledgeHits: hits } = await runPipeline(
        { dest, audience: AUDIENCE_MAP[audience], season: SEASON_MAP[season], customPrompt, activeFormats, knowledgeEntries: relevantKnowledge, benchmarkContext: benchmarkCtx, workflowAgents: workflowConfig.agents },
        (stepIdx, name) => {
          const totalSteps = workflowConfig.agents.filter((a) => a.enabled !== false).length;
          setAgentStep(stepIdx);
          setAgentName(name);
          setLiveOutput("");
          setLoadingText("正在执行: " + name + " (" + (stepIdx + 1) + "/" + totalSteps + ")...");
          setStep(stepIdx);
        },
        (_stepIdx, chunk) => {
          setLiveOutput((prev) => prev + chunk);
        }
      );

      setAgentOutputs(outputs);
      setKnowledgeHits(hits);

      // Find the content agent's output by matching writeField="content" in workflow
      const enabledAgents = workflowConfig.agents.filter((a) => a.enabled !== false);
      const contentAgentIdx = enabledAgents.findIndex((a) => a.writeField === "content");
      const contentResult = contentAgentIdx >= 0 ? outputs[contentAgentIdx] : outputs[outputs.length - 1];
      const parsed = contentResult && Object.keys(contentResult).length > 0
        ? contentResult
        : { official: { label: "生成结果", content: JSON.stringify(contentResult) } };

      setResults(parsed);
      setActiveTab(Object.keys(parsed)[0]);
      setHistory((prev) => [
        { id: Date.now(), dest, audience: AUDIENCE_MAP[audience], season: SEASON_MAP[season], results: parsed, time: new Date().toLocaleString("zh-CN") },
        ...prev.slice(0, HISTORY_MAX - 1),
      ]);

      // Auto-learn from generated content
      const contentText = Object.values(parsed).map((v) => v.content).join("\n");
      const learned = learnFromContent(dest, contentText);
      setKnowledgeEntries((prev) => addEntry(prev, learned));
    } catch (err) {
      setResults({ error: { label: "错误", content: "生成失败: " + (err.message || "请检查 API Key 和网络后重试。") } });
      setActiveTab("error");
    }
    stopDots();
    setLoadingText("");
    setLoading(false);
    setAgentStep(-1);
    setLiveOutput("");
    setStep(-1);
  }, [dest, audience, season, customPrompt, activeFormats, knowledgeEntries, benchmarks, workflowConfig]);

  const getScore = useCallback(async () => {
    if (Object.keys(results).length === 0) return;
    const scoreMap = await fetchScore(results);
    setScores(scoreMap);

    // Auto-learn from high-scoring content
    const highScores = Object.entries(scoreMap).filter(([, v]) => v.score >= 8);
    if (highScores.length > 0) {
      const bestContent = highScores.map(([k]) => results[k]?.content).filter(Boolean).join("\n");
      const learned = learnFromContent(dest, bestContent, "feedback");
      learned.title = dest + " 高分风格";
      learned.tags = [...(learned.tags || []), "high-score", ...highScores.map(([k]) => k)];
      setKnowledgeEntries((prev) => addEntry(prev, learned));
    }
  }, [results, dest]);

  const batchGenerate = useCallback(async () => {
    const dests = batchDests.split("\n").map((d) => d.trim()).filter(Boolean);
    if (dests.length === 0) return;
    setBatchLoading(true);
    setBatchResults([]);
    setBatchProgress(0);
    for (let i = 0; i < dests.length; i++) {
      const item = await batchGenerateItem(dests[i], AUDIENCE_MAP[audience], SEASON_MAP[season], customPrompt);
      setBatchResults((prev) => [...prev, item]);
      setBatchProgress(i + 1);
    }
    setBatchLoading(false);
  }, [batchDests, audience, season, customPrompt]);

  const loadFromHistory = useCallback((item) => {
    setResults(item.results);
    setActiveTab(Object.keys(item.results)[0]);
    setShowHistory(false);
  }, []);

  const loadFromBatch = useCallback((item) => {
    setResults(item.results);
    setActiveTab(Object.keys(item.results)[0]);
    setBatchMode(false);
  }, []);

  const exportTxt = useCallback(() => { if (activeTab && results[activeTab]) doExportTxt(dest, results); }, [dest, results, activeTab]);
  const exportWord = useCallback(() => { if (results[activeTab]) doExportWord(dest, results); }, [dest, results, activeTab]);
  const copyText = useCallback(() => { if (results[activeTab]) doCopy(results[activeTab].content); }, [results, activeTab]);
  const exportAllBatch = useCallback(() => { if (batchResults.length > 0) doExportBatch(batchResults); }, [batchResults]);

  // Knowledge CRUD actions
  const addKnowledgeEntry = useCallback((entryData) => {
    const entry = createEntry(entryData);
    setKnowledgeEntries((prev) => addEntry(prev, entry));
  }, []);

  const updateKnowledgeEntry = useCallback((id, updates) => {
    setKnowledgeEntries((prev) => updateEntry(prev, id, updates));
  }, []);

  const deleteKnowledgeEntry = useCallback((id) => {
    setKnowledgeEntries((prev) => deleteEntry(prev, id));
  }, []);

  return {
    // state
    dest, setDest,
    audience, setAudience,
    season, setSeason,
    customPrompt, setCustomPrompt,
    activeFormats,
    loading, step, loadingText, dots, steps,
    results, activeTab, setActiveTab, scores,
    history, showHistory, setShowHistory,
    batchMode, setBatchMode,
    batchDests, setBatchDests,
    batchResults, batchLoading, batchProgress,
    // multi-agent pipeline
    agentStep, agentName, liveOutput, agentOutputs,
    // knowledge base
    knowledgeEntries, showKnowledge, setShowKnowledge, knowledgeHits,
    addKnowledgeEntry, updateKnowledgeEntry, deleteKnowledgeEntry,
    // benchmark
    benchmarks, showBenchmark, setShowBenchmark,
    importBenchmark, deleteBenchmark, analyzeBenchmarkItem,
    // workflow
    workflowConfig, showWorkflow, setShowWorkflow,
    updateWorkflow, resetWorkflow,
    // actions
    toggleFormat,
    generate,
    getScore,
    batchGenerate,
    loadFromHistory,
    loadFromBatch,
    exportTxt, exportWord, copyText,
    exportAllBatch,
  };
}
