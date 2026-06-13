import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { authenticatedMe } from "../msw/handlers";
import { server } from "../msw/server";
import { renderApp } from "../utils";

const csvFile = () => new File(["name,email\nAda,ada@acme.example"], "employees.csv", { type: "text/csv" });

beforeEach(() => server.use(authenticatedMe()));

describe("import UI", () => {
  it("uploads a file and shows the per-row report (counts + skipped rows)", async () => {
    server.use(
      http.post("/api/import", () =>
        HttpResponse.json({
          inserted: 1,
          updated: 0,
          failed: 1,
          rowErrors: [{ row: 3, errors: ["email: Invalid email address"] }],
        }),
      ),
    );
    renderApp("/import-export");

    await userEvent.upload(await screen.findByLabelText("Spreadsheet file"), csvFile());
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(await screen.findByText("Inserted")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    // The skipped row is shown with its row number and message.
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("email: Invalid email address")).toBeInTheDocument();
  });

  it("surfaces a clear header-mismatch error", async () => {
    server.use(
      http.post("/api/import", () =>
        HttpResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Spreadsheet headers do not match the expected format",
              details: { missing: ["name"], expected: [], received: [] },
            },
          },
          { status: 400 },
        ),
      ),
    );
    renderApp("/import-export");

    await userEvent.upload(await screen.findByLabelText("Spreadsheet file"), csvFile());
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Spreadsheet headers do not match the expected format");
    expect(alert).toHaveTextContent("Missing columns: name");
  });
});

describe("export UI", () => {
  const directoryHandler = () =>
    http.get("/api/employees", () =>
      HttpResponse.json({ data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
    );

  it("exports the active filtered view with the chosen format (no pagination params)", async () => {
    const exports: URL[] = [];
    server.use(
      directoryHandler(),
      http.get("/api/export", ({ request }) => {
        exports.push(new URL(request.url));
        return new HttpResponse("name,email\n", { headers: { "Content-Type": "text/csv" } });
      }),
    );
    renderApp("/employees?country=Germany");
    await screen.findByRole("button", { name: "Export" });

    await userEvent.click(screen.getByRole("button", { name: "Export" }));

    await waitFor(() => expect(exports.length).toBe(1));
    const url = exports[0]!;
    expect(url.searchParams.get("country")).toBe("Germany");
    expect(url.searchParams.get("format")).toBe("csv");
    expect(url.searchParams.has("page")).toBe(false);
    expect(url.searchParams.has("pageSize")).toBe(false);
  });

  it("exports as Excel when the format is switched", async () => {
    const exports: URL[] = [];
    server.use(
      directoryHandler(),
      http.get("/api/export", ({ request }) => {
        exports.push(new URL(request.url));
        return new HttpResponse("binary", {
          headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        });
      }),
    );
    renderApp("/employees");
    await screen.findByLabelText("Export format");

    await userEvent.selectOptions(screen.getByLabelText("Export format"), "xlsx");
    await userEvent.click(screen.getByRole("button", { name: "Export" }));

    await waitFor(() => expect(exports.some((u) => u.searchParams.get("format") === "xlsx")).toBe(true));
  });
});
