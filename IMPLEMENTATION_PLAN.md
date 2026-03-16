# ToolInvocationBadge Component

Replace the raw `str_replace_editor` tool name displayed in chat messages with a
user-friendly label that describes what file operation is happening (e.g.
**"Creating App.jsx"**, **"Editing Button.tsx"**).

Currently the `tool-invocation` part in [MessageList.tsx](file:///Users/wijai/Repos/temp_repos/uigen/src/components/chat/MessageList.tsx) just renders
`tool.toolName` — i.e. the raw string `str_replace_editor`. The tool args
shipped with every invocation already contain a `command`
(`create` | `str_replace` | `insert` | `view` | `undo_edit`) and a `path`
(the file being operated on), so we have everything needed to produce a
human-readable label at render time.

## Proposed Changes

### New component

#### [NEW] [ToolInvocationBadge.tsx](file:///Users/wijai/Repos/temp_repos/uigen/src/components/chat/ToolInvocationBadge.tsx)

A self-contained presentational component that:
- Accepts the raw `toolInvocation` object as a prop (typed via the Vercel AI SDK's `ToolInvocation` type)
- Derives a human-readable label from `args.command` + `args.path`:
  | command | label prefix |
  |---|---|
  | `create` | `Creating` |
  | `str_replace` | `Editing` |
  | `insert` | `Editing` |
  | `view` | `Reading` |
  | `undo_edit` | `Reverting` |
  | *(unknown / no args)* | `Working on a file` |
- Extracts the **filename** (basename) from `path` using a simple string split
- Shows a **green dot** (completed) or a **spinner** (in-progress), matching the existing badge styling in [MessageList](file:///Users/wijai/Repos/temp_repos/uigen/src/components/chat/MessageList.tsx#13-134)

#### [NEW] [ToolInvocationBadge.test.tsx](file:///Users/wijai/Repos/temp_repos/uigen/src/components/chat/__tests__/ToolInvocationBadge.test.tsx)

Vitest + React Testing Library tests covering:
- `create` command → displays `"Creating App.jsx"`
- `str_replace` command → displays `"Editing Button.tsx"`
- `insert` command → displays `"Editing utils.ts"`
- `view` command → displays `"Reading index.html"`
- `undo_edit` command → displays `"Reverting main.tsx"`
- Missing / empty args → displays `"Working on a file"` fallback
- State `"result"` → renders green dot, no spinner
- State `"call"` (in-progress) → renders spinner, no green dot

---

### Modified file

#### [MODIFY] [MessageList.tsx](file:///Users/wijai/Repos/temp_repos/uigen/src/components/chat/MessageList.tsx)

Replace the inline `tool-invocation` rendering block (lines 65-81) with a call
to `<ToolInvocationBadge toolInvocation={tool} />`.

#### [MODIFY] [MessageList.test.tsx](file:///Users/wijai/Repos/temp_repos/uigen/src/components/chat/__tests__/MessageList.test.tsx)

Update the existing `"MessageList renders messages with parts"` test (line 81)
which currently asserts `screen.getByText("str_replace_editor")` — replace that
assertion with one that checks for the new user-friendly label (e.g.
`"Working on a file"` since the test passes empty args `{}`).

---

## Verification Plan

### Automated Tests

Run the full Vitest suite from the project root:

```bash
cd /Users/wijai/Repos/temp_repos/uigen && npm test -- --run
```

Expected: all existing tests pass + new `ToolInvocationBadge` tests pass.

### Manual Verification

1. Visit `http://localhost:3000` (dev server is already running)
2. Send a message such as *"Create a card with a title and a description"*
3. Observe the tool badge in the assistant reply — it should now read
   something like **"Creating App.jsx"** or **"Editing App.jsx"** instead of `str_replace_editor`
