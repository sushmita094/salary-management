import type { CreateEmployee } from "@acme/shared";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { useToast } from "../components/ui/toast-context";
import { EmployeeForm } from "../features/employees/EmployeeForm";
import { useCreateEmployee } from "../features/employees/employeeMutations";

export function EmployeeCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMutation = useCreateEmployee();

  const onSubmit = async (values: CreateEmployee) => {
    const created = await createMutation.mutateAsync(values); // throws → EmployeeForm maps server errors
    toast("Employee created", "success");
    navigate(`/employees/${created.id}`);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">New employee</h1>
      <Card className="p-6">
        <EmployeeForm onSubmit={onSubmit} submitLabel="Create" onCancel={() => navigate("/employees")} />
      </Card>
    </section>
  );
}
