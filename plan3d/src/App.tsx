import { useEffect, useMemo, useRef, useState } from 'react';
import { PlanEditor } from './editor/PlanEditor';
import { downloadPlansPdf } from './export/pdf';
import { levelOf } from './model/geometry';
import { EXAMPLES, copyToLevel, emptyPlan, makeRoom } from './model/sample';
import { usePlan } from './model/store';
import type { Plan, RoomType } from './model/types';
import { ROOM_TYPES, ROOM_TYPE_ORDER } from './rules/catalog';
import { checkPlan, type Severity } from './rules/engine';
import { Inspector } from './ui/Inspector';
import { IssuesPanel } from './ui/IssuesPanel';
import { Viewer3D } from './viewer/Viewer3D';

type Layout = '2d' | '3d' | 'split';

export default function App() {
  const { plan, update, preview, checkpoint, undo, redo, canUndo, canRedo } = usePlan();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>('split');
  const [cut, setCut] = useState(false);
  const [labels, setLabels] = useState(true);
  const [level, setLevel] = useState(0);
  const [showAbove, setShowAbove] = useState(false);
  const activeLevel = Math.min(level, plan.levels.length - 1);
  const fileInput = useRef<HTMLInputElement>(null);

  const issues = useMemo(() => checkPlan(plan), [plan]);
  const severityByRoom = useMemo(() => {
    const map = new Map<string, Severity>();
    for (const i of issues) if (i.roomId && !map.has(i.roomId) && i.severity !== 'info') map.set(i.roomId, i.severity);
    return map;
  }, [issues]);

  const selected = plan.rooms.find((r) => r.id === selectedId) ?? null;

  /** Sélectionne une pièce et bascule sur son niveau. */
  const select = (id: string | null) => {
    setSelectedId(id);
    const r = id ? plan.rooms.find((x) => x.id === id) : null;
    if (r) setLevel(levelOf(r));
  };

  const addRoom = (type: RoomType) => {
    const here = plan.rooms.filter((r) => levelOf(r) === activeLevel);
    const maxX = here.reduce((m, r) => Math.max(m, r.x + r.w), 0);
    const room = makeRoom(type, here.length ? Math.round((maxX + 1) * 20) / 20 : 0, 0, { level: activeLevel });
    update((p) => ({ ...p, rooms: [...p.rooms, room] }));
    setSelectedId(room.id);
  };

  const deleteRoom = (id: string) => {
    update((p) => ({ ...p, rooms: p.rooms.filter((r) => r.id !== id) }));
    setSelectedId(null);
  };

  const load = (p: Plan) => {
    update(p);
    setSelectedId(null);
    setLevel(0);
  };

  const nextLevelName = (n: number) => (n === 0 ? 'RDC' : `R+${n}`);

  const addLevel = (duplicate: boolean) => {
    const n = plan.levels.length;
    const name = nextLevelName(n);
    const from = plan.levels[activeLevel];
    update((p) => ({
      ...p,
      levels: [...p.levels, name],
      rooms: duplicate
        ? [
            ...p.rooms,
            ...copyToLevel(
              p.rooms.filter((r) => levelOf(r) === activeLevel),
              n,
              (u) => (u.startsWith(from) ? name + u.slice(from.length) : u),
            ),
          ]
        : p.rooms,
    }));
    setLevel(n);
    setSelectedId(null);
  };

  const removeLevel = () => {
    if (plan.levels.length < 2) return;
    const count = plan.rooms.filter((r) => levelOf(r) === activeLevel).length;
    if (count > 0 && !confirm(`Supprimer ${plan.levels[activeLevel]} et ses ${count} pièce(s) ?`)) return;
    update((p) => ({
      ...p,
      levels: p.levels.filter((_, i) => i !== activeLevel),
      rooms: p.rooms
        .filter((r) => levelOf(r) !== activeLevel)
        .map((r) => (levelOf(r) > activeLevel ? { ...r, level: levelOf(r) - 1 } : r)),
    }));
    setLevel(Math.max(0, activeLevel - 1));
    setSelectedId(null);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${plan.name.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase() || 'plan'}.plan3d.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Plan;
      if (!Array.isArray(data.rooms)) throw new Error('format');
      load({ ...emptyPlan(), ...data, levels: data.levels?.length ? data.levels : ['RDC'] });
    } catch {
      alert('Fichier invalide : un export Plan3D (.json) est attendu.');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, select, textarea')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        deleteRoom(selectedId);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      } else if (selectedId && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 0.5 : 0.05;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        const r2 = (v: number) => Math.round(v * 1000) / 1000;
        update((p) => ({
          ...p,
          rooms: p.rooms.map((r) => (r.id === selectedId ? { ...r, x: r2(r.x + dx), y: r2(r.y + dy) } : r)),
        }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="app">
      <header className="toolbar">
        <div className="brand">
          <strong>Plan3D</strong>
          <span>{plan.name}</span>
        </div>
        <div className="group">
          <button onClick={() => load(emptyPlan())}>Nouveau</button>
          <select
            className="examples"
            value=""
            onChange={(e) => {
              const ex = EXAMPLES.find((x) => x.id === e.target.value);
              if (ex) load(ex.build());
            }}
          >
            <option value="">Exemples…</option>
            {EXAMPLES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
          <button onClick={() => fileInput.current?.click()}>Importer</button>
          <button onClick={exportJson} title="Sauvegarder le projet (.json)">Exporter</button>
          <button
            onClick={() => void downloadPlansPdf(plan)}
            disabled={plan.rooms.length === 0}
            title="Plans cotés A3, une planche par niveau"
          >
            Plans PDF
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importJson(f);
              e.target.value = '';
            }}
          />
        </div>
        <div className="group">
          <button onClick={undo} disabled={!canUndo} title="Ctrl+Z">Annuler</button>
          <button onClick={redo} disabled={!canRedo} title="Ctrl+Maj+Z">Rétablir</button>
        </div>
        <div className="group segmented">
          {(['2d', 'split', '3d'] as Layout[]).map((l) => (
            <button key={l} className={layout === l ? 'active' : ''} onClick={() => setLayout(l)}>
              {l === '2d' ? 'Plan 2D' : l === '3d' ? 'Vue 3D' : '2D + 3D'}
            </button>
          ))}
        </div>
        <div className="group">
          <label className="check inline">
            <input type="checkbox" checked={cut} onChange={(e) => setCut(e.target.checked)} />
            <span>Coupe à 1,10 m</span>
          </label>
          <label className="check inline">
            <input type="checkbox" checked={showAbove} onChange={(e) => setShowAbove(e.target.checked)} />
            <span>Niveaux supérieurs</span>
          </label>
          <label className="check inline">
            <input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} />
            <span>Étiquettes 3D</span>
          </label>
        </div>
      </header>

      <aside className="palette">
        <h2>Niveaux</h2>
        <div className="levels">
          {plan.levels
            .map((name, i) => ({ name, i }))
            .reverse()
            .map(({ name, i }) => (
              <button
                key={i}
                className={i === activeLevel ? 'active' : ''}
                onClick={() => {
                  setLevel(i);
                  setSelectedId(null);
                }}
              >
                {name}
                <small>{plan.rooms.filter((r) => levelOf(r) === i).length} pièces</small>
              </button>
            ))}
        </div>
        <div className="row">
          <button onClick={() => addLevel(false)} title="Ajouter un niveau vide au-dessus">+ Niveau</button>
          <button onClick={() => addLevel(true)} title="Copier le niveau actif au-dessus">Dupliquer</button>
          <button className="danger" onClick={removeLevel} disabled={plan.levels.length < 2} title="Supprimer le niveau actif">
            ✕
          </button>
        </div>
        <h2>Ajouter</h2>
        {ROOM_TYPE_ORDER.map((t) => (
          <button key={t} onClick={() => addRoom(t)}>
            <i style={{ background: ROOM_TYPES[t].color }} />
            {ROOM_TYPES[t].label}
          </button>
        ))}
        <p className="muted small">
          Glisser une pièce pour la déplacer, ses coins pour la redimensionner. Les pièces s’aimantent en
          laissant l’épaisseur de cloison. Molette : zoom · glisser le fond : déplacer la vue.
        </p>
      </aside>

      <main className={`stage ${layout}`}>
        {layout !== '3d' && (
          <PlanEditor
            plan={plan}
            activeLevel={activeLevel}
            selectedId={selectedId}
            severityByRoom={severityByRoom}
            onSelect={select}
            checkpoint={checkpoint}
            preview={preview}
          />
        )}
        {layout !== '2d' && (
          <Viewer3D
            plan={plan}
            selectedId={selectedId}
            onSelect={select}
            cutHeight={cut ? 1.1 : null}
            activeLevel={activeLevel}
            showAbove={showAbove}
            showLabels={labels}
          />
        )}
      </main>

      <aside className="sidebar">
        <Inspector plan={plan} room={selected} update={update} onDelete={deleteRoom} />
        <IssuesPanel issues={issues} onSelect={select} />
      </aside>

      <footer className="disclaimer">
        Référentiel : textes français et ergonomie Neufert, utilisés comme référence de pratique. Outil d’aide à la
        conception : il ne remplace ni l’architecte, ni le bureau de contrôle, ni les règles locales applicables.
      </footer>
    </div>
  );
}
