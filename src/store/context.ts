import { create } from 'zustand';

export interface ProjectContext {
  id: string;
  name: string;
  code: string;
}

const STORAGE_KEY = 'afios-context';

function loadPersisted(): Pick<ContextState, 'activeProject' | 'recentProjects' | 'pinnedProjects'> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { activeProject: null, recentProjects: [], pinnedProjects: [] };
}

function savePersisted(state: Pick<ContextState, 'activeProject' | 'recentProjects' | 'pinnedProjects'>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

interface ContextState {
  activeProject: ProjectContext | null;
  recentProjects: ProjectContext[];
  pinnedProjects: ProjectContext[];
  setActiveProject: (project: ProjectContext | null) => void;
  touchRecent: (project: ProjectContext) => void;
  togglePin: (project: ProjectContext) => void;
  clearContext: () => void;
}

const initial = loadPersisted();

export const useContextStore = create<ContextState>((set, get) => ({
  ...initial,

  setActiveProject: (project) => {
    if (project) get().touchRecent(project);
    set((s) => {
      const next = { ...s, activeProject: project };
      savePersisted({ activeProject: next.activeProject, recentProjects: next.recentProjects, pinnedProjects: next.pinnedProjects });
      return { activeProject: project };
    });
  },

  touchRecent: (project) => {
    set((s) => {
      const recentProjects = [project, ...s.recentProjects.filter((p) => p.id !== project.id)].slice(0, 8);
      savePersisted({ activeProject: s.activeProject, recentProjects, pinnedProjects: s.pinnedProjects });
      return { recentProjects };
    });
  },

  togglePin: (project) => {
    set((s) => {
      const isPinned = s.pinnedProjects.some((p) => p.id === project.id);
      const pinnedProjects = isPinned
        ? s.pinnedProjects.filter((p) => p.id !== project.id)
        : [...s.pinnedProjects, project].slice(0, 6);
      savePersisted({ activeProject: s.activeProject, recentProjects: s.recentProjects, pinnedProjects });
      return { pinnedProjects };
    });
  },

  clearContext: () => {
    set((s) => {
      savePersisted({ activeProject: null, recentProjects: s.recentProjects, pinnedProjects: s.pinnedProjects });
      return { activeProject: null };
    });
  },
}));
