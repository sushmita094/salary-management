import { Card } from "../components/ui/Card";

/** Sign-in page — renders outside the app shell. The form lands in Phase 2. */
export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8 text-center">
        <h1 className="text-lg font-semibold text-gray-900">ACME Salary Management</h1>
        <p className="mt-2 text-sm text-gray-500">Sign-in form coming in a later phase.</p>
      </Card>
    </main>
  );
}
