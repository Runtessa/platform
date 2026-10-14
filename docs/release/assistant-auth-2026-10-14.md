# Assistant request authentication — 2026-10-14

This follows the merged [data-safety change](data-safety-2026-10-14.md). It secures
the existing Studio-to-Gateway request boundary without adding an application
service or removing native code execution.

## Resulting behavior

- Studio signs every operational Gateway request after authenticating the user
  and authorizing workspace access. Signatures cover method, path/query, identity
  context, timestamp, nonce and exact request body digest.
- Gateway rejects unsigned, forged, modified, expired and replayed requests before
  route execution. The 60-second nonce window is bounded to 10,000 live entries.
- User/profile identity comes from the verified context. Conflicting body/query
  identities fail. Login session reads and callbacks require matching ownership.
- Tenant workspace operations bind the selected tenant; tenant execution requires
  a workspace session and cannot silently execute against the repository.
  Repository execution requires both explicit server configuration and signed
  repository scope. Studio uses tenant scope for execution.
- Workspace directory keys include a digest of the tenant/chat pair, avoiding
  collisions caused by separator characters.
- Gateway startup requires a private shared credential and binds loopback by
  default. Health/version probes remain public with minimal metadata. Codex
  subprocesses receive transport/locale settings and their isolated profile path,
  excluding service credentials and inherited provider API keys.
- Native secret initialization coordinates Studio/Gateway environment files,
  preserves other settings and refuses conflicting credentials. Fresh deployment
  templates coordinate the same credential through the existing manager.

## Validation

All local checks used Node **22.23.2** and native host processes. No local
container build, service provisioning or containerized test was run.

| Check | Result |
| --- | --- |
| Studio security regressions | 173 passed, including two new login identity checks |
| Platform contracts | 20 passed, including seven new Gateway HTTP/configuration checks and one manager configuration check |
| Gateway native thread/model/attachment tests | 12 passed |
| Coordinated deployment environment generation | Five passed, including matching independent Gateway credentials |
| Studio compilation | Type-check and isolated production build passed |
| Publication scan | Redacted Gitleaks publishable-file scan passed |
| Actual native Gateway | Health 200; unsigned model catalog 401; signed catalog 200 with seven models using an existing logged-in profile |

There are **10 new behavioral scenarios** across these suites. Tenant SSE and
repository JSON/SSE execution used a synthetic native CLI/app-server to verify
the transport and protocol without relying on model output. The live account check
verified model discovery, not a generated-code execution turn.

## Configuration and remaining boundaries

Run `node scripts/assistant/init-secret.mjs` in a native platform checkout and
restart Studio and Gateway. See the
[Gateway guide](https://github.com/Runtessa/assistant-gateway#request-authentication).
Fresh deployment initialization generates matching credentials. Existing private
deployment files are preserved and need a coordinated configuration update and
service restart; there is no unsigned compatibility mode.

HMAC authenticates requests and does not encrypt their contents. Use a private
network and TLS between hosts. The replay cache belongs to one Gateway process;
replicated instances need shared replay storage and synchronized clocks. Secret
rotation currently requires a coordinated Studio/Gateway update.

This change does not establish OS filesystem isolation against a compromised
process running as the same user. It does not complete SSRF/egress policy,
resource limits, direct CLI fallback isolation, model activation/staging,
dependency remediation, encrypted-key recovery or restore/load rehearsals.
These remain production gates.
