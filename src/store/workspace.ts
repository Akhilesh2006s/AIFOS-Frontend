import { create } from 'zustand';
import type { WorkspaceId } from '@/config/workspaces';

interface WorkspaceState {
  activeWorkspace: WorkspaceId;
  commandPaletteOpen: boolean;
  copilotOpen: boolean;
  setWorkspace: (id: WorkspaceId) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCopilot: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspace: 'command',
  commandPaletteOpen: false,
  copilotOpen: false,
  setWorkspace: (id) => set({ activeWorkspace: id }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen })),
}));
