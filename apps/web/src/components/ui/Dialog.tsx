import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  loading?: boolean;
  /** The trigger element (e.g. a Button) — Radix wires open/focus to it. */
  children: ReactNode;
}

/**
 * Accessible confirm dialog built on Radix (focus trap, Escape, labelling). The
 * action buttons are passed in so callers control wording/variants; this only
 * owns the modal behaviour.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading,
  children,
}: ConfirmDialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>{children}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl focus:outline-none">
          <RadixDialog.Title className="text-lg font-semibold text-gray-900">{title}</RadixDialog.Title>
          {description && (
            <RadixDialog.Description className="mt-2 text-sm text-gray-600">{description}</RadixDialog.Description>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <RadixDialog.Close className="inline-flex h-10 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-800 hover:bg-gray-50">
              Cancel
            </RadixDialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex h-10 items-center rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {confirmLabel}
            </button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
