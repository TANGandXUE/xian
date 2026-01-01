import { create } from 'zustand';

interface Position {
    x: number;
    y: number;
}

interface SimulationState {
    positions: Record<string, Position>;
    updatePosition: (id: string, x: number, y: number) => void;
    checkCollisions: (id: string, radius: number) => string[];
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
    positions: {},
    updatePosition: (id, x, y) => set((state) => ({
        positions: { ...state.positions, [id]: { x, y } }
    })),
    checkCollisions: (id, radius) => {
        const { positions } = get();
        const myPos = positions[id];
        if (!myPos) return [];

        const collisions: string[] = [];
        Object.entries(positions).forEach(([otherId, otherPos]) => {
            if (otherId === id) return;
            const dx = myPos.x - otherPos.x;
            const dy = myPos.y - otherPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius * 1.8) { // Overlap threshold
                collisions.push(otherId);
            }
        });

        return collisions;
    }
}));
