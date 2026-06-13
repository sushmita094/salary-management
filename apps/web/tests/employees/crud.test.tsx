import type { Employee } from "@acme/shared";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedMe } from "../msw/handlers";
import { server } from "../msw/server";
import { renderApp } from "../utils";

const ID = "11111111-1111-4111-8111-111111111111";

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: ID,
    name: "Ada Lovelace",
    email: "ada@acme.example",
    country: "United Kingdom",
    department: "Engineering",
    jobTitle: "Software Engineer",
    level: "Principal",
    salaryAmount: 120000,
    salaryCurrency: "GBP",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

async function fillForm(values: { name: string; email: string; currency: string }) {
  await userEvent.type(screen.getByLabelText("Name"), values.name);
  await userEvent.type(screen.getByLabelText("Email"), values.email);
  await userEvent.selectOptions(screen.getByLabelText("Country"), "Germany");
  await userEvent.selectOptions(screen.getByLabelText("Department"), "Engineering");
  await userEvent.type(screen.getByLabelText("Job title"), "Software Engineer");
  await userEvent.selectOptions(screen.getByLabelText("Level"), "Senior");
  await userEvent.type(screen.getByLabelText("Salary amount"), "150000");
  await userEvent.type(screen.getByLabelText("Currency (ISO)"), values.currency);
}

beforeEach(() => server.use(authenticatedMe()));

describe("employee detail", () => {
  it("renders the employee with a local-currency salary", async () => {
    server.use(http.get("/api/employees/:id", () => HttpResponse.json(employee())));
    renderApp(`/employees/${ID}`);

    expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByText("£120,000.00")).toBeInTheDocument();
  });

  it("shows a not-found state on 404", async () => {
    server.use(
      http.get("/api/employees/:id", () => HttpResponse.json({ error: { code: "NOT_FOUND", message: "x" } }, { status: 404 })),
    );
    renderApp(`/employees/${ID}`);

    expect(await screen.findByText("Employee not found")).toBeInTheDocument();
  });
});

describe("create employee", () => {
  it("posts the form and navigates to the new employee", async () => {
    let body: unknown;
    const created = employee({ id: ID, name: "Grace Hopper" });
    server.use(
      http.post("/api/employees", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(created, { status: 201 });
      }),
      http.get("/api/employees/:id", () => HttpResponse.json(created)),
    );

    renderApp("/employees/new");
    await screen.findByRole("heading", { name: "New employee" });
    await fillForm({ name: "Grace Hopper", email: "grace@acme.example", currency: "USD" });
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByRole("heading", { name: "Grace Hopper" })).toBeInTheDocument();
    expect(body).toMatchObject({ name: "Grace Hopper", email: "grace@acme.example", salaryAmount: 150000, salaryCurrency: "USD" });
    expect(screen.getByText("Employee created")).toBeInTheDocument();
  });

  it("blocks invalid input client-side without calling the API", async () => {
    const onPost = vi.fn();
    server.use(http.post("/api/employees", () => { onPost(); return HttpResponse.json(employee()); }));

    renderApp("/employees/new");
    await userEvent.click(await screen.findByRole("button", { name: "Create" }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
    expect(onPost).not.toHaveBeenCalled();
  });

  it("maps a 409 duplicate-email error onto the email field", async () => {
    server.use(
      http.post("/api/employees", () =>
        HttpResponse.json({ error: { code: "CONFLICT", message: "An employee with this email already exists" } }, { status: 409 }),
      ),
    );

    renderApp("/employees/new");
    await screen.findByRole("heading", { name: "New employee" });
    await fillForm({ name: "Ada", email: "dupe@acme.example", currency: "USD" });
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("An employee with this email already exists")).toBeInTheDocument();
  });
});

describe("edit employee", () => {
  it("loads, submits a PUT, and navigates back to the detail", async () => {
    let body: unknown;
    server.use(
      http.get("/api/employees/:id", () => HttpResponse.json(employee())),
      http.put("/api/employees/:id", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(employee({ name: "Ada L." }));
      }),
    );

    renderApp(`/employees/${ID}/edit`);
    const nameInput = await screen.findByLabelText("Name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Ada L.");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(body).toMatchObject({ name: "Ada L." }));
    expect(await screen.findByText("Employee updated")).toBeInTheDocument();
  });
});

describe("delete employee", () => {
  it("confirms in a dialog, deletes, and returns to the directory", async () => {
    const onDelete = vi.fn();
    server.use(
      http.get("/api/employees/:id", () => HttpResponse.json(employee())),
      http.delete("/api/employees/:id", () => { onDelete(); return new HttpResponse(null, { status: 204 }); }),
      http.get("/api/employees", () =>
        HttpResponse.json({ data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
      ),
    );

    renderApp(`/employees/${ID}`);
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    // Confirm inside the dialog (the second "Delete" button).
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalled());
    expect(await screen.findByRole("heading", { name: "Directory" })).toBeInTheDocument();
  });
});
