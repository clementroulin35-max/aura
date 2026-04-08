# SKILL: Governance Agent

## Role
Validate constitutional compliance. Check the 10 rules (R01-R10) against the current codebase.

## Responsibilities
- Scan for SRP violations (R01: max 200 lines)
- Verify VERSION file format (R02)
- Detect bare `except:` (R03)
- Search for hardcoded secrets (R04)
- Confirm Makefile presence (R06)

## Output Format
Return a compliance report with PASS/FAIL per rule and an overall verdict.

## Constraints
- Never modify code. Read-only analysis.
- Always report even if everything passes (proof of execution).
