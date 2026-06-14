import { Spinner } from "./Spinner";

/** Centered page-level loading indicator. */
export function PageSpinner() {
  return (
    <div className="flex justify-center py-12">
      <Spinner className="h-6 w-6 text-brand-600" />
    </div>
  );
}
