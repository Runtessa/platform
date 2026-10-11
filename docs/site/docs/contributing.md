---
title: Contributing
---

<!-- Generated from CONTRIBUTING.md; edit the source guide. -->

# Contributing to Runtessa

Thank you for helping improve the live application platform. The repository is a
developer preview; a small change with clear evidence is easier to review than a
large rewrite. Check existing issues before starting overlapping work.

## Set up

Follow [Getting started](/docs/getting-started). Use Node 22.13+ in the 22.x line
and `npm ci` with the checked-in locks. Generate your own private environment files;
never copy deployment credentials into examples, tests, logs or issues.

The root npm workspace owns Core, IDE, VS Code and shared packages. Auth, Kernel,
monitoring, container-agent and documentation have separate lockfiles. Install those
from their own directories. Do not run independent workspace installs concurrently
against the same dependency tree.

## Component changes

Clone `platform` with `--recurse-submodules`. Work on a branch in the owning
component repository, commit and push there, then commit the updated gitlink in
`platform`. Do not squash the imported histories. Run integration checks from the
workspace root. Existing IDE themes, editor colors and status colors are preserved.

## Before implementing

Describe the problem, expected behavior and proposed scope in an issue for substantial
changes. Keep platform code changes distinct from dynamically authored tenant code.
Preserve live edits, tenant/revision boundaries and compatibility of public APIs.
Read `AGENTS.md` and the relevant source; architecture changes should also follow
the [architecture map](https://github.com/Runtessa/platform/blob/main/docs/site/docs/architecture/idpcore-map.md).

## Code and database changes

- Keep modules focused and dependencies directed toward shared contracts.
- Preserve existing UI components, tokens and Persian/RTL behavior.
- Reject unauthorized tenant access in the server, including resource-ID lookups.
- Run tenant code only through the restricted execution boundary. `node:vm` alone
  is not an isolation mechanism.
- Never edit an applied migration. Add reviewed SQL, dependencies and a new checksum
  entry using the [migration guide](/docs/operations/migrations).
- Do not hand-edit generated bundles, documentation references or dependency files.
  Change their source or generator and rebuild.
- Add behavior tests when the change affects authorization, isolation, data or errors.

## Checks

Use the [README verification commands](https://github.com/Runtessa/platform/blob/main/README.md#development-and-verification) relevant to your
change. For cross-service or security changes, run the full listed checks. Database
tests need Docker/Podman; runtime tests need Linux, bubblewrap and namespaces.

Run `npm run quality:source` to locate reviewed duplicate candidates and syntax
errors. Source comments use stable IDs from the [integrity audit](/docs/project/code-integrity).
When moving code, preserve public exports and add contract coverage first. Refresh
the snapshot with `npm run quality:source -- --output docs/release/source-audit.json`.
Run shared/IDE builds before consumer checks: the IDE build recreates `shared/dist`,
so running it alongside Core compilation or runtime tests can remove their inputs.
Build the shared package before `npm run test:contracts`. Auth and Monitoring tests
also need their separately installed dependencies and disposable container storage.
Run `npm run vscode:test` for an actual isolated extension host; headless Linux CI
uses `xvfb-run --auto-servernum npm run vscode:test`.

For UI changes, also build the affected web application and inspect desktop/mobile
layouts. For documentation, run `npm run docs:build` and check the configured `/platform/`
base path. Use `npm run security:secrets` and `npm run security:history` with
Gitleaks 8.30.1 before submitting; scanners redact findings. Run
`npm run test:secret-scope` after installing Gitleaks to verify publication-ref coverage.

Dependency changes must update the authoritative locks and any standalone service
locks used to package images. Explain major upgrades or remaining advisories.
Use `npm audit` for each install root; do not suppress a finding to obtain a green
report. See [dependency policy](/docs/project/dependencies).

## Pull requests

Use a `codex/` prefix for agent-created branches; other descriptive branch names are
welcome. Include the problem, resulting behavior, checks performed and limitations.
Link the issue when one exists. Keep secrets, private backups, `.env`, build output
and production data out of the diff. A maintainer reviews and merges the change;
opening a PR does not authorize deployment.

By submitting a contribution, you confirm you have the right to submit it and agree
to license it under Apache-2.0. No separate CLA is currently required. Respect
third-party licenses and retain their notices.

## Community

Be respectful and specific. Discuss the code and evidence rather than the person.
Harassment, discrimination, threats and publication of private information are
not welcome. Follow [CODE_OF_CONDUCT.md](https://github.com/Runtessa/platform/blob/main/CODE_OF_CONDUCT.md).
