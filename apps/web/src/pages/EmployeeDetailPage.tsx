import type { Employee } from "@acme/shared";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiRequestError } from "../api/client";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/Dialog";
import { ErrorState } from "../components/ui/ErrorState";
import { PageSpinner } from "../components/ui/PageSpinner";
import { useToast } from "../components/ui/toast-context";
import { useDeleteEmployee } from "../features/employees/employeeMutations";
import { useEmployee } from "../features/employees/useEmployee";
import { formatSalary } from "../lib/format";

export function EmployeeDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: employee, isPending, isError, error } = useEmployee(id);
  const deleteMutation = useDeleteEmployee();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isPending) return <PageSpinner />;

  if (isError) {
    const notFound = error instanceof ApiRequestError && error.status === 404;
    return (
      <ErrorState
        title={notFound ? "Employee not found" : "Couldn’t load employee"}
        description={notFound ? "This employee may have been deleted." : "Please try again."}
        action={
          <Link to="/employees">
            <Button variant="secondary">Back to Directory</Button>
          </Link>
        }
      />
    );
  }

  const onDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast("Employee deleted", "success");
        navigate("/employees");
      },
      onError: () => {
        toast("Couldn’t delete employee", "error");
        setConfirmOpen(false);
      },
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{employee.name}</h1>
          <p className="text-sm text-gray-500">{employee.email}</p>
        </div>
        <div className="flex gap-3">
          <Link to={`/employees/${id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Delete employee?"
            description={`This permanently removes ${employee.name}.`}
            confirmLabel="Delete"
            onConfirm={onDelete}
            loading={deleteMutation.isPending}
          >
            <Button variant="danger">Delete</Button>
          </ConfirmDialog>
        </div>
      </div>

      <Card className="divide-y divide-gray-100">
        <Detail label="Country" value={employee.country} />
        <Detail label="Department" value={employee.department} />
        <Detail label="Job title" value={employee.jobTitle} />
        <Detail label="Level" value={employee.level} />
        <Detail label="Salary" value={formatSalary(employee)} />
        <Detail label="Currency" value={employee.salaryCurrency} />
      </Card>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: Employee[keyof Employee] }) {
  return (
    <div className="flex justify-between px-5 py-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{String(value)}</span>
    </div>
  );
}
