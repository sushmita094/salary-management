import { loginSchema, type LoginInput } from "@acme/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiRequestError } from "../api/client";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useAuth } from "../features/auth/auth-context";

interface FromState {
  from?: { pathname?: string };
}

/** Sign-in page (outside the app shell). Validates with the shared `loginSchema`. */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as FromState | null)?.from?.pathname ?? "/employees";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      navigate(destination, { replace: true });
    } catch (error) {
      const message =
        error instanceof ApiRequestError && error.status === 401
          ? "Invalid email or password"
          : error instanceof ApiRequestError && error.status === 429
            ? "Too many attempts. Please wait a moment and try again."
            : "Something went wrong. Please try again.";
      setError("root", { message });
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-lg font-semibold text-gray-900">ACME Salary Management</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to continue.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="you@acme.example"
              invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          {errors.root && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </Card>
    </main>
  );
}
