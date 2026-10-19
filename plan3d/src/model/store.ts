import { useCallback, useEffect, useRef, useState } from 'react';
import { sampleT3 } from './sample';
import type { Plan } from './types';

const STORAGE_KEY = 'plan3d:plan';
const HISTORY_LIMIT = 100;

function load(): Plan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Plan;
      return { ...p, levels: p.levels?.length ? p.levels : ['RDC'] };
    }
  } catch {
    // Stockage indisponible ou corrompu : on repart de l'exemple.
  }
  return sampleT3();
}

type Next = Plan | ((p: Plan) => Plan);

/** État du plan avec historique (annuler / rétablir) et sauvegarde locale. */
export function usePlan() {
  const [plan, setPlan] = useState<Plan>(load);
  const current = useRef(plan);
  const past = useRef<Plan[]>([]);
  const future = useRef<Plan[]>([]);

  useEffect(() => {
    current.current = plan;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch {
      // Sauvegarde best effort.
    }
  }, [plan]);

  const apply = useCallback((next: Next) => {
    const value = typeof next === 'function' ? next(current.current) : next;
    current.current = value;
    setPlan(value);
  }, []);

  /** Mémorise l'état courant avant une modification (une fois par geste). */
  const checkpoint = useCallback(() => {
    past.current = [...past.current.slice(-HISTORY_LIMIT + 1), current.current];
    future.current = [];
  }, []);

  /** Modification intermédiaire (glisser en cours) sans entrée d'historique. */
  const preview = apply;

  const update = useCallback(
    (next: Next) => {
      checkpoint();
      apply(next);
    },
    [apply, checkpoint],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(current.current);
    apply(prev);
  }, [apply]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(current.current);
    apply(next);
  }, [apply]);

  return {
    plan,
    update,
    preview,
    checkpoint,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
