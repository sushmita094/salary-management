import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { authenticatedMe } from "./msw/handlers";
import { server } from "./msw/server";
import { renderApp } from "./utils";

describe("app routing & shell", () => {
  // These routes are guarded, so sign the session in for the shell assertions.
  beforeEach(() => server.use(authenticatedMe()));

  it("renders the shell with primary nav and the routed page", async () => {
    renderApp("/employees");

    expect(await screen.findByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Directory" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Directory" })).toBeInTheDocument();
  });

  it("redirects the index route to the directory", async () => {
    renderApp("/");
    expect(await screen.findByRole("heading", { name: "Directory" })).toBeInTheDocument();
  });

  it("shows the not-found page (inside the shell) for an unknown route", async () => {
    renderApp("/does-not-exist");
    expect(await screen.findByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });
});
