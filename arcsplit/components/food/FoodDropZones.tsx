"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Sample pairs (mirrors ExpressionInput sample expressions) ────────────────

const SAMPLES = [
  { label: "Pizza slice", image: "pizza.jpg", video: "eating-pizza.mp4" },
  { label: "Salad bowl",  image: "salad.jpg", video: "eating-salad.mp4" },
  { label: "Burger",      image: "burger.jpg", video: "eating-burger.mp4" },
];

// ─── Single drop zone ─────────────────────────────────────────────────────────

function DropZone({
  label, accept, file, onFile, color, disabled,
}: {
  label: string; accept: string; file: File | null;
  onFile: (f: File) => void; color: string; disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const previewUrl = file ? URL.createObjectURL(file) : null;
  const isVideo = file?.type.startsWith("video/");

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragging(false);
        if (!disabled) { const f = e.dataTransfer.files[0]; if (f) onFile(f); }
      }}
      className="relative rounded-lg overflow-hidden transition-all duration-200"
      style={{
        border: `1.5px dashed ${dragging ? color : file ? `${color}60` : "var(--border-mid)"}`,
        background: dragging ? `${color}06` : file ? `${color}04` : "transparent",
        minHeight: 100,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {previewUrl ? (
        <>
          {isVideo ? (
            <video src={previewUrl} className="w-full h-24 object-cover" muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="preview" className="w-full h-24 object-cover" />
          )}
          <div
            className="absolute bottom-0 left-0 right-0 px-3 py-1.5 text-xs font-mono truncate"
            style={{ background: "rgba(0,0,0,0.75)", color }}
          >
            {file!.name} · {(file!.size / 1024).toFixed(0)} KB
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-24 gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}12`, color }}
          >
            {accept.startsWith("video") ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            )}
          </div>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
        </div>
      )}
      <input
        ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FoodDropZonesProps {
  imageFile: File | null; videoFile: File | null;
  imageDesc: string; videoDesc: string;
  onImageFile: (f: File) => void; onVideoFile: (f: File) => void;
  onImageDesc: (s: string) => void; onVideoDesc: (s: string) => void;
  onQuote: () => void;
  onExecute: () => void;
  isQuoting: boolean;
  isExecuting: boolean;
  hasQuote: boolean;
  error?: string | null;
  disabled?: boolean;
}

export function FoodDropZones({
  imageFile, videoFile, imageDesc, videoDesc,
  onImageFile, onVideoFile, onImageDesc, onVideoDesc,
  onQuote, onExecute, isQuoting, isExecuting, hasQuote, error, disabled,
}: FoodDropZonesProps) {
  const canAct = !!imageFile && !!videoFile;

  return (
    <div className="space-y-4">
      {/* Panel — mirrors ExpressionInput's panel */}
      <motion.div
        animate={{
          boxShadow: canAct
            ? "0 0 0 1px rgba(0, 212, 255, 0.34)"
            : "0 0 0 1px rgba(255,255,255,0.07)",
        }}
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-raised)" }}
      >
        {/* Header bar */}
        <div
          className="flex items-center gap-3 px-4 py-2 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            inputs
          </span>
          <div className="flex-1" />
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            {imageFile && videoFile ? "2 / 2 files" : imageFile || videoFile ? "1 / 2 files" : "0 / 2 files"}
          </span>
        </div>

        {/* Drop zones — stacked vertically, full width, matching ExpressionInput */}
        <div className="p-3 space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-mono px-1" style={{ color: "var(--text-muted)" }}>image</p>
            <DropZone
              label="Drop image or click to browse" accept="image/*"
              file={imageFile} onFile={onImageFile}
              color="#a78bfa" disabled={disabled}
            />
            <input
              type="text" value={imageDesc}
              onChange={(e) => onImageDesc(e.target.value)}
              placeholder="Describe the image content"
              disabled={disabled}
              className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={{
                background: "var(--bg-panel)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-mono px-1" style={{ color: "var(--text-muted)" }}>video</p>
            <DropZone
              label="Drop video or click to browse" accept="video/*"
              file={videoFile} onFile={onVideoFile}
              color="#fbbf24" disabled={disabled}
            />
            <input
              type="text" value={videoDesc}
              onChange={(e) => onVideoDesc(e.target.value)}
              placeholder="Describe the video content"
              disabled={disabled}
              className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={{
                background: "var(--bg-panel)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Sample pairs — mirrors ExpressionInput sample buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs mr-1" style={{ color: "var(--text-muted)" }}>
          Try:
        </span>
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer disabled:opacity-40"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0, 212, 255, 0.34)";
              (e.currentTarget as HTMLButtonElement).style.color = "#00d4ff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="text-xs font-mono px-1" style={{ color: "var(--op-subtract)" }}
          >
            ✗ {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Action buttons — mirrors ExpressionInput exactly */}
      <div className="flex gap-3">
        <button
          onClick={onQuote}
          disabled={isQuoting || !canAct || disabled}
          className="flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-mid)",
            color: "var(--text-secondary)",
          }}
        >
          {isQuoting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Indexing…
            </span>
          ) : (
            "Quote pipeline"
          )}
        </button>

        <button
          onClick={onExecute}
          disabled={isExecuting || !canAct || disabled}
          className="flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: hasQuote ? "#00d4ff" : "var(--bg-raised)",
            border: hasQuote ? "none" : "1px solid var(--border-mid)",
            color: hasQuote ? "#000" : "var(--text-secondary)",
            boxShadow: hasQuote ? "0 0 20px rgba(0, 212, 255, 0.38)" : "none",
          }}
        >
          {isExecuting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner dark={hasQuote} /> Executing…
            </span>
          ) : (
            "Execute & settle →"
          )}
        </button>
      </div>
    </div>
  );
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"
      stroke={dark ? "#000" : "currentColor"} strokeWidth={2}>
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
