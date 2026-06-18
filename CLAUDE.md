# Project Engineering Rules

These rules apply to EVERY task, feature, bugfix, refactor, and code review.

---

## Core Principles

### DRY (Don't Repeat Yourself)

* Avoid duplicated logic.
* Before creating new code, always search for existing implementations that can be reused, extended, or refactored.
* Reuse existing modules, services, utilities, hooks, and components whenever possible.
* Extract common behavior into reusable abstractions instead of duplicating logic.

### KISS (Keep It Simple, Stupid)

* Always implement the simplest solution that satisfies the requirements.
* Avoid premature optimization.
* Avoid unnecessary abstractions and design patterns.
* Favor readability and maintainability over clever code.

### Readability First

* Code must be easy to understand by a developer discovering the project.
* Prefer explicit code over implicit behavior.
* Reduce complexity whenever possible.
* Favor clear and straightforward implementations.

---

## Code Organization

* Keep files and functions reasonably short and focused on a single responsibility.
* When a file or function becomes difficult to understand, navigate, test, or maintain, split it into smaller cohesive units.
* Group related code by feature and responsibility.
* Avoid mixing unrelated concerns in the same module.
* Prefer composition over monolithic implementations.
* Avoid "god files" and "god classes".
* Prioritize maintainable structure over convenience or minimal file count.

---

## File Structure

* Organize the project into clear, logical folders.
* Create subdirectories when a folder becomes too crowded or contains multiple responsibilities.
* Maintain consistent architecture across the project.
* Prefer feature-based organization when applicable.

---

## Documentation (MANDATORY)

Every change to the codebase must include proper documentation updates.

### File-level documentation

Each source file must include a header explaining:

* Purpose of the file
* Responsibilities
* Key dependencies
* How it fits into the system

### Functions

Every function must include a docstring describing:

* Purpose
* Parameters (with types if applicable)
* Return values
* Exceptions (if any)
* Side effects (if relevant)

### Classes / Objects

Every class or object must include a docstring describing:

* Responsibility
* Usage
* Behavior
* Key interactions

### Public APIs

All public interfaces must be documented clearly and completely.

### Documentation Synchronization

After every change:

* Update README.md if behavior, setup, or usage changes.
* **Update CONTEXT.md** if any of the following changes: module added/removed/renamed, Socket.IO events, cube data model, business rules, visual rendering logic, stack or conventions. CONTEXT.md is the primary orientation file read at the start of every session — keep it accurate.
* Update architecture or design documents if structure changes.
* Update API documentation if interfaces change.
* Update examples if needed.
* Remove or correct outdated documentation.

---

## Testing (MANDATORY)

### Requirements

* Every new feature must include tests.
* Every bugfix must include a regression test.
* Existing tests must be updated when behavior changes.
* No task is considered complete without tests.

### Test coverage expectations

* Normal cases
* Edge cases
* Error handling cases

### Test quality

* Tests must be readable and maintainable.
* Tests must clearly express expected behavior.
* Avoid overly complex test setups.

---

## Refactoring

Refactoring is encouraged when:

* Code duplication is detected
* Files or functions are too large or unclear
* Responsibilities are mixed
* Architecture becomes inconsistent or confusing

Refactoring goals:

* Improve readability
* Improve maintainability
* Improve modularity
* Improve testability

---

## Before Coding

Claude must:

1. Analyze existing implementation.
2. Search for reusable code.
3. Identify duplication opportunities.
4. Identify simplification opportunities.
5. Identify refactoring opportunities.
6. Verify consistency with project structure.

---

## After Coding

Claude must:

1. Run or update tests.
2. Verify DRY compliance.
3. Verify KISS compliance.
4. Verify file organization quality.
5. Verify function size and clarity.
6. Ensure documentation is complete and up to date.
7. Ensure no duplication was introduced.
8. Ensure tests fully cover the changes.

---

## Task Completion Checklist

A task is NOT complete unless ALL conditions are met:

* [ ] DRY respected
* [ ] KISS respected
* [ ] No unnecessary complexity introduced
* [ ] Files and functions remain reasonably short and focused on a single responsibility
* [ ] Code is readable and maintainable
* [ ] Proper folder structure maintained
* [ ] Docstrings added or updated
* [ ] File-level documentation added or updated
* [ ] Tests created or updated
* [ ] All tests pass
* [ ] README updated if required
* [ ] Architecture documentation updated if required
* [ ] CONTEXT.md updated if modules, events, data model, business rules or conventions changed

---

## Required Final Report

At the end of every task, Claude must provide:

### Changes Made

* Summary of modifications

### DRY Check

* Assessment of duplication handling

### KISS Check

* Assessment of simplicity

### Documentation Updated

* List of updated files

### Tests

* Created/updated tests
* Execution result

### Refactoring Performed

* Summary of structural improvements

### Remaining Technical Debt

* Any known issues left unresolved
