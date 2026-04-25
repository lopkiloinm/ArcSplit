"use client";

import { useRef, useState } from "react";

function DropZone({ label, accept, file, onFile, color, icon, disabled }: {
  label: string; accept: string; file: File | null; onFile: (f: File) => void;
  color: string; icon: React.ReactNode; disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const previewUrl = file ? URL.createObjectURL(file) : null;
  const isVideo = file?.type.startsWith("video/");

  return (
    <div className="space-y-2">
      <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{label}</p>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          if (!disabled) { const f = e.dataTransfer.files[0]; if (f) onFile(f); }
        }}
        className="relative rounded-xl overflow-hidden transition-all duration-200"
        style={{
          border: `2px dashed ${dragging ? color : "var(--border-mid)"}`,
          background: dragging ? `${color}08` : "var(--bg-raised)",
          minHeight: 160,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {previewUrl ? (
          isVideo ? (
            <video src={previewUrl} className="w-full h-40 object-cover" muted playsInline controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="preview" className="w-full h-40 object-cover" />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}15`, color }}>{icon}</div>
            <p className="text-xs text-center px-4" style={{ color: "var(--text-muted)" }}>
              Drop {label.toLowerCase()} here or click to browse
            </p>
          </div>
        )}
        {file && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 text-xs font-mono truncate"
            style={{ background: "rgba(0,0,0,0.7)", color }}>
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </div>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </div>
    </div>
  );
}

interface FoodDropZonesProps {
  imageFile: File | null; videoFile: File | null;
  imageDesc: string; videoDesc: string;
  onImageFile: (f: File) => void; onVideoFile: (f: File) => void;
  onImageDesc: (s: string) => void; onVideoDesc: (s: string) => void;
  disabled?: boolean;
}

export function FoodDropZones({
  imageFile, videoFile, imageDesc, videoDesc,
  onImageFile, onVideoFile, onImageDesc, onVideoDesc, disabled,
}: FoodDropZonesProps) {
  return (
    <div className="space-y-4">
      <DropZone label="Food image" accept="image/*" file={imageFile} onFile={onImageFile}
        color="#a78bfa" disabled={disabled}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" /></svg>}
      />
      <input type="text" value={imageDesc} onChange={(e) => onImageDesc(e.target.value)}
        placeholder="Describe the food (e.g. 'pepperoni pizza slice')"
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none"
        style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-secondary)" }} />

      <DropZone label="Eating video" accept="video/*" file={videoFile} onFile={onVideoFile}
        color="#fbbf24" disabled={disabled}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>}
      />
      <input type="text" value={videoDesc} onChange={(e) => onVideoDesc(e.target.value)}
        placeholder="Describe the video (e.g. 'person eating at table')"
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none"
        style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-secondary)" }} />
    </div>
  );
}
