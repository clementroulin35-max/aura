# Optimization of Git Workflow and Makefile

The current Git strategy is well-defined in `processus_git.md` using three branches (`flash`, `high`, `main`). However, transitions between these branches and their corresponding LLM tiers (FAST vs HIGH) are currently manual or partially automated.

This plan aims to harden these transitions and provide a more fluid developer experience.

## User Review Required

> [!IMPORTANT]
> The `make handover` command will perform an automatic merge of `flash` into `high`. This assumes that `flash` is the source of truth for recent development and `high` is the staging area for LLM-enhanced review.

## Proposed Changes

### [Makefile](file:///c:/Users/Clement/Gravity/AdaptativeIA/orion_v3/Makefile)

#### [MODIFY] [Makefile](file:///c:/Users/Clement/Gravity/AdaptativeIA/orion_v3/Makefile)
- Add `align-fast` and `align-high` shortcuts.
- Add `handover` command to automate the transition from FAST to HIGH tier.
- Add `back-to-flash` command to return to development after a main promotion.
- Add `checkpoint` command for rapid progress saving on the current branch.
- Add `git-status` for a clear overview of branch synchronization.

### [Documentation]

#### [MODIFY] [processus_git.md](file:///c:/Users/Clement/Gravity/AdaptativeIA/orion_v3/processus_git.md)
- Integrate the new `Makefile` commands into the guide.
- Update the workflow diagrams/steps to use automated commands instead of raw Git commands where possible.

### [Operations]

#### [MODIFY] [ops/promote.py](file:///c:/Users/Clement/Gravity/AdaptativeIA/orion_v3/ops/promote.py)
- Enhance the promotion logic to ensure the `high` branch is actually up to date before pushing to `main`.

## Verification Plan

### Automated Tests
- Run `make test` to ensure no regressions in core logic.
- Verify `make llm-status` displays correct mode after alignment.

### Manual Verification
- Test `make align-fast` and `make align-high` transitions.
- Test `make handover` with dummy changes on `flash`.
- Verify `make git-status` output visibility.
