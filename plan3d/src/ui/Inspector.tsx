import { area, levelOf, sideLength, stairGeometry } from '../model/geometry';
import { makeOpening } from '../model/sample';
import type { Opening, OpeningKind, Plan, Room, Side } from '../model/types';
import { ROOM_TYPES, ROOM_TYPE_ORDER } from '../rules/catalog';
import { metrics, unitsOf } from '../rules/engine';
import { CheckField, NumberField, SelectField, TextField } from './fields';

const fmt = (v: number, d = 2) => v.toFixed(d).replace('.', ',');

const KIND_OPTIONS: { value: OpeningKind; label: string }[] = [
  { value: 'porte', label: 'Porte' },
  { value: 'fenetre', label: 'Fenêtre' },
  { value: 'porte-fenetre', label: 'Porte-fenêtre' },
  { value: 'baie', label: 'Baie libre (passage)' },
];
const SIDE_OPTIONS: { value: Side; label: string }[] = [
  { value: 'N', label: 'Nord (haut)' },
  { value: 'S', label: 'Sud (bas)' },
  { value: 'W', label: 'Ouest (gauche)' },
  { value: 'E', label: 'Est (droite)' },
];

interface Props {
  plan: Plan;
  room: Room | null;
  update: (fn: (p: Plan) => Plan) => void;
  onDelete: (id: string) => void;
}

