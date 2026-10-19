import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { area, openingLine, stairGeometry } from '../model/geometry';
import type { Plan, Room } from '../model/types';
import { pieceRect, wallPieces } from '../model/walls';
import { ROOM_TYPES } from '../rules/catalog';

interface Props {
  plan: Plan;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Hauteur de coupe (null = murs pleine hauteur). */
  cutHeight: number | null;
  showLabels: boolean;
}

const WALL_COLOR = '#f2efe9';

/** Étiquette rendue dans une texture (évite les nœuds DOM superposés au canvas). */
function Label({ position, lines }: { position: [number, number, number]; lines: string[] }) {
  const key = lines.join('\n');
  const { texture, aspect } = useMemo(() => {
    const ratio = 2;
    const font = `600 ${22 * ratio}px system-ui, sans-serif`;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = font;
    const width = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 24 * ratio;
    const lineH = 28 * ratio;
    canvas.width = Math.ceil(width);
    canvas.height = lineH * lines.length + 12 * ratio;
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 10 * ratio);
    ctx.fill();
    ctx.font = font;
    ctx.fillStyle = '#1d2330';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, 6 * ratio + lineH * (i + 0.5)));
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return { texture: t, aspect: canvas.width / canvas.height };
  }, [key]);
  useEffect(() => () => texture.dispose(), [texture]);
  const h = 0.7;
  return (
    <sprite position={position} scale={[h * aspect, h, 1]} renderOrder={10}>
      <spriteMaterial map={texture} depthTest={false} transparent toneMapped={false} />
    </sprite>
  );
}

function Floor({ room, selected, onSelect }: { room: Room; selected: boolean; onSelect: () => void }) {
  return (
    <mesh
      position={[room.x + room.w / 2, 0, room.y + room.d / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <planeGeometry args={[room.w, room.d]} />
      <meshStandardMaterial
        color={ROOM_TYPES[room.type].color}
        emissive={selected ? '#2563eb' : '#000000'}
        emissiveIntensity={selected ? 0.35 : 0}
      />
    </mesh>
  );
}

function Stair({ plan, room }: { plan: Plan; room: Room }) {
  const g = stairGeometry(plan, room);
  const treads = Array.from({ length: g.steps - 1 }, (_, i) => i);
  return (
    <group>
      {treads.map((i) => {
        const h = g.riser * (i + 1);
        const along = g.going * (i + 0.5);
        const pos: [number, number, number] = g.alongX
          ? [room.x + along, h / 2, room.y + room.d / 2]
          : [room.x + room.w / 2, h / 2, room.y + along];
        const size: [number, number, number] = g.alongX ? [g.going, h, room.d] : [room.w, h, g.going];
        return (
          <mesh key={i} position={pos} castShadow receiveShadow>
            <boxGeometry args={size} />
            <meshStandardMaterial color="#b08968" />
          </mesh>
        );
      })}
    </group>
  );
}

function Glass({ plan, room }: { plan: Plan; room: Room }) {
  return (
    <>
      {room.openings
        .filter((o) => o.kind !== 'porte')
        .map((o) => {
          const line = openingLine(room, o);
          const mid = (line.from + line.to) / 2;
          const out = o.side === 'N' || o.side === 'W' ? -1 : 1;
          const depth = line.c + (out * plan.exteriorWallThickness) / 2;
          const y = o.sill + o.height / 2;
          const pos: [number, number, number] = line.axis === 'h' ? [mid, y, depth] : [depth, y, mid];
          return (
            <mesh key={o.id} position={pos} rotation={[0, line.axis === 'h' ? 0 : Math.PI / 2, 0]}>
              <planeGeometry args={[o.width, o.height]} />
              <meshStandardMaterial color="#9fd3f5" transparent opacity={0.35} side={2} />
            </mesh>
          );
        })}
    </>
  );
}

export function Viewer3D({ plan, selectedId, onSelect, cutHeight, showLabels }: Props) {
  const boxes = useMemo(
    () =>
      plan.rooms.flatMap((r) =>
        wallPieces(plan, r)
          .map((p) => ({ ...p, top: cutHeight === null ? p.top : Math.min(p.top, cutHeight) }))
          .filter((p) => p.top - p.bottom > 1e-3)
          .map((p) => {
            const rc = pieceRect(p);
            return {
              position: [rc.x + rc.w / 2, (p.bottom + p.top) / 2, rc.y + rc.d / 2] as [number, number, number],
              size: [rc.w, p.top - p.bottom, rc.d] as [number, number, number],
            };
          }),
      ),
    [plan, cutHeight],
  );

  const center = useMemo(() => {
    if (plan.rooms.length === 0) return { x: 0, z: 0, span: 10 };
    const minX = Math.min(...plan.rooms.map((r) => r.x));
    const maxX = Math.max(...plan.rooms.map((r) => r.x + r.w));
    const minZ = Math.min(...plan.rooms.map((r) => r.y));
    const maxZ = Math.max(...plan.rooms.map((r) => r.y + r.d));
    return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, span: Math.max(maxX - minX, maxZ - minZ, 4) };
  }, [plan.rooms]);

  return (
    <div className="viewer">
      <Canvas
        shadows
        camera={{
          position: [center.x + center.span * 0.7, center.span * 1.2, center.z + center.span * 1.4],
          fov: 45,
        }}
        onPointerMissed={() => onSelect(null)}
      >
        <color attach="background" args={['#eef1f5']} />
        <hemisphereLight args={['#ffffff', '#b9b2a6', 0.9]} />
        <directionalLight
          position={[center.x + 8, 14, center.z + 6]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, -0.01, center.z]} receiveShadow>
          <planeGeometry args={[center.span * 4, center.span * 4]} />
          <meshStandardMaterial color="#dfe3e8" />
        </mesh>

        {plan.rooms.map((r) => (
          <Floor key={r.id} room={r} selected={r.id === selectedId} onSelect={() => onSelect(r.id)} />
        ))}

        {boxes.map((b, i) => (
          <mesh key={i} position={b.position} castShadow receiveShadow>
            <boxGeometry args={b.size} />
            <meshStandardMaterial color={WALL_COLOR} />
          </mesh>
        ))}

        {plan.rooms.map((r) => (
          <Glass key={r.id} plan={plan} room={r} />
        ))}

        {plan.rooms
          .filter((r) => r.type === 'escalier')
          .map((r) => (
            <Stair key={r.id} plan={plan} room={r} />
          ))}

        {showLabels &&
          plan.rooms.map((r) => (
            <Label
              key={r.id}
              position={[r.x + r.w / 2, 0.4, r.y + r.d / 2]}
              lines={[r.name, `${area(r).toFixed(2).replace('.', ',')} m²`]}
            />
          ))}

        <OrbitControls target={[center.x, 0, center.z]} maxPolarAngle={Math.PI / 2.05} makeDefault />
      </Canvas>
    </div>
  );
}
