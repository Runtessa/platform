import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import type { english } from './copy.en';
import { examples } from './examples';

export default function StudioExample({ copy }: { copy: typeof english }) {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];
  return (
    <div className="studio-example">
      <div className="studio-heading"><span>IdpCore / Studio</span><span>{copy.exampleLabel}</span></div>
      <div className="studio-tabs" role="group" aria-label={copy.exampleTitle}>
        {copy.exampleButtons.map((label, index) => (
          <button key={label} type="button" aria-pressed={selected === index}
            aria-controls="studio-code-panel" onClick={() => setSelected(index)}>{label}</button>
        ))}
      </div>
      <div id="studio-code-panel" className="studio-panel" dir="ltr" aria-live="polite">
        <div className="studio-file"><span aria-hidden="true">{selected === 2 ? 'JSX' : 'JS'}</span>{example.file}</div>
        <CodeBlock language={example.language}>{example.code}</CodeBlock>
      </div>
      <div className="studio-note">
        <p>{copy.exampleNotes[selected]}</p>
        <Link to="/docs/tutorials/first-application">{copy.exampleGuide} <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}
