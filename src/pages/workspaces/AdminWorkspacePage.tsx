import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2, Key, Lock, Mail, Plus, RefreshCw, Settings, Shield, Unlock, UserPlus, Users,
} from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { moduleApi } from '@/api/client';
import { cn, formatDate } from '@/lib/utils';

const TABS = ['dashboard', 'organizations', 'users', 'roles', 'permissions', 'invitations', 'audit', 'settings'] as const;

type AdminDashboard = {
  organization: Record<string, number | string | null>;
  users: Record<string, number | unknown>;
  recentLogins: Array<{ name: string; email: string; lastLoginAt?: string; role: string }>;
};

export function AdminWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as (typeof TABS)[number]) || 'dashboard';

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [organizations, setOrganizations] = useState<Array<Record<string, unknown>>>([]);
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [roles, setRoles] = useState<Array<Record<string, unknown>>>([]);
  const [permissions, setPermissions] = useState<{ matrix: Record<string, string[]>; roles: Array<Record<string, unknown>> } | null>(null);
  const [invitations, setInvitations] = useState<Array<Record<string, unknown>>>([]);
  const [auditLogs, setAuditLogs] = useState<Array<Record<string, unknown>>>([]);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);

  const [modal, setModal] = useState<'org' | 'user' | 'role' | 'invite' | 'reset' | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  const [orgForm, setOrgForm] = useState({ name: '', industry: '', country: 'India', email: '', contactPerson: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'user', department: '', organizationId: '' });
  const [roleForm, setRoleForm] = useState({ key: '', label: '', clonedFrom: '' });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'user', department: '' });
  const [resetForm, setResetForm] = useState({ password: '' });
  const [settingsForm, setSettingsForm] = useState({ platformName: 'AFIOS Platform', allowSelfRegistration: false, passwordExpiryDays: 90 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, orgs, usrs, rls, perms, invs, audit, sett] = await Promise.all([
        moduleApi.admin.dashboard(),
        moduleApi.admin.organizations(),
        moduleApi.admin.users(),
        moduleApi.admin.roles(),
        moduleApi.admin.permissions(),
        moduleApi.admin.invitations(),
        moduleApi.admin.audit({ limit: 100 }),
        moduleApi.admin.settings(),
      ]);
      setDashboard(dash.data);
      setOrganizations(orgs.data);
      setUsers(usrs.data);
      setRoles(rls.data);
      setPermissions(perms.data);
      setInvitations(invs.data);
      setAuditLogs(audit.data);
      setSettings(sett.data);
      if (sett.data) {
        setSettingsForm({
          platformName: String(sett.data.platformName || 'AFIOS Platform'),
          allowSelfRegistration: Boolean(sett.data.allowSelfRegistration),
          passwordExpiryDays: Number(sett.data.passwordExpiryDays || 90),
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setTab = (t: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  const submit = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    try {
      await fn();
      setModal(null);
      setInviteResult(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const orgKpis = dashboard?.organization;
  const userKpis = dashboard?.users as Record<string, number> | undefined;

  return (
    <ModulePageLayout
      title="Administration"
      subtitle="Platform kernel — organizations, users, roles, permissions, audit"
      loading={loading}
      stats={[
        { label: 'Organizations', value: Number(orgKpis?.total ?? 0), color: '#38BDF8' },
        { label: 'Active Users', value: Number(userKpis?.active ?? 0), color: '#22C55E' },
        { label: 'Online', value: Number(userKpis?.online ?? 0), color: '#10B981' },
        { label: 'Pending Invites', value: Number(userKpis?.pendingInvitations ?? 0), color: '#F97316' },
        { label: 'Locked', value: Number(userKpis?.locked ?? 0), color: '#EF4444' },
        { label: 'Roles', value: roles.length, color: '#8B5CF6' },
      ]}
      heroActions={
        <div className="flex gap-2">
          <button type="button" onClick={() => setModal('user')} className="btn-primary flex items-center gap-2 text-sm">
            <UserPlus size={14} /> Create User
          </button>
          <Link to="/mission-control" className="btn-ghost text-sm">Mission Control</Link>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs capitalize',
              tab === t ? 'bg-accent/20 text-accent' : 'bg-white/5 text-slate-400 hover:text-white',
            )}
          >
            {t}
          </button>
        ))}
        <button type="button" onClick={() => load()} className="btn-ghost ml-auto p-1.5"><RefreshCw size={14} /></button>
      </div>

      {tab === 'dashboard' && dashboard && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="command-card p-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Building2 size={14} /> Organization KPIs
            </h3>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(dashboard.organization).map(([k, v]) => (
                <div key={k} className="flex justify-between text-slate-400">
                  <dt className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</dt>
                  <dd className="text-slate-200">{String(v ?? '—')}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="command-card p-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Users size={14} /> User KPIs
            </h3>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {['total', 'online', 'offline', 'active', 'inactive', 'pendingInvitations', 'locked', 'expiredPasswords'].map((k) => (
                <div key={k} className="flex justify-between text-slate-400">
                  <dt className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</dt>
                  <dd className="text-slate-200">{String((userKpis as Record<string, number>)?.[k] ?? 0)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="command-card p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-3">Recent logins</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              {dashboard.recentLogins.map((u, i) => (
                <li key={i} className="flex justify-between">
                  <span>{u.name} · {u.role}</span>
                  <span className="text-[10px] text-slate-500">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'organizations' && (
        <div className="space-y-4">
          <button type="button" onClick={() => setModal('org')} className="btn-accent text-xs flex items-center gap-1">
            <Plus size={12} /> New organization
          </button>
          <DataTable
            columns={['Name', 'Industry', 'Country', 'Status', 'Contact']}
            rows={organizations.map((o) => [
              String(o.name), String(o.industry || '—'), String(o.country || '—'),
              String(o.status), String(o.contactPerson || o.email || '—'),
            ])}
            rowActions={organizations.map((o) => ({
              suspend: o.status === 'active' ? () => moduleApi.admin.suspendOrg(String(o._id)).then(load) : undefined,
              activate: o.status === 'suspended' ? () => moduleApi.admin.activateOrg(String(o._id)).then(load) : undefined,
              delete: () => moduleApi.admin.deleteOrg(String(o._id)).then(load),
            }))}
          />
        </div>
      )}

      {tab === 'users' && (
        <DataTable
          columns={['Name', 'Email', 'Role', 'Dept', 'Status', 'Last Login']}
          rows={users.map((u) => [
            String(u.name), String(u.email), String(u.role), String(u.department || '—'),
            String(u.status || (u.isActive ? 'active' : 'inactive')),
            u.lastLoginAt ? formatDate(String(u.lastLoginAt)) : '—',
          ])}
          rowActions={users.map((u) => ({
            lock: !u.isLocked ? () => moduleApi.admin.lockUser(String(u._id)).then(load) : undefined,
            unlock: u.isLocked ? () => moduleApi.admin.unlockUser(String(u._id)).then(load) : undefined,
            reset: () => { setSelectedUserId(String(u._id)); setModal('reset'); },
            deactivate: () => moduleApi.admin.updateUser(String(u._id), { isActive: false, status: 'inactive' }).then(load),
            delete: () => moduleApi.admin.deleteUser(String(u._id)).then(load),
          }))}
        />
      )}

      {tab === 'roles' && (
        <div className="space-y-4">
          <button type="button" onClick={() => setModal('role')} className="btn-accent text-xs flex items-center gap-1">
            <Plus size={12} /> New role
          </button>
          <DataTable
            columns={['Key', 'Label', 'System', 'Enabled', 'Permissions']}
            rows={roles.map((r) => [
              String(r.key), String(r.label), r.isSystem ? 'Yes' : 'No',
              r.enabled ? 'Yes' : 'No', String((r.permissions as string[])?.length ?? 0),
            ])}
          />
        </div>
      )}

      {tab === 'permissions' && permissions && (
        <div className="command-card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield size={14} /> Permission matrix
          </h3>
          <p className="text-xs text-slate-500">Role → Workspace → Actions. Select a role to view grants.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500">
                  <th className="px-2 py-2">Workspace</th>
                  {['view', 'create', 'edit', 'delete', 'approve', 'export'].map((a) => (
                    <th key={a} className="px-2 py-2 capitalize">{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissions.matrix).map(([ws, actions]) => (
                  <tr key={ws} className="border-b border-white/5">
                    <td className="px-2 py-2 text-slate-300 capitalize">{ws.replace(/_/g, ' ')}</td>
                    {['view', 'create', 'edit', 'delete', 'approve', 'export'].map((a) => (
                      <td key={a} className="px-2 py-2 text-center">
                        {(actions as string[]).includes(a) ? '✓' : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {permissions.roles.slice(0, 12).map((r) => (
              <div key={String(r.key)} className="rounded-lg border border-white/5 p-3">
                <p className="text-sm font-medium text-white">{String(r.label)}</p>
                <p className="text-[10px] text-slate-500">{String(r.key)}</p>
                <p className="mt-1 text-[10px] text-slate-400">{(r.permissions as string[])?.slice(0, 4).join(', ')}…</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'invitations' && (
        <div className="space-y-4">
          <button type="button" onClick={() => setModal('invite')} className="btn-accent text-xs flex items-center gap-1">
            <Mail size={12} /> Invite user
          </button>
          {inviteResult && (
            <div className="command-card border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
              Temporary password: <code className="font-mono">{inviteResult}</code> — share securely.
            </div>
          )}
          <DataTable
            columns={['Email', 'Role', 'Status', 'Invited By', 'Expires']}
            rows={invitations.map((i) => [
              String(i.email), String(i.role), String(i.status), String(i.invitedBy || '—'),
              i.expiresAt ? formatDate(String(i.expiresAt)) : '—',
            ])}
            rowActions={invitations.map((i) => ({
              resend: i.status === 'pending' ? async () => {
                const res = await moduleApi.admin.resendInvite(String(i._id));
                setInviteResult(res.data.temporaryPassword);
                load();
              } : undefined,
            }))}
          />
        </div>
      )}

      {tab === 'audit' && (
        <DataTable
          columns={['Action', 'Entity', 'User', 'When']}
          rows={auditLogs.map((a) => [
            String(a.action), `${String(a.entityType)}${a.entityId ? ` #${String(a.entityId).slice(-6)}` : ''}`,
            String(a.userName || '—'), a.createdAt ? formatDate(String(a.createdAt)) : '—',
          ])}
        />
      )}

      {tab === 'settings' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(() => moduleApi.admin.updateSettings(settingsForm));
          }}
          className="command-card max-w-lg space-y-3 p-4"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Settings size={14} /> Platform settings
          </h3>
          <TextField label="Platform name" value={settingsForm.platformName} onChange={(e) => setSettingsForm({ ...settingsForm, platformName: e.target.value })} />
          <TextField label="Password expiry (days)" type="number" value={String(settingsForm.passwordExpiryDays)} onChange={(e) => setSettingsForm({ ...settingsForm, passwordExpiryDays: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={settingsForm.allowSelfRegistration} onChange={(e) => setSettingsForm({ ...settingsForm, allowSelfRegistration: e.target.checked })} />
            Allow self-registration
          </label>
          {settings && (
            <p className="text-[10px] text-slate-500">
              Storage: {String(settings.storageUsedMb)} / {String(settings.storageLimitMb)} MB · API calls: {String(settings.apiCallsThisMonth)}
            </p>
          )}
          <FormActions onCancel={() => {}} loading={saving} submitLabel="Save settings" />
        </form>
      )}

      <Modal open={modal === 'org'} onClose={() => setModal(null)} title="New organization">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.admin.createOrganization(orgForm)); }} className="space-y-3">
          <TextField label="Name" required value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
          <TextField label="Industry" value={orgForm.industry} onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })} />
          <TextField label="Contact person" value={orgForm.contactPerson} onChange={(e) => setOrgForm({ ...orgForm, contactPerson: e.target.value })} />
          <TextField label="Email" value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Create" />
        </form>
      </Modal>

      <Modal open={modal === 'user'} onClose={() => setModal(null)} title="Create user">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.admin.createUser(userForm)); }} className="space-y-3">
          <TextField label="Name" required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
          <TextField label="Email" required type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
          <TextField label="Password" required type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
          <SelectField label="Role" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
            {roles.map((r) => <option key={String(r.key)} value={String(r.key)}>{String(r.label)}</option>)}
          </SelectField>
          <TextField label="Department" value={userForm.department} onChange={(e) => setUserForm({ ...userForm, department: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Create" />
        </form>
      </Modal>

      <Modal open={modal === 'role'} onClose={() => setModal(null)} title="Create role">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.admin.createRole({ ...roleForm, clonedFrom: roleForm.clonedFrom || undefined })); }} className="space-y-3">
          <TextField label="Key" required value={roleForm.key} onChange={(e) => setRoleForm({ ...roleForm, key: e.target.value })} />
          <TextField label="Label" required value={roleForm.label} onChange={(e) => setRoleForm({ ...roleForm, label: e.target.value })} />
          <SelectField label="Clone from" value={roleForm.clonedFrom} onChange={(e) => setRoleForm({ ...roleForm, clonedFrom: e.target.value })}>
            <option value="">—</option>
            {roles.map((r) => <option key={String(r.key)} value={String(r.key)}>{String(r.label)}</option>)}
          </SelectField>
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Create" />
        </form>
      </Modal>

      <Modal open={modal === 'invite'} onClose={() => setModal(null)} title="Invite user">
        <form onSubmit={(e) => {
          e.preventDefault();
          submit(async () => {
            const res = await moduleApi.admin.inviteUser(inviteForm);
            setInviteResult(res.data.temporaryPassword);
          });
        }} className="space-y-3">
          <TextField label="Email" required type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
          <SelectField label="Role" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
            {roles.map((r) => <option key={String(r.key)} value={String(r.key)}>{String(r.label)}</option>)}
          </SelectField>
          <TextField label="Department" value={inviteForm.department} onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Send invite" />
        </form>
      </Modal>

      <Modal open={modal === 'reset'} onClose={() => setModal(null)} title="Reset password">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!selectedUserId) return;
          submit(() => moduleApi.admin.resetPassword(selectedUserId, resetForm));
        }} className="space-y-3">
          <TextField label="New password" required type="password" value={resetForm.password} onChange={(e) => setResetForm({ password: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Reset" />
        </form>
      </Modal>
    </ModulePageLayout>
  );
}

function DataTable({
  columns, rows, rowActions,
}: {
  columns: string[];
  rows: string[][];
  rowActions?: Array<{ suspend?: () => void; activate?: () => void; delete?: () => void; lock?: () => void; unlock?: () => void; reset?: () => void; deactivate?: () => void; resend?: () => void }>;
}) {
  return (
    <div className="command-card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
            {columns.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}
            {rowActions?.length ? <th className="px-4 py-3">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">No records</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
              {row.map((cell, j) => <td key={j} className="px-4 py-3 text-slate-300">{cell}</td>)}
              {rowActions?.[i] && (
                <td className="px-4 py-3 space-x-2">
                  {rowActions[i].activate && <ActionBtn label="Activate" onClick={rowActions[i].activate!} />}
                  {rowActions[i].suspend && <ActionBtn label="Suspend" onClick={rowActions[i].suspend!} />}
                  {rowActions[i].lock && <ActionBtn icon={<Lock size={10} />} label="Lock" onClick={rowActions[i].lock!} />}
                  {rowActions[i].unlock && <ActionBtn icon={<Unlock size={10} />} label="Unlock" onClick={rowActions[i].unlock!} />}
                  {rowActions[i].reset && <ActionBtn icon={<Key size={10} />} label="Reset" onClick={rowActions[i].reset!} />}
                  {rowActions[i].deactivate && <ActionBtn label="Deactivate" onClick={rowActions[i].deactivate!} />}
                  {rowActions[i].resend && <ActionBtn label="Resend" onClick={rowActions[i].resend!} />}
                  {rowActions[i].delete && <ActionBtn label="Delete" onClick={rowActions[i].delete!} danger />}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionBtn({ label, onClick, icon, danger }: { label: string; onClick: () => void; icon?: ReactNode; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cn('text-[10px] hover:underline inline-flex items-center gap-1', danger ? 'text-red-400' : 'text-sky-400')}>
      {icon}{label}
    </button>
  );
}
