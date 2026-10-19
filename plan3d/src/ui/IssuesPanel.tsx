import { useState } from 'react';
import { SOURCES } from '../rules/catalog';
import type { Issue, Severity } from '../rules/engine';

const LABELS: Record<Severity, string> = { error: 'Non conforme', warning: 'À revoir', info: 'Conseil' };
const KIND_LABELS = { reglementaire: 'Réglementaire', norme: 'Norme', usage: 'Usage', modele: 'Modèle' };

export function IssuesPanel({ issues, onSelect }: { issues: Issue[]; onSelect: (roomId: string) => void }) {
  const [hidden, setHidden] = useState<Set<Severity>>(new Set(['info']));
  const counts = { error: 0, warning: 0, info: 0 };
  for (const i of issues) counts[i.severity]++;

  const toggle = (s: Severity) =>
    setHidden((h) => {
      const next = new Set(h);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const visible = issues.filter((i) => !hidden.has(i.severity));

  return (
    <div className="panel issues">
      <header>
        <h2>Contrôle des règles</h2>
      </header>
      <div className="chips">
        {(['error', 'warning', 'info'] as Severity[]).map((s) => (
          <button key={s} className={`chip ${s} ${hidden.has(s) ? 'off' : ''}`} onClick={() => toggle(s)}>
            {counts[s]} {LABELS[s]}
          </button>
        ))}
      </div>
      {issues.length === 0 && <p className="ok">Aucune non-conformité détectée sur les règles couvertes.</p>}
      <ul>
        {visible.map((i, k) => {
          const src = SOURCES[i.source];
          return (
            <li
              key={k}
              className={`issue ${i.severity} ${i.roomId ? 'clickable' : ''}`}
              onClick={() => i.roomId && onSelect(i.roomId)}
            >
              {i.scope && <span className="scope">{i.scope}</span>}
              <p>{i.message}</p>
              <small>
                <span className={`badge ${src.kind}`}>{KIND_LABELS[src.kind]}</span> {src.label}
                {'verify' in src && <em className="verify"> — {src.verify}</em>}
              </small>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
