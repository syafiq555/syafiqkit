---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

Turn ideas into fully formed designs through collaborative dialogue. Every project goes through this process regardless of perceived simplicity — "simple" projects are where unexamined assumptions cause the most wasted work.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, or scaffold any project until you have presented a design and the user has approved it.

**Escape hatch**: If the user explicitly says "skip design", "just implement", or "I already know what I want" — acknowledge and delegate to implementation immediately.
</HARD-GATE>

## Constraints

| ❌ Never | ✅ Always |
|----------|----------|
| Skip design for "simple" projects | Present a design (even if a few sentences) and get approval |
| Ask multiple questions per message | One question at a time via `AskUserQuestion` tool |
| Use plain text questions | Use `AskUserQuestion` with multiple-choice options |
| Include speculative features | Apply YAGNI ruthlessly |
| Invoke any implementation skill before design approval | Wait for explicit user approval before any implementation |

## Steps

Complete in order:

### 1. Explore project context
Check files, docs, recent commits to understand current state.

### 2. Ask clarifying questions
Use the `AskUserQuestion` tool for every question. One question per message, focus on purpose, constraints, and success criteria. Prefer multiple-choice options over open-ended questions.

### 3. Propose 2-3 approaches
Use `AskUserQuestion` to present the approaches as options. Lead with your recommendation and include trade-offs in the option descriptions.

### 4. Present design
Scale each section to its complexity — a few sentences if straightforward, up to 200-300 words if nuanced. Cover: architecture, components, data flow, error handling, testing.

After each section, use `AskUserQuestion` to ask if it looks right (options: "Looks good", "Needs changes"). Revise until approved.

### 5. Transition to implementation
Present a concise implementation plan inline and ask the user how they want to proceed.