"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { IndexedRecord } from "@/lib/rag/types";

const KIND_COLORS: Record<string, string> = {
  image: "#a78bfa",
  video: "#fbbf24",
  text: "var(--accent)",
  audio: "#34d399",
  pdf: "#f87171",
};

const KIND_ICONS: Record<string, string> = {
  image: "🖼",
  video: "🎬",
  text: "📄",
  audio: "🎵",
  pdf: "📑",
};

interface SearchHit extends IndexedRecord {
  score?: number;
}

export function IndexBrowser() {
  const [records, setRecords] = useState<IndexedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rag/search");
      const data = await res.json();
      if (data.ok) setRecords(data.records);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (expanded) fetchRecords();
  }, [expanded, fetchRecords]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch("/api/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, topK: 8 }),
      });
      const data = await res.json();
      if (data.ok) setSearchResults(data.results);
    } finally {
      setSearching(false);
    }
  }

  const displayRecords = searchResults ?? records;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ borderBottom: expanded ? "1px solid var(--border)" : "none" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            vector index
          </span>
          {records.length > 0 && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(0,212,255,0.08)",
                color: "var(--accent)",
                border: "1px solid rgba(0,212,255,0.2)",
              }}
            >
              {records.length} records
            </span>
          )}
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (!e.target.value) setSearchResults(null);
                  }}
                  placeholder="Semantic search across all indexed records…"
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-mono bg-transparent outline-none"
                  style={{
                    background: "var(--bg-raised)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                />
                <button
                  type="submit"
                  disabled={searching || !query.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-mono cursor-pointer disabled:opacity-40"
                  style={{
                    background: "var(--accent)",
                    color: "#000",
                  }}
                >
                  {searching ? "…" : "Search"}
                </button>
                {searchResults && (
                  <button
                    type="button"
                    onClick={() => { setSearchResults(null); setQuery(""); }}
                    className="px-3 py-2 rounded-lg text-xs font-mono cursor-pointer"
                    style={{
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    ✕
                  </button>
                )}
              </form>

              {loading && (
                <p className="text-xs font-mono text-center" style={{ color: "var(--text-muted)" }}>
                  Loading index…
                </p>
              )}

              {!loading && displayRecords.length === 0 && (
                <p className="text-xs font-mono text-center py-4" style={{ color: "var(--text-muted)" }}>
                  No records indexed yet. Upload a food image and video above.
                </p>
              )}

              {/* Records list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {displayRecords.map((rec) => {
                  const color = KIND_COLORS[rec.kind] ?? "var(--text-muted)";
                  const score = (rec as SearchHit).score;
                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ background: "var(--bg-raised)" }}
                    >
                      <span className="text-base">{KIND_ICONS[rec.kind] ?? "📦"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{rec.title}</p>
                        <p className="text-xs font-mono truncate" style={{ color: "var(--text-muted)" }}>
                          {rec.textForRetrieval.slice(0, 60)}
                          {rec.textForRetrieval.length > 60 ? "…" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {score !== undefined && (
                          <span
                            className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{ background: `${color}15`, color }}
                          >
                            {score.toFixed(3)}
                          </span>
                        )}
                        <span
                          className="text-xs font-mono px-1.5 py-0.5 rounded"
                          style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}
                        >
                          {rec.kind}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <button
                onClick={fetchRecords}
                className="text-xs font-mono cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              >
                ↺ refresh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
