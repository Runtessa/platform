import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';
import type { english } from './copy.en';
import StudioExample from './StudioExample';

const repository = 'https://github.com/AlirezaDadrass/Idp';
const checkout = `git clone https://github.com/AlirezaDadrass/Idp.git
cd Idp
npm ci
npm run docker:init-env
# Continue with the installation guide. This is not a full install.`;

function SectionHeading({ eyebrow, title, children, id }: { eyebrow: string; title: string; children?: React.ReactNode; id?: string }) {
  return <div className="platform-section-heading"><p className="platform-eyebrow">{eyebrow}</p><Heading as="h2" id={id}>{title}</Heading>{children && <p>{children}</p>}</div>;
}

export default function Landing({ copy }: { copy: typeof english }) {
  return (
    <Layout title={copy.title} description={copy.description}>
      <main className="platform-home" dir="ltr" lang="en">
        <section className="platform-hero" aria-labelledby="platform-title">
          <div className="container">
            <div className="platform-hero-grid">
              <div className="platform-intro">
                <p className="platform-eyebrow">{copy.eyebrow}</p>
                <h1 id="platform-title">{copy.heading}<br /><span>{copy.emphasis}</span></h1>
                <p className="platform-lead">{copy.lead}</p>
                <div className="platform-actions">
                  <Link className="button button--primary button--lg" to="/docs/tutorials/first-application">{copy.start} <span aria-hidden="true">↗</span></Link>
                  <Link className="platform-source-link" href={repository}>{copy.source} <span aria-hidden="true">↗</span></Link>
                </div>
                <ul className="platform-meta">{copy.meta.map(text => <li key={text}>{text}</li>)}</ul>
              </div>
              <StudioExample copy={copy} />
            </div>
          </div>
        </section>
        <nav className="platform-section-nav" aria-label="On this page">
          <div className="container">{copy.sectionNav.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}</div>
        </nav>
        <section className="platform-section container">
          <SectionHeading id="capabilities" eyebrow={copy.capabilityEyebrow} title={copy.capabilityTitle}>{copy.capabilityIntro}</SectionHeading>
          <div className="platform-capabilities">{copy.capabilities.map(([number, title, text, to]) => (
            <article key={number}><span className="platform-number" aria-hidden="true">{number}</span><h3>{title}</h3><p>{text}</p><Link to={to}>{copy.more} <span aria-hidden="true">↗</span></Link></article>
          ))}</div>
        </section>
        <section className="platform-band">
          <div className="container platform-section">
            <SectionHeading id="workflow" eyebrow={copy.workflowEyebrow} title={copy.workflowTitle}>{copy.workflowIntro}</SectionHeading>
            <ol className="platform-workflow">{copy.steps.map(([title, text], index) => (
              <li key={title}><span className="platform-step" aria-hidden="true">0{index + 1}</span><h3>{title}</h3><p>{text}</p></li>
            ))}</ol>
            <Link to="/docs/platform/authoring">{copy.resources[2][0]} <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
        <section className="platform-section container">
          <SectionHeading id="architecture" eyebrow={copy.architectureEyebrow} title={copy.architectureTitle}>{copy.architectureIntro}</SectionHeading>
          <div className="platform-architecture">{copy.nodes.map(([title, role, text], index) => (
            <article key={title} className={index === 1 ? 'platform-core' : ''}>
              <p className="platform-node-role">{role}</p><h3>{title}</h3><p>{text}</p>
              <code dir="ltr">{['src/ideNew', 'src/core', 'src/kernel', 'src/auth'][index]}</code>
            </article>
          ))}</div>
          <div className="platform-architecture-foot"><p>{copy.architectureSupport}</p><Link to="/docs/architecture/idpcore-map">{copy.architectureLink} <span aria-hidden="true">↗</span></Link></div>
          <div className="platform-adapters"><div><h3>{copy.adaptersTitle}</h3><p>{copy.adaptersText}</p></div><ul dir="ltr">{copy.adapters.map(name => <li key={name}>{name}</li>)}</ul></div>
        </section>
        <section className="platform-band">
          <div className="container platform-section platform-tools-layout">
            <SectionHeading eyebrow={copy.toolingEyebrow} title={copy.toolingTitle} />
            <div className="platform-tools">{copy.tools.map(([title, text, path]) => (
              <article key={path}><h3>{title}</h3><p>{text}</p><Link href={`${repository}/tree/main/${path}`}><code dir="ltr">{path}</code> <span aria-hidden="true">↗</span></Link></article>
            ))}</div>
          </div>
        </section>
        <section className="platform-section container platform-install">
          <div><SectionHeading eyebrow={copy.installEyebrow} title={copy.installTitle}>{copy.installText}</SectionHeading>
            <ol>{copy.installSteps.map(step => <li key={step}>{step}</li>)}</ol>
            <Link className="button button--primary" to="/docs/getting-started">{copy.installGuide} <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="platform-install-code"><p>{copy.installCaption}</p><div dir="ltr"><CodeBlock language="bash">{checkout}</CodeBlock></div></div>
        </section>
        <section className="platform-band">
          <div className="container platform-section">
            <SectionHeading id="documentation" eyebrow={copy.docsEyebrow} title={copy.docsTitle} />
            <div className="platform-resources">{copy.resources.map(([title, text, to]) => (
              <Link key={to} to={to}><h3>{title} <span aria-hidden="true">↗</span></h3><p>{text}</p></Link>
            ))}</div>
          </div>
        </section>
        <section className="platform-section container platform-faq"><h2>{copy.faqTitle}</h2>
          <div>{copy.questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
        </section>
        <section className="container platform-contribute"><div><h2>{copy.contributeTitle}</h2><p>{copy.contributeText}</p></div>
          <div className="platform-actions"><Link className="button button--primary" to="/docs/contributing">{copy.contribute}</Link><Link to="/docs/project/roadmap">{copy.roadmap} <span aria-hidden="true">↗</span></Link></div>
        </section>
        <aside className="container platform-preview"><div><strong>{copy.preview}</strong><p>{copy.previewText}</p></div>
          <div className="platform-actions"><Link to="/docs/security">{copy.security}</Link><Link to="/docs/project/validation">{copy.validation}</Link></div>
        </aside>
      </main>
    </Layout>
  );
}