export function Inspector({ plan, room, update, onDelete }: Props) {
  if (!room) return <PlanSettings plan={plan} update={update} />;

  const setRoom = (patch: Partial<Room>) =>
    update((p) => ({ ...p, rooms: p.rooms.map((r) => (r.id === room.id ? { ...r, ...patch } : r)) }));
  const setOpening = (id: string, patch: Partial<Opening>) =>
    setRoom({ openings: room.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  const addOpening = (kind: OpeningKind) => {
    const side: Side = 'N';
    const o = makeOpening(kind, side, 0);
    o.offset = Math.max(0, Math.round(((sideLength(room, side) - o.width) / 2) * 100) / 100);
    setRoom({ openings: [...room.openings, o] });
  };

  const spec = ROOM_TYPES[room.type];
  const stair = room.type === 'escalier' ? stairGeometry(plan, room) : null;

  return (
    <div className="panel inspector">
      <header>
        <h2>{room.name}</h2>
        <button className="danger" onClick={() => onDelete(room.id)} title="Supprimer (Suppr)">
          Supprimer
        </button>
      </header>
      <TextField label="Nom" value={room.name} onChange={(name) => setRoom({ name })} />
      <SelectField
        label="Type"
        value={room.type}
        options={ROOM_TYPE_ORDER.map((t) => ({ value: t, label: ROOM_TYPES[t].label }))}
        onChange={(type) => setRoom({ type, ...(type === 'escalier' && !room.steps ? { steps: 16 } : {}) })}
      />
      <div className="grid2">
        <TextField label="Logement (vide = communs)" value={room.unit ?? ''}
          onChange={(unit) => setRoom({ unit: unit.trim() || undefined })} />
        <SelectField
          label="Niveau"
          value={String(levelOf(room))}
          options={plan.levels.map((n, i) => ({ value: String(i), label: n }))}
          onChange={(v) => setRoom({ level: Number(v) })}
        />
      </div>
      <div className="grid2">
        <NumberField label="Largeur (x)" value={room.w} min={0.3} onChange={(w) => setRoom({ w })} />
        <NumberField label="Profondeur (y)" value={room.d} min={0.3} onChange={(d) => setRoom({ d })} />
        <NumberField label="Position x" value={room.x} onChange={(x) => setRoom({ x })} />
        <NumberField label="Position y" value={room.y} onChange={(y) => setRoom({ y })} />
      </div>
      <p className="stat">
        Surface : <strong>{fmt(area(room))} m²</strong>
        {spec.minArea > 0 && <> · mini usage {fmt(spec.minArea, 1)} m²</>}
        {spec.minWidth > 0 && <> · largeur mini {fmt(spec.minWidth)} m</>}
      </p>

      {room.type === 'sdb' && (
        <CheckField label="WC intégré à la salle d’eau" value={!!room.wcIncluded}
          onChange={(wcIncluded) => setRoom({ wcIncluded })} />
      )}

      {stair && (
        <section>
          <h3>Escalier droit</h3>
          <NumberField label="Nombre de hauteurs" value={stair.steps} digits={0} unit="" step={1} min={2}
            onChange={(steps) => setRoom({ steps: Math.round(steps) })} />
          <p className="stat">
            Hauteur à franchir {fmt(stair.floorToFloor)} m · h = {fmt(stair.riser * 100, 1)} cm · g ={' '}
            {fmt(stair.going * 100, 1)} cm · 2h + g = <strong>{fmt(stair.blondel * 100, 1)} cm</strong>
          </p>
        </section>
      )}

      <section>
        <h3>Ouvertures</h3>
        {room.openings.length === 0 && <p className="muted">Aucune ouverture.</p>}
        {room.openings.map((o, i) => (
          <div key={o.id} className="opening">
            <div className="opening-head">
              <strong>
                {i + 1}. {KIND_OPTIONS.find((k) => k.value === o.kind)!.label}
              </strong>
              <button
                className="link"
                onClick={() => setRoom({ openings: room.openings.filter((x) => x.id !== o.id) })}
              >
                Retirer
              </button>
            </div>
            <div className="grid2">
              <SelectField label="Type" value={o.kind} options={KIND_OPTIONS}
                onChange={(kind) => setOpening(o.id, { kind, sill: kind === 'fenetre' ? Math.max(o.sill, 0.9) : 0 })} />
              <SelectField label="Mur" value={o.side} options={SIDE_OPTIONS} onChange={(side) => setOpening(o.id, { side })} />
              <NumberField label="Décalage" value={o.offset} min={0} onChange={(offset) => setOpening(o.id, { offset })} />
              <NumberField label="Largeur" value={o.width} min={0.3} onChange={(width) => setOpening(o.id, { width })} />
              <NumberField label="Hauteur" value={o.height} min={0.3} onChange={(height) => setOpening(o.id, { height })} />
              {o.kind === 'fenetre' && (
                <NumberField label="Allège" value={o.sill} min={0} onChange={(sill) => setOpening(o.id, { sill })} />
              )}
            </div>
            {o.kind === 'porte' && (
              <CheckField label="Porte d’entrée du logement" value={!!o.entrance}
                onChange={(entrance) => setOpening(o.id, { entrance })} />
            )}
          </div>
        ))}
        <div className="row">
          <button onClick={() => addOpening('porte')}>+ Porte</button>
          <button onClick={() => addOpening('fenetre')}>+ Fenêtre</button>
          <button onClick={() => addOpening('porte-fenetre')}>+ Porte-fenêtre</button>
          <button onClick={() => addOpening('baie')}>+ Baie libre</button>
        </div>
      </section>
    </div>
  );
}

function PlanSettings({ plan, update }: { plan: Plan; update: (fn: (p: Plan) => Plan) => void }) {
  const set = (patch: Partial<Plan>) => update((p) => ({ ...p, ...patch }));
  const units = unitsOf(plan).filter((u) => u.name);
  // Avec plusieurs logements, les parties communes sont exclues de la SHAB.
  const m = metrics(units.length ? { ...plan, rooms: units.flatMap((u) => u.rooms) } : plan);
  return (
    <div className="panel inspector">
      <header>
        <h2>Projet</h2>
      </header>
      <TextField label="Nom du projet" value={plan.name} onChange={(name) => set({ name })} />
      <div className="grid2">
        <NumberField label="Hauteur sous plafond" value={plan.ceilingHeight} min={1.8} onChange={(ceilingHeight) => set({ ceilingHeight })} />
        <NumberField label="Épaisseur plancher" value={plan.slabThickness} min={0} onChange={(slabThickness) => set({ slabThickness })} />
        <NumberField label="Cloisons" value={plan.partitionThickness} min={0.05} onChange={(partitionThickness) => set({ partitionThickness })} />
        <NumberField label="Murs de façade" value={plan.exteriorWallThickness} min={0.1} onChange={(exteriorWallThickness) => set({ exteriorWallThickness })} />
        <NumberField label="Occupants par logement" value={plan.occupants} digits={0} unit="" step={1} min={0}
          onChange={(occupants) => set({ occupants: Math.round(occupants) })} />
      </div>
      <CheckField label="Logement neuf soumis à l’accessibilité PMR" value={plan.accessible} onChange={(accessible) => set({ accessible })} />
      <CheckField label="Plan d’un seul niveau situé en étage" value={plan.upperFloor} onChange={(upperFloor) => set({ upperFloor })} />
      <section>
        <h3>Synthèse</h3>
        <dl className="metrics">
          <dt>Niveaux</dt>
          <dd>{plan.levels.join(', ')}</dd>
          <dt>Pièces</dt>
          <dd>{plan.rooms.length}</dd>
          <dt>{units.length ? 'SHAB des logements' : 'Surface habitable'}</dt>
          <dd>{fmt(m.habitableArea)} m²</dd>
          <dt>Baies / SHAB</dt>
          <dd>
            {fmt(m.glazingRatio * 100, 1)} % (mini 16,7 %)
          </dd>
        </dl>
        {units.length > 1 && (
          <table className="units">
            <thead>
              <tr>
                <th>Logement</th>
                <th>SHAB</th>
                <th>Baies</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => {
                const um = metrics({ ...plan, rooms: u.rooms });
                return (
                  <tr key={u.name}>
                    <td>{u.name}</td>
                    <td>{fmt(um.habitableArea, 1)} m²</td>
                    <td>{fmt(um.glazingRatio * 100, 1)} %</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="muted">
          Surfaces sur cotes intérieures. Renseignez « Logement » sur chaque pièce pour contrôler plusieurs logements
          séparément ; les pièces sans logement sont des parties communes.
        </p>
      </section>
    </div>
  );
}
