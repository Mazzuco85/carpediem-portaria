"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string | null;
  type?: "success" | "error" | "info";
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  durationMs?: number;
};

export function Toast({
  message,
  type = "info",
  actionLabel,
  onAction,
  onClose,
  durationMs = 3500,
}: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [message, onClose, durationMs]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} role="status" aria-live="polite">
      <span>{message}</span>
      <div style={{ display: "flex", gap: "0.4rem", marginLeft: "auto" }}>
        {actionLabel && onAction ? (
          <button className="toast-action" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
        <button className="toast-close" type="button" onClick={onClose} aria-label="Fechar notificação">
          ×
        </button>
      </div>
    </div>
  );
}
