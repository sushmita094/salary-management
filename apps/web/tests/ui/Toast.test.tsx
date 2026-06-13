import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "../../src/components/ui/Toast";
import { useToast } from "../../src/components/ui/toast-context";

function Trigger() {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast("Saved", "success")}>
      Show toast
    </button>
  );
}

describe("Toast", () => {
  it("shows a toast in the live region when triggered", async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show toast" }));
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });
});
