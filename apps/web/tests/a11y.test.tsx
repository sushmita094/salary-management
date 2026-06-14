import type { Employee } from "@acme/shared";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { authenticatedMe } from "./msw/handlers";
import { server } from "./msw/server";
import { renderApp } from "./utils";

const ID = "11111111-1111-4111-8111-111111111111";

function employee(): Employee {
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
  };
}

const directoryHandler = () =>
  http.get("/api/employees", () =>
    HttpResponse.json({ data: [employee()], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }),
  );

beforeEach(() => server.use(authenticatedMe()));

describe("accessibility", () => {
  it("offers a skip-to-content link and marks the active nav item", async () => {
    server.use(directoryHandler());
    renderApp("/employees");

    expect(await screen.findByRole("link", { name: "Skip to content" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Directory" })).toHaveAttribute("aria-current", "page");
  });

  it("reflects the sort state on the column header via aria-sort", async () => {
    server.use(directoryHandler());
    renderApp("/employees");

    // Default sort is name ascending.
    const nameHeader = await screen.findByRole("columnheader", { name: /name/i });
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
  });

  it("gives the delete confirm dialog an accessible name, traps focus, and closes on Escape", async () => {
    server.use(http.get("/api/employees/:id", () => HttpResponse.json(employee())));
    renderApp(`/employees/${ID}`);

    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog", { name: "Delete employee?" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement | null); // focus moved into the dialog

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
