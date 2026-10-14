# Dependency advisory snapshot

Generated 2026-10-14 by `npm run security:dependencies`. Includes development dependencies.
Counts across roots overlap and must not be added as unique vulnerability counts.
This is a registry snapshot, not a claim that every advisory is exploitable.

| Install root | Critical | High | Moderate | Low | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| `.` | 0 | 5 | 5 | 2 | 12 |
| `src/core` | 0 | 0 | 0 | 0 | 0 |
| `src/ideNew` | 0 | 5 | 5 | 2 | 12 |
| `src/ide-vscode` | 0 | 0 | 0 | 0 | 0 |
| `src/auth` | 0 | 5 | 0 | 0 | 5 |
| `src/kernel` | 0 | 0 | 0 | 0 | 0 |
| `src/monitoring` | 0 | 0 | 0 | 0 | 0 |
| `src/container-agent` | 0 | 0 | 0 | 0 | 0 |
| `docs/site` | 0 | 29 | 0 | 0 | 29 |

## Unresolved upstream advisories

- **low · @ai-sdk/provider-utils**: [@ai-sdk/provider-utils has an Uncontrolled Resource Consumption issue](https://github.com/advisories/GHSA-866g-f22w-33x8). Roots: `.`, `src/ideNew`.
- **high · braces**: [braces vulnerable to stack-exhaustion denial of service through deeply nested patterns](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Roots: `.`, `src/ideNew`, `src/auth`, `docs/site`.
- **moderate · sprintf-js**: [sprintf-js vulnerable to denial of service through unbounded precision specifiers](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). Roots: `.`, `src/ideNew`.

Read [the dependency policy](../dependencies.md) for verification and upgrade scope.
The structured report is in [dependency-audit.json](dependency-audit.json).
