import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { authenticatedMe } from "./msw/handlers";
import { server } from "./msw/server";
import { renderApp } from "./utils";

async function signIn() {
  await userEvent.type(screen.getByLabelText("Email"), "hr@acme.example");
  await userEvent.type(screen.getByLabelText("Password"), "s3cret-password");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("authentication", () => {
  it("redirects an unauthenticated deep link to the login page", async () => {
    renderApp("/employees");

    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument();
  });

  it("signs in with valid credentials and lands on the directory", async () => {
    renderApp("/login");
    await screen.findByRole("button", { name: "Sign in" });

    // After login the session probe should report the user.
    server.use(authenticatedMe());
    await signIn();

    expect(await screen.findByRole("heading", { name: "Directory" })).toBeInTheDocument();
    expect(screen.getByText("hr@acme.example")).toBeInTheDocument();
  });

  it("shows an inline error for invalid credentials", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid email or password" } }, { status: 401 }),
      ),
    );
    renderApp("/login");
    await screen.findByRole("button", { name: "Sign in" });

    await signIn();

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(screen.queryByRole("heading", { name: "Directory" })).not.toBeInTheDocument();
  });

  it("validates the form before calling the API", async () => {
    renderApp("/login");
    await userEvent.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it("signs out back to the login page", async () => {
    server.use(authenticatedMe());
    renderApp("/employees");

    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
