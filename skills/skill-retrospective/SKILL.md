---
name: skill-retrospective
description: Turn a coding-agent failure, repeated correction, or unexpectedly costly task into a small, evidence-backed reusable skill. Use after a completed task when a procedure may prevent recurrence; propose changes, validate them against a representative task corpus, and require explicit approval before promotion.
---

# Skill Retrospective

## Purpose

Improve reusable procedures, not the agent's personality or core instructions. A candidate must be narrow, grounded in an observed outcome, and measurable.

Do **not** silently alter global prompts, existing skills, model settings, tools, or project configuration. Do not call a task a success merely because the retrospective sounds plausible.

## When to use

Use only after one of these signals:

- A task failed or produced a regression.
- The user needed to correct the agent more than once.
- The agent repeated a failed approach.
- A task consumed materially more time, tokens, or tool calls than comparable work.
- A success revealed a procedure that is likely reusable in the same project or domain.

Do not use for isolated typos, one-off product decisions, or generic advice such as “be more careful.”

## Workflow

### 1. Capture evidence

Create a concise incident record; do not rely on model recollection alone.

```markdown
## Incident
- Task:
- Expected outcome:
- Observed outcome:
- Evidence: commands, test results, review findings, or user correction
- Root cause: observed fact; label uncertainty explicitly
- Scope: project, language/toolchain, or task type
```

If there is no concrete evidence, stop and record no skill change.

### 2. Decide whether a skill is warranted

A candidate is warranted only when all are true:

- It describes a repeatable decision or procedure.
- Its trigger can be stated precisely.
- It has an observable validation step.
- It is more specific than a general instruction already available.

Otherwise, retain the incident only. Do not create a “lesson learned” skill.

### 3. Draft the smallest candidate

Draft a proposal; do not promote it yet. Keep it under roughly 250 words unless a tool contract requires more.

```markdown
## Candidate skill change
- Name / target file:
- Trigger:
- Preconditions:
- Procedure: 3–7 imperative steps
- Validation:
- Non-goals / boundaries:
- Expiry or review condition:
- Expected benefit:
- Risk of regression:
```

Prefer a project skill (`.pi/skills/`) for repository-specific rules. Use a user skill only when the procedure transfers across projects.

### 4. Build a small regression corpus

Use 3–10 representative fixtures or completed tasks that can be reproduced safely. Evaluate in disposable worktrees or sandboxes by default. Do not permit production writes, secrets, network side effects, or irreversible operations. Obtain explicit approval before any costly or externally visible evaluation. Include:

- the incident task or a faithful reproduction;
- at least one adjacent task where the candidate should help;
- at least one task where it must not trigger.

For each case, define an objective observable pass condition. Prefer tests, builds, linting, or exact artifacts over an LLM judge. A saved trace may provide baseline evidence, but never proves the candidate's impact.

### 5. Evaluate against a baseline

Run paired baseline and candidate executions on the same pinned inputs, model/settings, and objective checks. Preserve the exact commands and outcome summaries. Record only measurable outcomes:

```markdown
| Case | Baseline | Candidate | Result | Notes |
|---|---|---|---|---|
```

Reject the candidate if it causes a correctness regression, expands its trigger without evidence, or adds substantial overhead without a clear benefit. Do not optimize a single incident while degrading adjacent tasks. If paired execution is impossible, label it **unvalidated proposal**; do not promote it.

### 6. Request promotion approval

Present the incident, candidate diff, corpus results, and residual risks. Wait for the user's explicit approval before creating, editing, replacing, deleting, moving, installing, enabling, or otherwise changing any skill or related configuration.

After approval:

1. Make the smallest edit.
2. Run the declared validation.
3. If the target's maintenance convention has a change log, add a dated entry with a sanitized, non-sensitive identifier and the corpus result. Keep detailed evidence in a separate access-controlled retrospective artifact.

## Quality bar

A promoted skill must be:

- **Triggered:** clear conditions for when it applies.
- **Executable:** concrete actions, not aspirations.
- **Bounded:** explicit non-goals and stop conditions.
- **Verifiable:** at least one concrete check.
- **Non-duplicative:** does not restate an existing rule.
- **Reversible:** has a review date, expiry condition, or clear deletion criterion.

## Anti-patterns

Reject proposals that:

- rewrite system prompts based on one task;
- use self-critique as the only evidence;
- add “always” rules without a bounded trigger;
- preserve lengthy task transcripts inside a skill;
- measure only whether the agent followed the new wording;
- automatically promote or mutate skills without approval.

## Output

Return a concise report with:

1. **Decision:** no change, proposed, promoted, or rejected.
2. **Evidence and root cause.**
3. **Candidate procedure** (if proposed).
4. **Corpus and baseline comparison.**
5. **Risks, expiry/review condition, and next action.**
