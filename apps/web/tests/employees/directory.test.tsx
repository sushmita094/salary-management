import type { Employee } from "@acme/shared";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { authenticatedMe } from "../msw/handlers";
import { server } from "../msw/server";
import { renderApp } from "../utils";

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: crypto.randomUUID(),
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

/** Capture every /employees request URL, and reply with a page (overridable). */
function directoryHandler(reply: (url: URL) => Response, sink?: URL[]) {
  return http.get("/api/employees", ({ request }) => {
    const url = new URL(request.url);
    sink?.push(url);
    return reply(url);
  });
}

const page = (rows: Employee[], meta: Partial<{ total: number; totalPages: number; page: number }> = {}) =>
  HttpResponse.json({
    data: rows,
    pagination: { page: 1, pageSize: 20, total: rows.length, totalPages: 1, ...meta },
  });

beforeEach(() => server.use(authenticatedMe()));

describe("employee directory", () => {
  it("renders a page of employees with local-currency salaries", async () => {
    server.use(
      directoryHandler(() => page([employee({ name: "Grace Hopper", salaryAmount: 180000, salaryCurrency: "USD" })])),
    );
    renderApp("/employees");

    expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("$180,000.00")).toBeInTheDocument();
  });

  it("always requests a bounded page (never the whole table)", async () => {
    const requests: URL[] = [];
    server.use(directoryHandler(() => page([employee()]), requests));
    renderApp("/employees");

    await screen.findByText("Ada Lovelace");
    expect(requests[0]?.searchParams.get("pageSize")).toBe("20");
    expect(requests[0]?.searchParams.get("page")).toBe("1");
  });

  it("debounces search into the query and refetches", async () => {
    const requests: URL[] = [];
    server.use(directoryHandler(() => page([employee()]), requests));
    renderApp("/employees");
    await screen.findByText("Ada Lovelace");

    await userEvent.type(screen.getByPlaceholderText("Name or email…"), "grace");

    await waitFor(() => expect(requests.some((u) => u.searchParams.get("search") === "grace")).toBe(true));
  });

  it("filters by a select and sorts by a column header", async () => {
    const requests: URL[] = [];
    server.use(directoryHandler(() => page([employee()]), requests));
    renderApp("/employees");
    await screen.findByText("Ada Lovelace");

    await userEvent.selectOptions(screen.getByLabelText("Country"), "Germany");
    await waitFor(() => expect(requests.some((u) => u.searchParams.get("country") === "Germany")).toBe(true));

    await userEvent.click(screen.getByRole("button", { name: /country/i }));
    await waitFor(() => expect(requests.some((u) => u.searchParams.get("sort") === "country")).toBe(true));
  });

  it("pages forward, requesting the next page", async () => {
    const requests: URL[] = [];
    server.use(directoryHandler(() => page([employee()], { total: 50, totalPages: 3 }), requests));
    renderApp("/employees");
    await screen.findByText("Ada Lovelace");

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(requests.some((u) => u.searchParams.get("page") === "2")).toBe(true));
  });

  it("shows an empty state with a clear-filters action when filtered to nothing", async () => {
    server.use(directoryHandler(() => page([], { total: 0, totalPages: 0 })));
    renderApp("/employees?country=Japan");

    expect(await screen.findByText("No employees match")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });

  it("shows a retryable error state on failure", async () => {
    server.use(
      directoryHandler(() => HttpResponse.json({ error: { code: "INTERNAL", message: "boom" } }, { status: 500 })),
    );
    renderApp("/employees");

    expect(await screen.findByText("Couldn’t load employees")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("links each row to its detail route", async () => {
    const id = "11111111-1111-4111-8111-111111111111";
    server.use(directoryHandler(() => page([employee({ id, name: "Ada Lovelace" })])));
    renderApp("/employees");

    const link = await screen.findByRole("link", { name: "Ada Lovelace" });
    expect(link).toHaveAttribute("href", `/employees/${id}`);
  });
});
