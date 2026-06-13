import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "../../src/components/ui/EmptyState";

describe("EmptyState", () => {
  it("renders the title, description, and action", () => {
    render(
      <EmptyState
        title="No employees match"
        description="Clear the filters to see everyone."
        action={<button type="button">Clear filters</button>}
      />,
    );

    expect(screen.getByText("No employees match")).toBeInTheDocument();
    expect(screen.getByText("Clear the filters to see everyone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });
});
