import type { CreateEmployee } from "@acme/shared";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiRequestError } from "../api/client";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useToast } from "../components/ui/toast-context";
import { EmployeeForm } from "../features/employees/EmployeeForm";
import { useUpdateEmployee } from "../features/employees/employeeMutations";
import { useEmployee } from "../features/employees/useEmployee";

export function EmployeeEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: employee, isPending, isError, error } = useEmployee(id);
  const updateMutation = useUpdateEmployee(id);

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6 text-brand-600" />
      </div>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiRequestError && error.status === 404;
    return (
      <Card className="p-6">
        <EmptyState
          title={notFound ? "Employee not found" : "Couldn’t load employee"}
          action={
            <Link to="/employees">
              <Button variant="secondary">Back to Directory</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const defaultValues: CreateEmployee = {
    name: employee.name,
    email: employee.email,
    country: employee.country,
    department: employee.department,
    jobTitle: employee.jobTitle,
    level: employee.level,
    salaryAmount: employee.salaryAmount,
    salaryCurrency: employee.salaryCurrency,
  };

  const onSubmit = async (values: CreateEmployee) => {
    await updateMutation.mutateAsync(values); // throws → EmployeeForm maps server errors
    toast("Employee updated", "success");
    navigate(`/employees/${id}`);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Edit {employee.name}</h1>
      <Card className="p-6">
        <EmployeeForm
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          submitLabel="Save changes"
          onCancel={() => navigate(`/employees/${id}`)}
        />
      </Card>
    </section>
  );
}
