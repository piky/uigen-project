import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  args: Record<string, unknown>,
  state: "call" | "result" | "partial-call" = "result"
): ToolInvocation {
  const base = {
    toolCallId: "test-id",
    toolName: "str_replace_editor",
    args,
  };
  if (state === "result") {
    return { ...base, state: "result", result: "Success" };
  }
  if (state === "partial-call") {
    return { ...base, state: "partial-call" };
  }
  return { ...base, state: "call" };
}

// ── Label tests ───────────────────────────────────────────────────────────────

test("shows 'Creating <filename>' for create command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation({ command: "create", path: "/src/App.jsx" })} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation({ command: "str_replace", path: "/components/Button.tsx" })} />);
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("shows 'Editing <filename>' for insert command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation({ command: "insert", path: "/lib/utils.ts" })} />);
  expect(screen.getByText("Editing utils.ts")).toBeDefined();
});

test("shows 'Reading <filename>' for view command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation({ command: "view", path: "/public/index.html" })} />);
  expect(screen.getByText("Reading index.html")).toBeDefined();
});

test("shows 'Reverting <filename>' for undo_edit command", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation({ command: "undo_edit", path: "/src/main.tsx" })} />);
  expect(screen.getByText("Reverting main.tsx")).toBeDefined();
});

test("shows 'Working on a file' fallback when args are empty", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation({})} />);
  expect(screen.getByText("Working on a file")).toBeDefined();
});

test("shows '<prefix> a file' when command is known but path is missing", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation({ command: "create" })} />);
  expect(screen.getByText("Creating a file")).toBeDefined();
});

test("uses the basename of a deeply nested path", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation({ command: "str_replace", path: "/a/b/c/d/DeepFile.tsx" })} />);
  expect(screen.getByText("Editing DeepFile.tsx")).toBeDefined();
});

// ── State tests ───────────────────────────────────────────────────────────────

test("renders green dot (no spinner) when state is 'result'", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation({ command: "create", path: "/src/App.jsx" }, "result")} />
  );
  // Green dot presence
  const dot = container.querySelector(".bg-emerald-500");
  expect(dot).not.toBeNull();
  // No spinner
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeNull();
});

test("renders spinner (no green dot) when state is 'call'", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation({ command: "create", path: "/src/App.jsx" }, "call")} />
  );
  // Spinner presence
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
  // No green dot
  const dot = container.querySelector(".bg-emerald-500");
  expect(dot).toBeNull();
});

test("renders spinner when state is 'partial-call'", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation({ command: "create", path: "/src/App.jsx" }, "partial-call")} />
  );
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
});
