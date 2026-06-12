import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "../../api/health";

/** Reads the API liveness state via TanStack Query. */
export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    retry: false,
  });
}
