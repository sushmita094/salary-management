import type { ImportResult } from "@acme/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importFile } from "../../api/importExport";
import { useToast } from "../../components/ui/toast-context";
import { keys } from "../../lib/queryKeys";

/**
 * Import a spreadsheet. On success, the directory and analytics are stale, so we
 * invalidate them — the imported changes show up immediately.
 */
export function useImport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (file: File) => importFile(file),
    onSuccess: (result: ImportResult) => {
      void queryClient.invalidateQueries({ queryKey: keys.employees.lists() });
      void queryClient.invalidateQueries({ queryKey: keys.analytics.all() });
      toast(`Imported — ${result.inserted} added, ${result.updated} updated`, "success");
    },
  });
}
