import { useCallback } from "react";

export interface DiffResult {
  insertions: number[];
  deletions: number[];
  updates: number[];
  moves: Array<{ from: number; to: number }>;
}

/**
 * Paul Heckel's Linear-Time ($O(N)$) Diffing Algorithm hook.
 * Computes exact item insertions, deletions, moves, and content updates
 * to feed dynamic recycler view diffing, avoiding expensive list resets.
 */
export function useHeckelDiff<T extends { id: string }>() {
  const diff = useCallback((prev: T[], next: T[]): DiffResult => {
    const prevMap = new Map<string, { index: number; entry: T }>();
    const nextMap = new Map<string, { index: number; entry: T }>();
    
    prev.forEach((entry, index) => prevMap.set(entry.id, { index, entry }));
    next.forEach((entry, index) => nextMap.set(entry.id, { index, entry }));

    const insertions: number[] = [];
    const deletions: number[] = [];
    const updates: number[] = [];
    const moves: Array<{ from: number; to: number }> = [];

    // 1. Detect item deletions
    prev.forEach((entry, index) => {
      if (!nextMap.has(entry.id)) {
        deletions.push(index);
      }
    });

    // 2. Detect insertions, updates, and position moves
    next.forEach((entry, index) => {
      const prevInfo = prevMap.get(entry.id);
      if (!prevInfo) {
        insertions.push(index);
      } else {
        // If content changed (e.g. caption, likes count, metadata)
        if (JSON.stringify(prevInfo.entry) !== JSON.stringify(entry)) {
          updates.push(index);
        }
        // If index position changed
        if (prevInfo.index !== index) {
          moves.push({ from: prevInfo.index, to: index });
        }
      }
    });

    return { insertions, deletions, updates, moves };
  }, []);

  return { diff };
}
