"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { JobStatus } from "@/lib/types";

const STATES: JobStatus[] = ["Open", "Funded", "Submitted", "Completed"];

const STATE_COLORS: Record<JobStatus, string> = {
  Open: "#6b7280",
  Funded: "#3b82f6",
  Submitted: "#a78bfa",
  Completed: "#34d399",
  Rejected: "#f87171",
  Expired: "#6b7280",
};

const STATE_DESCRIPTIONS: Record<JobStatus, string> = {
  Open: "Job created. Budget set. Awaiting payment.",
  Funded: "EIP-3009 authorization verified. Escrow funded.",
  Submitted: "Execution complete. Work submitted for evaluation.",
  Completed: "Evaluator attested. Escrow released to providers.",
  Rejected: "Job rejected. Escrow refunded to client.",
  Expired: "Job expired. Escrow refunded to client.",
};

interface TimelineStep {
  status: JobStatus;
  timestamp?: string;
  reason?: string;
}

interface ExecutionTimelineProps {
  steps: TimelineStep[];
  currentStatus: JobStatus | null;
}

export function ExecutionTimeline({
  steps,
  currentStatus,
}: ExecutionTimelineProps) {
  const displayStates = currentStatus === "Rejected" || currentStatus === "Expired"
    ? [...STATES.slice(0, -1), currentStatus]
    : STATES;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          erc-8183 job lifecycle
        </span>
        {currentStatus && (
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{
              background: `${STATE_COLORS[currentStatus]}18`,
              color: STATE_COLORS[currentStatus],
              border: `1px solid ${STATE_COLORS[currentStatus]}40`,
            }}
          >
            {currentStatus}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-4 top-4 bottom-4 w-px"
            style={{ background: "var(--border)" }}
          />

          <div className="space-y-1">
            {displayStates.map((state, i) => {
              const step = steps.find((s) => s.status === state);
              const isActive = currentStatus === state;
              const isPast = steps.some((s) => s.status === state);
              const color = STATE_COLORS[state];

              return (
                <motion.div
                  key={state}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-4 pl-0"
                >
                  {/* Dot */}
                  <div className="relative flex-shrink-0 flex items-start pt-3">
                    <motion.div
                      animate={{
                        scale: isActive ? [1, 1.2, 1] : 1,
                        boxShadow: isActive
                          ? [`0 0 0 0 ${color}60`, `0 0 0 6px ${color}00`]
                          : "none",
                      }}
                      transition={
                        isActive
                          ? { duration: 1.5, repeat: Infinity }
                          : {}
                      }
                      className="w-8 h-8 rounded-full flex items-center justify-center z-10"
                      style={{
                        background: isPast ? `${color}20` : "var(--bg-raised)",
                        border: `2px solid ${isPast ? color : "var(--border)"}`,
                        color: isPast ? color : "var(--text-muted)",
                      }}
                    >
                      {isPast ? (
                        isActive ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-3 h-3 rounded-full border-2 border-t-transparent"
                            style={{ borderColor: color, borderTopColor: "transparent" }}
                          />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke={color}
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )
                      ) : (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: "var(--border-mid)" }}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 pt-3">
                      <span
                        className="text-sm font-medium"
                        style={{ color: isPast ? color : "var(--text-muted)" }}
                      >
                        {state}
                      </span>
                      {step?.timestamp && (
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <AnimatePresence>
                      {isPast && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-xs mt-0.5 overflow-hidden"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {step?.reason ?? STATE_DESCRIPTIONS[state]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
