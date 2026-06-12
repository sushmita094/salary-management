import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "../src/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders its label", () => {
    render(<StatusBadge label="API: ok" ok />);
    expect(screen.getByText("API: ok")).toBeInTheDocument();
  });
});
