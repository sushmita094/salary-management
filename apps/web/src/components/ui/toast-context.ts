import { createContext, useContext } from "react";

export type ToastTone = "success" | "error" | "info";

export interface ToastContextValue {
  /** Show a toast; auto-dismisses after a few seconds. */
  toast: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Access the toast trigger. Must be used within a `ToastProvider`. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
