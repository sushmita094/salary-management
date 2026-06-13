import type { AuthUser, LoginInput, LoginResponse } from "@acme/shared";
import { createContext, useContext } from "react";

export interface AuthContextValue {
  /** The signed-in user, or `null` when unauthenticated. */
  user: AuthUser | null;
  /** True while the initial `GET /auth/me` session probe is in flight. */
  isResolving: boolean;
  login: (input: LoginInput) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Access the auth session. Must be used within an `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
