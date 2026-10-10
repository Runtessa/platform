import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';

const example = `module.exports = async function handler(req, adapters) {
  return {
    statusCode: 200,
    body: { message: 'Hello from live tenant code' },
  };
};`;

const capabilities = [
  ['Live backend modules', 'Publish a tenant route and run its selected revision on the next request.'],
  ['Native model classes', 'Use TypeORM decorators, methods and relations with granted database adapters.'],
  ['React applications', 'Author UI packages in the IDE and load them through the Kernel browser runtime.'],
  ['A shared foundation', 'Reuse backend and UI packages across applications while keeping tenant scope explicit.'],
];

export default function Home() {
  return (
    <Layout title="Live tenant applications" description="IdpCore: a self-hosted platform for live backend modules, model classes and React applications.">
      <main>
        <section className="home-hero container" aria-labelledby="home-title">
          <div className="home-intro">
            <p className="home-eyebrow">Self-hosted · TypeScript · Apache-2.0</p>
            <h1 id="home-title">Your application changes.<br /><span>The platform keeps running.</span></h1>
            <p className="home-lead">Write backend modules, database models and React interfaces for each tenant. Preview a draft, publish a revision and execute it on demand.</p>
            <div className="home-actions">
              <Link className="button button--primary button--lg" to="/docs/getting-started">Get started</Link>
              <Link className="button button--secondary button--lg" href="https://github.com/AlirezaDadrass/Idp">Explore the source</Link>
            </div>
            <p className="home-status">Developer preview. Review the <Link to="/docs/security">deployment boundaries</Link> before accepting untrusted code.</p>
          </div>
          <div className="home-code">
            <div className="home-code-title"><span>Backend module</span><span>GET /api/hello</span></div>
            <CodeBlock language="javascript">{example}</CodeBlock>
            <p>Save → preview → publish → next invocation</p>
          </div>
        </section>
        <section className="home-section container" aria-labelledby="build-title">
          <h2 id="build-title">One authoring flow, three kinds of code.</h2>
          <div className="home-capabilities">
            {capabilities.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>
        <section className="home-section home-boundary container" aria-labelledby="boundary-title">
          <div>
            <p className="home-eyebrow">Built around live execution</p>
            <h2 id="boundary-title">Keep the code dynamic.<br />Make the boundary explicit.</h2>
            <p>Core and IDE run tenant code in short-lived restricted processes. The parent retains platform keys and selects the tenant, revision and granted capabilities.</p>
            <Link to="/docs/operations/runtime">Read the runtime design →</Link>
          </div>
          <div className="home-flow" aria-label="Application workflow">
            <div><strong>IDE / Studio</strong><span>Author · preview · publish</span></div>
            <span className="home-flow-arrow" aria-hidden="true">↓</span>
            <div><strong>Core runtime</strong><span>Tenant dispatch · ACL · registry</span></div>
            <span className="home-flow-arrow" aria-hidden="true">↓</span>
            <div><strong>Restricted process</strong><span>Live code · granted adapters</span></div>
          </div>
        </section>
        <section className="home-section home-read-more container" aria-labelledby="next-title">
          <h2 id="next-title">Start with the source and its limits.</h2>
          <p>Install locally, trace the architecture or contribute a focused improvement.</p>
          <div className="home-actions">
            <Link to="/docs/architecture/overview">Architecture →</Link>
            <Link to="/docs/operations/migrations">Database migrations →</Link>
            <Link to="/docs/contributing">Contribute →</Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
