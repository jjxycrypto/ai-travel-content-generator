const KNOWLEDGE_KEY = "travel-ai-knowledge";
const KNOWLEDGE_MAX = 100;
const AUTO_LEARN_MAX = 30;

// --- Storage ---

export function loadKnowledge() {
  try {
    const raw = localStorage.getItem(KNOWLEDGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveKnowledge(entries) {
  try {
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded: prune oldest low-usage auto-learned entries
    const pruned = [...entries]
      .sort((a, b) => (a.source === "auto-learn" ? -1 : 1) - (b.source === "auto-learn" ? -1 : 1) || a.usageCount - b.usageCount)
      .slice(0, Math.floor(entries.length * 0.8));
    try { localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(pruned)); } catch { /* give up */ }
  }
}

// --- Entry CRUD ---

export function createEntry({ type = "feedback", category = "", title = "", content = "", tags = [], source = "manual" }) {
  return {
    id: String(Date.now()) + "-" + String(Math.random()).slice(2, 8),
    type,
    category,
    title,
    content: content.slice(0, 500),
    tags: Array.isArray(tags) ? tags : String(tags).split(/[,，、\s]+/).filter(Boolean),
    source,
    createdAt: new Date().toLocaleString("zh-CN"),
    updatedAt: new Date().toLocaleString("zh-CN"),
    usageCount: 0,
  };
}

export function addEntry(entries, entry) {
  const next = [entry, ...entries];
  // Cap auto-learned entries
  const autoLearned = next.filter((e) => e.source === "auto-learn");
  if (autoLearned.length > AUTO_LEARN_MAX) {
    const toRemove = autoLearned
      .sort((a, b) => a.usageCount - b.usageCount)
      .slice(0, autoLearned.length - AUTO_LEARN_MAX)
      .map((e) => e.id);
    return next.filter((e) => !toRemove.includes(e.id));
  }
  return next.length > KNOWLEDGE_MAX ? next.slice(0, KNOWLEDGE_MAX) : next;
}

export function updateEntry(entries, id, updates) {
  return entries.map((e) => e.id === id ? { ...e, ...updates, updatedAt: new Date().toLocaleString("zh-CN") } : e);
}

export function deleteEntry(entries, id) {
  return entries.filter((e) => e.id !== id);
}

// --- Keyword Extraction ---

const STOP_WORDS = new Set([
  "的", "了", "是", "在", "和", "有", "也", "就", "都", "而", "及", "与", "着", "或", "一个", "一些",
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "and", "or", "but", "in", "on", "at", "to",
  "for", "of", "with", "by", "from", "it", "this", "that", "as", "not", "no",
]);

export function extractKeywords(dest, audience, season, customPrompt) {
  const text = [dest, audience, season, customPrompt].filter(Boolean).join(" ");
  // Split by non-CJK-word characters
  const tokens = text.split(/[^一-鿿\w]+/).map((t) => t.toLowerCase().trim());
  const unique = [...new Set(tokens.filter((t) => t.length >= 2 && !STOP_WORDS.has(t)))];
  // Also include the full destination name as a token
  if (dest && dest.trim() && !unique.includes(dest.trim().toLowerCase())) {
    unique.unshift(dest.trim().toLowerCase());
  }
  return unique;
}

// --- Retrieval ---

export function retrieveKnowledge(keywords, entries, maxResults = 5) {
  if (!keywords.length || !entries.length) return [];

  const scored = entries.map((entry) => {
    let score = 0;
    const lcTitle = entry.title.toLowerCase();
    const lcContent = entry.content.toLowerCase();
    const lcTags = entry.tags.map((t) => t.toLowerCase());

    for (const kw of keywords) {
      if (lcTags.some((t) => t.includes(kw) || kw.includes(t))) score += 3;
      if (lcTitle.includes(kw)) score += 2;
      if (lcContent.includes(kw)) score += 1;
    }

    return { entry, score };
  });

  const hits = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => {
      s.entry.usageCount += 1;
      return { ...s.entry };
    });

  return hits;
}

// --- Auto-Learning ---

export function learnFromContent(dest, content, type = "feedback") {
  // Extract high-frequency bigrams/trigrams from content
  const phrases = extractPhrases(content);
  const title = type === "feedback" ? dest + " 高分风格" : dest + " 风格模式";

  return createEntry({
    type,
    category: "style",
    title,
    content: content.slice(0, 300),
    tags: [...phrases.slice(0, 5), dest],
    source: "auto-learn",
  });
}

function extractPhrases(text) {
  // Simple Chinese bigram extraction
  const bigrams = {};
  for (let i = 0; i < text.length - 1; i++) {
    const pair = text.slice(i, i + 2);
    if (/[一-鿿]{2}/.test(pair)) {
      bigrams[pair] = (bigrams[pair] || 0) + 1;
    }
  }
  return Object.entries(bigrams)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);
}
