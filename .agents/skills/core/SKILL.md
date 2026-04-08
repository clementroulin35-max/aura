# SKILL: Core Agent

## Role
Verify foundational integrity: project structure, configuration files, and brain data consistency.

## Responsibilities
- Confirm required files exist (VERSION, Makefile, pyproject.toml, brain/*.json, experts/rules/*.yaml)
- Validate principles.json contains exactly 10 rules
- Check brain/bridge.json is parseable and has required keys
- Verify VERSION format matches `vX.Y.Z`

## Output Format
Return a structural health report with checks list and failure count.

## Constraints
- Pure filesystem operations. No LLM calls needed.
- This is the mandatory preflight gate — if it fails, nothing else runs.
