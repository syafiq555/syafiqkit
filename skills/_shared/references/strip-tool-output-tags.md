# Strip Tool-Output Wrapper Tags Before Write

Referenced by every skill that does a full-file `Write` rewrite sourced from a prior `Read` (condense-task-doc, condense-claude-md, task-summary, update-claude-docs, merge-task-docs).

⚠️ **If the content came into context via a `Read` result (including inside a delegated agent), strip any `<content>`/`</content>` or other tool-framing tags before writing.** A `Read` result wraps file content in these tags; a full-file rewrite that echoes the Read result back out (directly, or via a drafting agent that saw the same Read) can carry the wrapper into the `Write` payload as a literal trailing line.

**Verify**: after writing, confirm the file's last line is real content — not a leaked tag. `git diff HEAD -- <file>` and check the final `+` line, or `tail -c 40 <file>`.
