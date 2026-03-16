import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

type StrReplaceCommand =
  | "create"
  | "str_replace"
  | "insert"
  | "view"
  | "undo_edit";

const COMMAND_LABELS: Record<StrReplaceCommand, string> = {
  create: "Creating",
  str_replace: "Editing",
  insert: "Editing",
  view: "Reading",
  undo_edit: "Reverting",
};

function getLabel(args: Record<string, unknown>): string {
  const command = args?.command as StrReplaceCommand | undefined;
  const path = args?.path as string | undefined;

  const prefix =
    command && command in COMMAND_LABELS
      ? COMMAND_LABELS[command]
      : "Working on a file";

  if (!path) return prefix === "Working on a file" ? prefix : `${prefix} a file`;

  const filename = path.split("/").pop() ?? path;
  return `${prefix} ${filename}`;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const { state, args } = toolInvocation;
  const isDone =
    state === "result" &&
    "result" in toolInvocation &&
    toolInvocation.result != null;

  const label = getLabel((args as Record<string, unknown>) ?? {});

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
