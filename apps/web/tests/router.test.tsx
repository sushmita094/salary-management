import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "../src/app/router";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("app routing & shell", () => {
  it("renders the shell with primary nav and the routed page", () => {
    renderAt("/employees");

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Directory" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Directory" })).toBeInTheDocument();
  });

  it("redirects the index route to the directory", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { name: "Directory" })).toBeInTheDocument();
  });

  it("shows the not-found page (inside the shell) for an unknown route", () => {
    renderAt("/does-not-exist");
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });

  it("renders the login route outside the shell (no nav)", () => {
    renderAt("/login");
    expect(screen.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument();
  });
});
