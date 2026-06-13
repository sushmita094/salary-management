import type { LoginInput } from "@acme/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, login as apiLogin, logout as apiLogout } from "../../api/auth";
import { setUnauthorizedHandler } from "../../api/client";
import { keys } from "../../lib/queryKeys";
import { AuthContext } from "./auth-context";

/**
 * Holds the session. Bootstraps from `GET /auth/me` on load (the cookie is the
 * source of truth — no token in JS), and registers the global 401 handler so an
 * expired session mid-use clears auth and bounces to /login.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const meQuery = useQuery({
    queryKey: keys.auth.me(),
    queryFn: fetchMe,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.setQueryData(keys.auth.me(), null);
      navigate("/login", { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient, navigate]);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await apiLogin(input);
      queryClient.setQueryData(keys.auth.me(), result.user);
      return result;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    queryClient.setQueryData(keys.auth.me(), null);
    queryClient.removeQueries(); // drop cached employee/analytics data
  }, [queryClient]);

  const value = useMemo(
    () => ({ user: meQuery.data ?? null, isResolving: meQuery.isPending, login, logout }),
    [meQuery.data, meQuery.isPending, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
