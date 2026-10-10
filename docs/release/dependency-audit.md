# Dependency advisory snapshot

Generated 2026-10-10 by `npm run security:dependencies`. Includes development dependencies.
Counts across roots overlap and must not be added as unique vulnerability counts.
This is a registry snapshot, not a claim that every advisory is exploitable.

| Install root | Critical | High | Moderate | Low | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| `.` | 0 | 6 | 8 | 4 | 18 |
| `src/core` | 0 | 3 | 4 | 0 | 7 |
| `src/ideNew` | 0 | 5 | 6 | 4 | 15 |
| `src/ide-vscode` | 0 | 0 | 0 | 0 | 0 |
| `src/auth` | 0 | 5 | 0 | 1 | 6 |
| `src/kernel` | 0 | 0 | 0 | 0 | 0 |
| `src/monitoring` | 0 | 0 | 0 | 0 | 0 |
| `src/container-agent` | 0 | 0 | 0 | 0 | 0 |
| `docs/site` | 0 | 29 | 0 | 3 | 32 |

## Unresolved upstream advisories

- **low · @ai-sdk/provider-utils**: [@ai-sdk/provider-utils has an Uncontrolled Resource Consumption issue](https://github.com/advisories/GHSA-866g-f22w-33x8). Roots: `.`, `src/ideNew`.
- **high · braces**: [braces vulnerable to stack-exhaustion denial of service through deeply nested patterns](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Roots: `.`, `src/core`, `src/ideNew`, `src/auth`, `docs/site`.
- **low · dompurify**: [DOMPurify: IN_PLACE: node-removing afterSanitize hook leaves detached subtree event handlers armed, causing DOM XSS](https://github.com/advisories/GHSA-p98j-92pf-mc4p). Roots: `.`, `src/ideNew`.
- **low · dompurify**: [DOMPurify: IN_PLACE returns a force-removed rawtext root whose text carries attacker markup — pure HTML reparse executes](https://github.com/advisories/GHSA-6688-9rhm-gjv2). Roots: `.`, `src/ideNew`.
- **low · esbuild**: [esbuild allows arbitrary file read when running the development server on Windows](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr). Roots: `src/auth`.
- **low · katex**: [KaTeX: Existing prototype pollution can bypass trust restrictions](https://github.com/advisories/GHSA-238p-pmpm-9mq7). Roots: `docs/site`.
- **moderate · sprintf-js**: [sprintf-js vulnerable to denial of service through unbounded precision specifiers](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). Roots: `.`, `src/core`, `src/ideNew`.

Read [the dependency policy](../dependencies.md) for verification and upgrade scope.
The structured report is in [dependency-audit.json](dependency-audit.json).
