"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { FoodVerificationResult } from "@/lib/rag/types";

// ─── Sub-components ───────────────────────────────────────────────────────────

function DropZone({
  label,
  accept,
  file,
  onFile,
  icon,
  color,
}: {
  label: string;
  accept: string;
  file: File | null;
  onFile: (f: File) => void;
  icon: React.ReactNode;
  color: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const previewUrl = file ? URL.createObjectURL(file) : null;
  const isVideo = file?.type.startsWith("video/");

  return (
    <div className="space-y-2">
      <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
        className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
        style={{
          border: `2px dashed ${dragging ? color : "var(--border-mid)"}`,
          background: dragging ? `${color}08` : "var(--bg-raised)",
          minHeight: 160,
        }}
      >
        {previewUrl ? (
          isVideo ? (
            <video
              src={previewUrl}
              className="w-full h-40 object-cover"
              muted
              playsInline
              controls
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="preview"
              className="w-full h-40 object-cover"
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}15`, color }}
            >
              {icon}
            </div>
            <p className="text-xs text-center px-4" style={{ color: "var(--text-muted)" }}>
              Drop {label.toLowerCase()} here or click to browse
            </p>
          </div>
        )}
        {file && (
          <div
            className="absolute bottom-0 left-0 right-0 px-3 py-1.5 text-xs font-mono truncate"
            style={{ background: "rgba(0,0,0,0.7)", color }}
          >
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
      </div>
    </div>
  );
}

function VerdictBadge({ verdict, confidence }: { verdict: string; confidence: number }) {
  const config = {
    confirmed: { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "✓ Confirmed", border: "rgba(52,211,153,0.3)" },
    unconfirmed: { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "✗ Unconfirmed", border: "rgba(248,113,113,0.3)" },
    uncertain: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", label: "? Uncertain", border: "rgba(251,191,36,0.3)" },
  }[verdict] ?? { color: "var(--text-muted)", bg: "var(--bg-raised)", label: verdict, border: "var(--border)" };

  return (
    <div
      className="flex items-center gap-4 rounded-xl p-4"
      style={{ background: config.bg, border: `1px solid ${config.border}` }}
    >
      <div>
        <p className="text-2xl font-bold" style={{ color: config.color }}>
          {config.label}
        </p>
        <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
          Confidence: {(confidence * 100).toFixed(0)}%
        </p>
      </div>
      {/* Confidence bar */}
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-raised)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: config.color }}
        />
      </div>
    </div>
  );
}

function FoodList({ label, items, color }: { label: string; items: string[]; color: string }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-mono mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="px-2 py-1 rounded-lg text-xs font-mono"
            style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Phase = "idle" | "uploading" | "indexing" | "verifying" | "done" | "error";

const PHASE_LABELS: Record<Phase, string> = {
  idle: "",
  uploading: "Uploading files…",
  indexing: "Indexing with gemini-embedding-2…",
  verifying: "Gemini is examining both files…",
  done: "",
  error: "",
};

export function FoodVerificationSection() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageDesc, setImageDesc] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<FoodVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [indexedImageId, setIndexedImageId] = useState<string | null>(null);
  const [indexedVideoId, setIndexedVideoId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const canVerify = imageFile && videoFile;

  const handleVerify = useCallback(async () => {
    if (!imageFile || !videoFile) return;
    setPhase("uploading");
    setError(null);
    setResult(null);

    try {
      // ── Step 1: Index image ──────────────────────────────────────────────
      setPhase("indexing");
      const imgForm = new FormData();
      imgForm.set("file", imageFile);
      imgForm.set("title", imageFile.name);
      imgForm.set("description", imageDesc || `Food image: ${imageFile.name}`);
      imgForm.set("metadata", JSON.stringify({ role: "food-image" }));

      const imgRes = await fetch("/api/rag/index/media", { method: "POST", body: imgForm });
      const imgData = await imgRes.json();
      if (!imgRes.ok) throw new Error(imgData.error ?? "Image indexing failed");
      setIndexedImageId(imgData.record.id);

      // ── Step 2: Index video ──────────────────────────────────────────────
      const vidForm = new FormData();
      vidForm.set("file", videoFile);
      vidForm.set("title", videoFile.name);
      vidForm.set("description", videoDesc || `Eating video: ${videoFile.name}`);
      vidForm.set("metadata", JSON.stringify({ role: "eating-video" }));

      const vidRes = await fetch("/api/rag/index/media", { method: "POST", body: vidForm });
      const vidData = await vidRes.json();
      if (!vidRes.ok) throw new Error(vidData.error ?? "Video indexing failed");
      setIndexedVideoId(vidData.record.id);

      // ── Step 3: Verify ───────────────────────────────────────────────────
      setPhase("verifying");
      const verifyRes = await fetch("/api/rag/verify-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: imgData.record.id, videoId: vidData.record.id }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error ?? "Verification failed");

      setResult(verifyData.result);
      setPhase("done");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }, [imageFile, videoFile, imageDesc, videoDesc]);

  function reset() {
    setImageFile(null);
    setVideoFile(null);
    setImageDesc("");
    setVideoDesc("");
    setPhase("idle");
    setResult(null);
    setError(null);
    setIndexedImageId(null);
    setIndexedVideoId(null);
  }

  const isRunning = phase === "uploading" || phase === "indexing" || phase === "verifying";

  return (
    <section
      id="food-verify"
      className="py-16 px-6"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(167,139,250,0.1)",
                  color: "#a78bfa",
                  border: "1px solid rgba(167,139,250,0.25)",
                }}
              >
                gemini-embedding-2 · RAG
              </span>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(0,212,255,0.08)",
                  color: "var(--accent)",
                  border: "1px solid rgba(0,212,255,0.2)",
                }}
              >
                multimodal
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Food consumption verifier</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Index a food image and an eating video separately into the same embedding space,
              then ask Gemini to confirm whether the food was consumed.
            </p>
          </div>
          {phase !== "idle" && (
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg text-xs font-mono cursor-pointer"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              ↺ reset
            </button>
          )}
        </div>

        {/* Pipeline diagram */}
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-mono mb-3" style={{ color: "var(--text-muted)" }}>
            pipeline
          </p>
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {[
              { label: "food image", color: "#a78bfa" },
              { label: "→ embed", color: "var(--text-muted)" },
              { label: "vector DB", color: "var(--accent)" },
              { label: "←→", color: "var(--text-muted)" },
              { label: "eating video", color: "#fbbf24" },
              { label: "→ embed", color: "var(--text-muted)" },
              { label: "vector DB", color: "var(--accent)" },
              { label: "→", color: "var(--text-muted)" },
              { label: "Gemini RAG", color: "#34d399" },
              { label: "→ verdict", color: "var(--text-muted)" },
            ].map((step, i) => (
              <span key={i} style={{ color: step.color }}>
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Upload area */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <DropZone
              label="Food image"
              accept="image/*"
              file={imageFile}
              onFile={setImageFile}
              color="#a78bfa"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              }
            />
            <input
              type="text"
              value={imageDesc}
              onChange={(e) => setImageDesc(e.target.value)}
              placeholder="Describe the food (e.g. 'pepperoni pizza slice')"
              className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-transparent outline-none"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            />
            {indexedImageId && (
              <p className="text-xs font-mono" style={{ color: "#34d399" }}>
                ✓ Indexed · {indexedImageId.slice(0, 16)}…
              </p>
            )}
          </div>

          <div className="space-y-3">
            <DropZone
              label="Eating video"
              accept="video/*"
              file={videoFile}
              onFile={setVideoFile}
              color="#fbbf24"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              }
            />
            <input
              type="text"
              value={videoDesc}
              onChange={(e) => setVideoDesc(e.target.value)}
              placeholder="Describe the video (e.g. 'person eating at table')"
              className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-transparent outline-none"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            />
            {indexedVideoId && (
              <p className="text-xs font-mono" style={{ color: "#34d399" }}>
                ✓ Indexed · {indexedVideoId.slice(0, 16)}…
              </p>
            )}
          </div>
        </div>

        {/* Progress steps */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl p-4 space-y-3"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
            >
              {(["indexing", "verifying"] as Phase[]).map((step, i) => {
                const stepOrder = { uploading: 0, indexing: 1, verifying: 2, done: 3, error: 3, idle: -1 };
                const currentOrder = stepOrder[phase];
                const thisOrder = stepOrder[step];
                const isDone = currentOrder > thisOrder;
                const isActive = currentOrder === thisOrder;

                return (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        background: isDone ? "rgba(52,211,153,0.15)" : isActive ? "rgba(0,212,255,0.15)" : "var(--bg-raised)",
                        border: `1px solid ${isDone ? "#34d399" : isActive ? "var(--accent)" : "var(--border)"}`,
                        color: isDone ? "#34d399" : isActive ? "var(--accent)" : "var(--text-muted)",
                      }}
                    >
                      {isDone ? "✓" : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3 rounded-full border-2 border-t-transparent"
                          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
                        />
                      ) : String(i + 1)}
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {step === "indexing" ? "Index both files with gemini-embedding-2" : "Gemini examines image + video"}
                      </p>
                      {isActive && (
                        <p className="text-xs font-mono" style={{ color: "var(--accent)" }}>
                          {PHASE_LABELS[phase]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verify button */}
        {!isRunning && phase !== "done" && (
          <button
            onClick={handleVerify}
            disabled={!canVerify || isRunning}
            className="w-full py-3.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: canVerify ? "#a78bfa" : "var(--bg-raised)",
              color: canVerify ? "#fff" : "var(--text-muted)",
              border: canVerify ? "none" : "1px solid var(--border-mid)",
              boxShadow: canVerify ? "0 0 30px rgba(167,139,250,0.25)" : "none",
            }}
          >
            Verify food consumption with Gemini →
          </button>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl p-4 text-sm font-mono"
              style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.25)",
                color: "#f87171",
              }}
            >
              ✗ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Verdict */}
              <VerdictBadge verdict={result.verdict} confidence={result.confidence} />

              {/* Reasoning */}
              <div
                className="rounded-xl p-4"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs font-mono mb-2" style={{ color: "var(--text-muted)" }}>
                  gemini reasoning
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {result.reasoning}
                </p>
              </div>

              {/* Food items grid */}
              <div className="grid md:grid-cols-3 gap-4">
                <FoodList label="In image" items={result.foodItemsInImage} color="#a78bfa" />
                <FoodList label="In video" items={result.foodItemsInVideo} color="#fbbf24" />
                <FoodList label="Matched" items={result.matchedItems} color="#34d399" />
              </div>

              {result.discrepancies.length > 0 && (
                <FoodList label="Discrepancies" items={result.discrepancies} color="#f87171" />
              )}

              {/* Index IDs */}
              <div
                className="rounded-xl p-4 grid grid-cols-2 gap-3 text-xs font-mono"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
              >
                <div>
                  <p style={{ color: "var(--text-muted)" }}>image record</p>
                  <p style={{ color: "#a78bfa" }}>{indexedImageId?.slice(0, 20)}…</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-muted)" }}>video record</p>
                  <p style={{ color: "#fbbf24" }}>{indexedVideoId?.slice(0, 20)}…</p>
                </div>
              </div>

              {/* Re-run */}
              <button
                onClick={reset}
                className="w-full py-3 rounded-xl text-sm font-medium cursor-pointer"
                style={{
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border-mid)",
                  color: "var(--text-secondary)",
                }}
              >
                ↺ Verify another pair
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
