# IdpCore documentation and GitHub Pages

The existing Docusaurus site hosts the project landing page and documentation.
It does not run Core, IDE, Auth or tenant code.

```sh
npm --prefix docs/site ci
npm run docs:build
npm run docs:serve
```

Open `http://localhost:4010/Idp/`. Development uses `npm run docs:start`.
The build regenerates source-derived reference pages and copies canonical guides
through `scripts/release/sync-guides.mjs`; edit the source guides, not their copies.
Broken site and Markdown links fail the build.

`.github/workflows/pages.yml` validates pull requests and deploys the default branch
using GitHub's Pages artifact/OIDC workflow. Set Settings → Pages → GitHub Actions.
The configured public URL is `https://alirezadadrass.github.io/Idp/`; deployment is
only established after the workflow succeeds. Read the [release runbook](../release/README.md).

Forks/custom domains can set `DOCS_URL` and `DOCS_BASE_URL` at build time.
For example, a domain root uses `DOCS_BASE_URL=/`. Generated output in `build/`
and `.docusaurus/` stays ignored; publish only the static build artifact.
