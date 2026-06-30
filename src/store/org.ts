import { create } from 'zustand';

export interface SwitchableOrganization {
  id: string;
  name: string;
  code?: string;
  logo?: string;
  status?: string;
}

interface OrgState {
  activeOrganizationId: string | null;
  organizations: SwitchableOrganization[];
  setActiveOrganizationId: (id: string | null) => void;
  setOrganizations: (orgs: SwitchableOrganization[]) => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'afios_active_org';

export const useOrgStore = create<OrgState>((set) => ({
  activeOrganizationId: null,
  organizations: [],

  setActiveOrganizationId: (id) => {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
    set({ activeOrganizationId: id });
  },

  setOrganizations: (organizations) => set({ organizations }),

  hydrate: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) set({ activeOrganizationId: stored });
  },
}));

export function getActiveOrgHeader(): Record<string, string> {
  const id = localStorage.getItem(STORAGE_KEY);
  return id ? { 'X-AFIOS-Org-Id': id } : {};
}
