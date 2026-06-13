import { createEmployeeSchema, type CreateEmployee } from "@acme/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";
import { ApiRequestError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { COUNTRY_OPTIONS, DEPARTMENT_OPTIONS, LEVEL_OPTIONS } from "./filterOptions";

interface EmployeeFormProps {
  defaultValues?: Partial<CreateEmployee>;
  /** Persist the values; throw an `ApiRequestError` to surface server errors on fields. */
  onSubmit: (values: CreateEmployee) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
}

/** Map a server failure onto the offending field(s) — 409 → email, 400 details → fields. */
function applyServerErrors(error: unknown, setError: UseFormSetError<CreateEmployee>) {
  if (!(error instanceof ApiRequestError)) {
    setError("root", { message: "Something went wrong. Please try again." });
    return;
  }
  if (error.status === 409) {
    setError("email", { message: error.message });
    return;
  }
  if (error.status === 400 && Array.isArray(error.details)) {
    for (const issue of error.details as Array<{ path?: string; message?: string }>) {
      if (issue.path && issue.message) setError(issue.path as keyof CreateEmployee, { message: issue.message });
    }
    return;
  }
  setError("root", { message: error.message });
}

/** Create/edit form bound to the shared `createEmployeeSchema` (one source of validity). */
export function EmployeeForm({ defaultValues, onSubmit, submitLabel, onCancel }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployee>({ resolver: zodResolver(createEmployeeSchema), defaultValues });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      applyServerErrors(error, setError);
    }
  });

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <Input invalid={Boolean(errors.name)} {...register("name")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" invalid={Boolean(errors.email)} {...register("email")} />
        </Field>
        <Field label="Country" error={errors.country?.message}>
          <Select invalid={Boolean(errors.country)} defaultValue="" {...register("country")}>
            <option value="" disabled>
              Select…
            </option>
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </Field>
        <Field label="Department" error={errors.department?.message}>
          <Select invalid={Boolean(errors.department)} defaultValue="" {...register("department")}>
            <option value="" disabled>
              Select…
            </option>
            {DEPARTMENT_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </Field>
        <Field label="Job title" error={errors.jobTitle?.message}>
          <Input invalid={Boolean(errors.jobTitle)} {...register("jobTitle")} />
        </Field>
        <Field label="Level" error={errors.level?.message}>
          <Select invalid={Boolean(errors.level)} defaultValue="" {...register("level")}>
            <option value="" disabled>
              Select…
            </option>
            {LEVEL_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </Field>
        <Field label="Salary amount" error={errors.salaryAmount?.message}>
          <Input type="number" min="0" invalid={Boolean(errors.salaryAmount)} {...register("salaryAmount", { valueAsNumber: true })} />
        </Field>
        <Field label="Currency (ISO)" error={errors.salaryCurrency?.message}>
          <Input maxLength={3} invalid={Boolean(errors.salaryCurrency)} {...register("salaryCurrency")} />
        </Field>
      </div>

      {errors.root && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}
