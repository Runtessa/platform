---
title: Container image releases
---

<!-- Generated from docs/release/container-images.md; edit the source guide. -->

# Container image releases

Runtessa uses GitHub Container Registry (GHCR) under the organization namespace
`ghcr.io/runtessa`. No Docker Hub account or Docker Hub subscription is required.
The integration repository, `Runtessa/platform`, owns the publication workflow
because it pins the component revisions that must work together. Component pushes
alone do not publish an assembled platform release.

Packages are created by the first successful image publication. Configuring the
workflow does not create an empty registry package or an initial release.

## Images

| Image | Build source | Role |
| --- | --- | --- |
| `ghcr.io/runtessa/runtime` | `src/core/Dockerfile` | Core runtime, including the compiled browser Kernel |
| `ghcr.io/runtessa/studio` | `src/ideNew/Dockerfile` | Browser development studio |
| `ghcr.io/runtessa/auth` | `src/auth/Dockerfile` | Identity and OAuth |
| `ghcr.io/runtessa/monitoring` | `src/monitoring/Dockerfile` | Monitoring and alerts |
| `ghcr.io/runtessa/container-agent` | `src/container-agent/Dockerfile` | Optional container operations |
| `ghcr.io/runtessa/assistant-gateway` | `src/codex-gateway/Dockerfile` | Optional Codex CLI gateway |

These names replace the old publication pattern `idpcore-*`; existing packages
and installations are not deleted or automatically rewritten. Compose service
names (`core`, `ide`, `codex-gateway`) remain compatible. Images currently target
Linux amd64. A Kernel image is unnecessary because Kernel is included in runtime.

## Publish a release

1. Push component commits, update their pins and integration lock in `platform`,
   and merge the reviewed integration change into `main`.
2. Wait for **Repository verification** on the exact main commit to finish green.
   All five jobs must pass, including the real Core container smoke test, Auth,
   Monitoring, VS Code host, and source/history secret scans. A successful check
   on another revision, a PR, or a skipped required job does not qualify.
3. In `Runtessa/platform` → **Releases** → **Draft a new release**, select `main`
   and a version tag such as `v0.1.0`. Release tags must use `vMAJOR.MINOR.PATCH`
   with optional SemVer prerelease identifiers; build metadata is not accepted.
   For `v0.2.0-rc.1`, also select **Set as a pre-release**.
4. Publish the Release. **Docker Images** checks that the tag resolves to the
   checked-out revision and is reachable from main, validates both Docker
   Compose configurations, then builds and pushes the six images from the pinned sources.
5. Confirm every build job succeeds. Each job inspects its published manifest
   and records its digest and exact pull reference in its workflow summary.
   Review the packages under the organization's **Packages** tab.

Main pushes affecting build inputs, and **Run workflow** requests, build without
publishing. Pushing a tag without publishing a GitHub Release does not publish
images. The workflow uses pinned action revisions and the job's `GITHUB_TOKEN`;
no personal token is stored for publication. Existing read-only component deploy
keys are still needed while the component repositories are private.

## Tags and visibility

Every release publishes the full version (`0.1.0` or `0.2.0-rc.1`) and
`sha-<full integration commit SHA>`. Only the current latest stable GitHub Release
also publishes `latest`; prereleases and historical releases do not advance it.
Publication workflows are serialized. There are no moving major/minor aliases.

New GHCR packages start private. While `platform` is private, the publication
gate rejects existing destination packages that are public or internal. Source
and package visibility are separate settings: this workflow does not make either
public. A future public launch needs an explicit package visibility decision.
See [GitHub's Container registry documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

Publication is not transactional across six packages. If a build/push fails,
do not install that release until all six jobs are green. Rerun the failed jobs
after fixing the external problem. If validation failed because CI was pending,
wait for the exact main verification run and rerun **all jobs**. Code fixes need a
new reviewed main revision and a new release tag; do not move released tags.

## Pull and install

Private packages require an authorized GitHub account and a personal access token
(classic) with `read:packages`. Authenticate interactively without committing the
token or placing it in Compose files:

```sh
docker login ghcr.io --username YOUR_GITHUB_USERNAME
```

Enter the token at the password prompt. For automated consumers, provide a scoped
secret through `--password-stdin`. Images can be pinned by published digest for
reproducible installation:

```sh
docker pull ghcr.io/runtessa/runtime:0.1.0
# Replace the example version with a successfully published release.
```

Initialize private configuration with `npm run docker:init-env`, then edit
`docker/.env` to use `IMAGE_REGISTRY=ghcr.io/runtessa` and the chosen `IMAGE_TAG`.
The tracked example maps each Compose service to its current image name. Existing
private files are preserved, so older installations must update their own image
references deliberately, including optional agent/gateway references. Use the
[Docker guide](https://github.com/Runtessa/platform/blob/main/docker/README.md) and
[migration guide](/docs/operations/migrations) before starting/upgrading.
Use explicit version tags or digests in deployments rather than moving `latest`.
