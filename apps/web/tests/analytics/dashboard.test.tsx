import type { AnalyticsByDimension, AnalyticsDistribution, AnalyticsSummary } from "@acme/shared";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { authenticatedMe } from "../msw/handlers";
import { server } from "../msw/server";
import { renderApp } from "../utils";

const SUMMARY: AnalyticsSummary = {
  headcount: 7,
  byCurrency: [
    { currency: "USD", headcount: 4, totalSpend: 1_000_000, average: 250_000, median: 250_000 },
    { currency: "EUR", headcount: 3, totalSpend: 210_000, average: 70_000, median: 70_000 },
  ],
};

const BY_DIMENSION: AnalyticsByDimension = {
  dimension: "department",
  groups: [
    { value: "Engineering", currency: "USD", headcount: 2, average: 200_000, median: 200_000, min: 100_000, max: 300_000 },
    { value: "Sales", currency: "USD", headcount: 2, average: 300_000, median: 300_000, min: 200_000, max: 400_000 },
    { value: "Engineering", currency: "EUR", headcount: 2, average: 70_000, median: 70_000, min: 50_000, max: 90_000 },
  ],
};

const distribution = (currency: string): AnalyticsDistribution => ({
  bucketCount: 10,
  currencies: [
    {
      currency,
      min: 100_000,
      max: 400_000,
      bands: [
        { from: 100_000, to: 200_000, count: 5 },
        { from: 200_000, to: 300_000, count: 3 },
        { from: 300_000, to: 400_000, count: 1 },
      ],
    },
  ],
});

function analyticsHandlers(sink?: { dimensions: string[]; distribution: URL[] }) {
  return [
    http.get("/api/analytics/summary", () => HttpResponse.json(SUMMARY)),
    http.get("/api/analytics/by/:dimension", ({ params }) => {
      sink?.dimensions.push(String(params.dimension));
      return HttpResponse.json(BY_DIMENSION);
    }),
    http.get("/api/analytics/distribution", ({ request }) => {
      const url = new URL(request.url);
      sink?.distribution.push(url);
      return HttpResponse.json(distribution(url.searchParams.get("currency") ?? "USD"));
    }),
  ];
}

beforeEach(() => server.use(authenticatedMe()));

describe("analytics dashboard", () => {
  it("renders per-currency summary cards (incl. median) and never a cross-currency total", async () => {
    server.use(...analyticsHandlers());
    renderApp("/analytics");

    // Each currency's figures, labelled by currency.
    expect(await screen.findByText("$1,000,000")).toBeInTheDocument();
    expect(screen.getByText("€210,000")).toBeInTheDocument();
    expect(screen.getAllByText("$250,000").length).toBeGreaterThan(0); // USD median

    // Guard: the combined cross-currency total (1,210,000) must never appear.
    expect(screen.queryByText(/1,210,000/)).not.toBeInTheDocument();
  });

  it("switches the dimension and refetches by/:dimension", async () => {
    const sink = { dimensions: [] as string[], distribution: [] as URL[] };
    server.use(...analyticsHandlers(sink));
    renderApp("/analytics");
    await screen.findByText("$1,000,000");

    await userEvent.selectOptions(screen.getByLabelText("Dimension"), "country");

    await waitFor(() => expect(sink.dimensions).toContain("country"));
  });

  it("switches currency and re-renders the comparison for that currency", async () => {
    server.use(...analyticsHandlers());
    renderApp("/analytics");

    // USD is the default: the comparison shows USD min ($100,000), not the EUR one.
    expect(await screen.findByText("$100,000")).toBeInTheDocument();
    expect(screen.queryByText("€50,000")).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Currency"), "EUR");

    expect(await screen.findByText("€50,000")).toBeInTheDocument();
  });

  it("maps distribution bands to a table and refetches on band-count change", async () => {
    const sink = { dimensions: [] as string[], distribution: [] as URL[] };
    server.use(...analyticsHandlers(sink));
    renderApp("/analytics");
    await screen.findByText("$1,000,000");

    // The band table shows each band's range and count.
    expect(await screen.findByText("$100,000 – $200,000")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Number of bands"), "5");
    await waitFor(() => expect(sink.distribution.some((u) => u.searchParams.get("bucketCount") === "5")).toBe(true));
  });

  it("shows an empty state when there is no data", async () => {
    server.use(http.get("/api/analytics/summary", () => HttpResponse.json({ headcount: 0, byCurrency: [] })));
    renderApp("/analytics");

    expect(await screen.findByText("No analytics yet")).toBeInTheDocument();
  });

  it("shows a retryable error state on failure", async () => {
    server.use(
      http.get("/api/analytics/summary", () => HttpResponse.json({ error: { code: "X", message: "boom" } }, { status: 500 })),
    );
    renderApp("/analytics");

    expect(await screen.findByText("Couldn’t load analytics")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
