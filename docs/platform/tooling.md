# Development and operations tools

The browser Studio is the main authoring surface. The repository also contains
local development and operational tools. Configure only the integrations required
by your installation; none replaces tenant authorization or deployment policy.

## VS Code tenant development

The extension in `src/ide-vscode` can pull a tenant workspace into a local directory,
show modules/models/UI/shared/ACL resources, create files, push changes and open a
tenant preview. Preview uses the same `preview.html` contract as the browser Studio.

Configure the Core/IDE connection and tenant hostname through the extension's
connection command, then sign in through its IDE browser flow. The main commands are:

| Command | Purpose |
| --- | --- |
| Configure Connection | Select the target installation and tenant |
| Sign In to ideNew | Establish IDE authoring access |
| Pull Tenant Workspace | Materialize the selected workspace locally |
| Push Active File / Push All Changes | Save local changes through IDE APIs |
| Open Tenant Preview | Open draft/published preview |
| Open Codex Terminal / Run Codex Prompt | Work with the pulled tenant through Codex |

Use `npm run vscode:host` from the repository root to open the local extension
Development Host. This is a source development workflow, not a claim of marketplace
publication. See the [extension README](../../src/ide-vscode/README.md) for settings.

## Assistant and Codex

Studio assistant code lives in `src/ideNew/src/lib/assistant`; its editor panels
live under `components/editor/ai-panel`. The workspace tools cover modules, models,
UI, ACL and shared files. Code-contract checks guide generated code toward the
injected adapters and Kernel client rather than direct browser database access.

The optional `src/codex-gateway` wraps Codex CLI sessions with HTTP/SSE interfaces
for workspace execution and streamed output. Its image pins the CLI version, and
installation/provider credentials are configured outside Git.

An assistant proposal still needs a valid tenant/resource scope and the normal
save/review/publication workflow. AI output does not establish runtime correctness.
Use the preview, source diff and relevant checks before publishing a change.

## Monitoring and container operations

The monitoring service and IDE monitoring pages expose runtime samples, timelines,
alerts and tenant views. Sanitized request diagnostics capture structural failure
information rather than dumping private request bodies or credentials.

The container agent is an optional operator boundary for Docker/Podman actions.
IDE container/admin tooling also includes orchestration records and operations.
Treat engine credentials/socket access as privileged installation capabilities;
keep them separate from tenant-authored execution.

These are optional existing components. Adding an application module does not
require deploying another agent or adding an execution service.

## React app import

The Studio has a React-app import workflow that extracts supported source files
and builds UI package metadata. Build-tool configuration, dependency directories
and generated bundles are not the tenant source model.

Review the imported entry point, supported imports, CSS and API calls. The default
entry point is `@app/dashboard` with a named `App` export; API requests should use
`@app/datacontext`. Read the [UI cookbook](../platform-cookbook/04-ui-modules.md).

## Source paths

| Area | Start reading |
| --- | --- |
| Editor layout | `src/ideNew/src/components/editor/EditorWorkspace.tsx` |
| Save, publish, history, preview | `src/ideNew/src/components/editor/hooks` |
| Assistant contracts | `src/ideNew/src/lib/assistant/codeContracts.ts` |
| VS Code commands | `src/ide-vscode/src` |
| Gateway | `src/codex-gateway` |
| Monitoring | `src/monitoring`, `src/core/core/monitoring` |
| Container management | `src/container-agent`, IDE admin containers and Core orchestration |

For changes to those features, run their builds/type checks and exercise the
actual affected interaction. The [validation record](../release/validation.md)
records the release preparation evidence and its limits.
