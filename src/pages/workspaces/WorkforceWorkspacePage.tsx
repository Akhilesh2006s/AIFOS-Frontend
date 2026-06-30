import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowLeft, Calendar, CheckCircle2, Clock,
  HardHat, Plus, RefreshCw, Users, UserPlus,
} from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { useContextStore } from '@/store/context';
import { moduleApi } from '@/api/client';
import { cn, formatDate } from '@/lib/utils';
import { WorkforceSafetyTab } from '@/components/workforce/WorkforceSafetyTab';
import { WorkforcePermitsTab } from '@/components/workforce/WorkforcePermitsTab';
import { WorkforceQualityTab } from '@/components/workforce/WorkforceQualityTab';
import { WorkforceIntelligenceHub, type W5Section } from '@/components/workforce/WorkforceIntelligenceHub';

const TABS = [
  'overview', 'employees', 'contractors', 'teams', 'allocations', 'attendance',
  'safety', 'permits', 'quality',
  'productivity', 'training', 'skills', 'certifications', 'performance', 'intelligence', 'reports',
] as const;

const W5_TABS = new Set<W5Section>(['productivity', 'training', 'skills', 'certifications', 'performance', 'intelligence', 'reports']);

type Dashboard = {
  kpis: Record<string, number>;
  peopleOnSite: Array<Record<string, string>>;
  safetyAlerts: Array<Record<string, unknown>>;
  trainingExpiry: Array<Record<string, unknown>>;
  resourceAllocation: Array<Record<string, unknown>>;
  recentActivity: Array<{ type: string; label: string; at: string; link: string }>;
  attendance: { records: Array<Record<string, unknown>> };
};

export function WorkforceWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as (typeof TABS)[number]) || 'overview';
  const activeProject = useContextStore((s) => s.activeProject);
  const projectId = activeProject?.id;

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [employees, setEmployees] = useState<Array<Record<string, unknown>>>([]);
  const [contractors, setContractors] = useState<Array<Record<string, unknown>>>([]);
  const [teams, setTeams] = useState<Array<Record<string, unknown>>>([]);
  const [allocations, setAllocations] = useState<Array<Record<string, unknown>>>([]);
  const [attendance, setAttendance] = useState<Array<Record<string, unknown>>>([]);

  const [modal, setModal] = useState<'employee' | 'contractor' | 'team' | 'allocation' | 'checkin' | null>(null);
  const [saving, setSaving] = useState(false);

  const [empForm, setEmpForm] = useState({
    employeeId: '', name: '', designation: '', department: 'Projects',
    phone: '', email: '', assignedProjectId: projectId || '', employmentType: 'full_time',
  });
  const [contractorForm, setContractorForm] = useState({ companyName: '', supervisorName: '', workerCount: 0, labourLicense: '' });
  const [teamForm, setTeamForm] = useState({ name: '', teamType: 'crew', projectId: projectId || '', supervisorName: '' });
  const [allocForm, setAllocForm] = useState({
    resourceType: 'employee', resourceId: '', resourceName: '', projectId: projectId || '',
    taskDescription: '', startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });
  const [checkInForm, setCheckInForm] = useState({ employeeId: '', projectId: projectId || '', siteId: '', shift: 'day' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, emps, cont, tms, allocs, att] = await Promise.all([
        moduleApi.workforce.dashboard(projectId),
        moduleApi.workforce.employees(projectId),
        moduleApi.workforce.contractors(projectId),
        moduleApi.workforce.teams(projectId),
        moduleApi.workforce.allocations(projectId),
        moduleApi.workforce.attendance(projectId),
      ]);
      setDashboard(dash.data);
      setEmployees(emps.data);
      setContractors(cont.data);
      setTeams(tms.data);
      setAllocations(allocs.data);
      setAttendance(att.data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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
      await load();
    } finally {
      setSaving(false);
    }
  };

  const k = dashboard?.kpis;

  return (
    <ModulePageLayout
      title="Workforce"
      subtitle={activeProject ? `Field workforce — ${activeProject.name}` : 'People on site · attendance · allocations · contractors'}
      loading={loading}
      stats={[
        { label: 'Present', value: k?.employeesPresent ?? 0, color: '#22C55E' },
        { label: 'Absent', value: k?.employeesAbsent ?? 0, color: '#EF4444' },
        { label: 'Late', value: k?.late ?? 0, color: '#EAB308' },
        { label: 'Contractors', value: k?.contractors ?? 0, color: '#8B5CF6' },
        { label: 'Allocated', value: k?.resourcesAllocated ?? 0, color: '#38BDF8' },
        { label: 'Training Due', value: k?.trainingDue ?? 0, color: '#F97316' },
        { label: 'Permits', value: k?.permitsActive ?? 0, color: '#10B981' },
        { label: 'Safety Alerts', value: k?.safetyAlerts ?? 0, color: '#DC2626' },
      ]}
      heroActions={
        <div className="flex gap-2">
          <button type="button" onClick={() => setModal('employee')} className="btn-primary flex items-center gap-2 text-sm">
            <UserPlus size={14} /> Add Employee
          </button>
          <Link to="/mission-control" className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft size={14} /> Mission Control
          </Link>
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

      {tab === 'overview' && dashboard && (
        <div className="space-y-4">
          {(dashboard.safetyAlerts?.length ?? 0) > 0 && (
            <div className="command-card border-red-500/30 bg-red-500/5 p-4">
              <h3 className="text-sm font-semibold text-red-300 flex items-center gap-2">
                <AlertTriangle size={14} /> Safety alerts
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {dashboard.safetyAlerts.slice(0, 5).map((a, i) => (
                  <li key={i}>{String(a.name)} — {String(a.certification)} ({String(a.severity)})</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="command-card p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Users size={14} /> People on site
              </h3>
              <ul className="space-y-2 text-sm">
                {dashboard.peopleOnSite.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex justify-between text-slate-300">
                    <span>{p.name} · {p.designation}</span>
                    <span className="text-[10px] text-slate-500">{p.employeeId}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="command-card p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Activity size={14} /> Recent activity
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                {dashboard.recentActivity.map((a, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{a.label}</span>
                    <span>{formatDate(a.at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <button type="button" onClick={() => setModal('allocation')} className="command-card p-4 text-left hover:border-white/20">
              <Calendar size={18} className="text-sky-400 mb-2" />
              <p className="text-sm font-medium text-white">Allocate resource</p>
              <p className="text-[10px] text-slate-500">Project → Site → Task → Date</p>
            </button>
            <button type="button" onClick={() => setModal('checkin')} className="command-card p-4 text-left hover:border-white/20">
              <CheckCircle2 size={18} className="text-emerald-400 mb-2" />
              <p className="text-sm font-medium text-white">Check in</p>
              <p className="text-[10px] text-slate-500">Mark attendance on site</p>
            </button>
            <button type="button" onClick={() => setModal('contractor')} className="command-card p-4 text-left hover:border-white/20">
              <HardHat size={18} className="text-amber-400 mb-2" />
              <p className="text-sm font-medium text-white">Add contractor</p>
              <p className="text-[10px] text-slate-500">Subcontractor company</p>
            </button>
          </div>
        </div>
      )}

      {tab === 'employees' && (
        <DataTable
          columns={['ID', 'Name', 'Designation', 'Dept', 'Status', 'Project']}
          rows={employees.map((e) => [
            String(e.employeeId), String(e.name), String(e.designation),
            String(e.department), String(e.currentStatus), String(e.assignedProjectId || '—'),
          ])}
        />
      )}

      {tab === 'contractors' && (
        <DataTable
          columns={['Company', 'Supervisor', 'Workers', 'Compliance', 'License']}
          rows={contractors.map((c) => [
            String(c.companyName), String(c.supervisorName || '—'), String(c.workerCount),
            String(c.complianceStatus), String(c.labourLicense || '—'),
          ])}
        />
      )}

      {tab === 'teams' && (
        <div className="space-y-4">
          <button type="button" onClick={() => setModal('team')} className="btn-accent text-xs flex items-center gap-1">
            <Plus size={12} /> New team
          </button>
          <DataTable
            columns={['Team', 'Type', 'Project', 'Supervisor', 'Members']}
            rows={teams.map((t) => [
              String(t.name), String(t.teamType), String(t.projectId || '—'),
              String(t.supervisorName || '—'), String((t.memberIds as string[])?.length ?? 0),
            ])}
          />
        </div>
      )}

      {tab === 'allocations' && (
        <div className="space-y-4">
          <button type="button" onClick={() => setModal('allocation')} className="btn-accent text-xs flex items-center gap-1">
            <Plus size={12} /> New allocation
          </button>
          <DataTable
            columns={['Resource', 'Type', 'Project', 'Task', 'Start', 'End', 'Status']}
            rows={allocations.map((a) => [
              String(a.resourceName), String(a.resourceType), String(a.projectId),
              String(a.taskDescription || '—'), formatDate(String(a.startDate)), formatDate(String(a.endDate)), String(a.status),
            ])}
          />
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-4">
          <button type="button" onClick={() => setModal('checkin')} className="btn-accent text-xs flex items-center gap-1">
            <Clock size={12} /> Check in
          </button>
          <DataTable
            columns={['Employee', 'Project', 'Check In', 'Check Out', 'Shift', 'Status']}
            rows={attendance.map((a) => [
              String(a.employeeName || a.employeeId), String(a.projectId),
              a.checkInAt ? formatDate(String(a.checkInAt)) : '—',
              a.checkOutAt ? formatDate(String(a.checkOutAt)) : '—',
              String(a.shift), String(a.status),
            ])}
            actions={attendance.filter((a) => !a.checkOutAt).map((a) => ({
              id: String(a.id),
              label: `Check out ${a.employeeName}`,
              onClick: () => moduleApi.workforce.checkOut(String(a.id), {}).then(load),
            }))}
          />
        </div>
      )}

      {tab === 'safety' && <WorkforceSafetyTab projectId={projectId} />}

      {tab === 'permits' && <WorkforcePermitsTab projectId={projectId} />}

      {tab === 'quality' && <WorkforceQualityTab projectId={projectId} />}

      {W5_TABS.has(tab as W5Section) && (
        <WorkforceIntelligenceHub projectId={projectId} section={tab as W5Section} />
      )}

      <Modal open={modal === 'employee'} onClose={() => setModal(null)} title="New employee">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.createEmployee(empForm)); }} className="space-y-3">
          <TextField label="Employee ID" required value={empForm.employeeId} onChange={(e) => setEmpForm({ ...empForm, employeeId: e.target.value })} />
          <TextField label="Name" required value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} />
          <TextField label="Designation" required value={empForm.designation} onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })} />
          <TextField label="Department" value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} />
          <TextField label="Phone" value={empForm.phone} onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })} />
          <TextField label="Project ID" value={empForm.assignedProjectId} onChange={(e) => setEmpForm({ ...empForm, assignedProjectId: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Create" />
        </form>
      </Modal>

      <Modal open={modal === 'contractor'} onClose={() => setModal(null)} title="New contractor">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.createContractor({ ...contractorForm, projectIds: projectId ? [projectId] : [] })); }} className="space-y-3">
          <TextField label="Company" required value={contractorForm.companyName} onChange={(e) => setContractorForm({ ...contractorForm, companyName: e.target.value })} />
          <TextField label="Supervisor" value={contractorForm.supervisorName} onChange={(e) => setContractorForm({ ...contractorForm, supervisorName: e.target.value })} />
          <TextField label="Labour License" value={contractorForm.labourLicense} onChange={(e) => setContractorForm({ ...contractorForm, labourLicense: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Create" />
        </form>
      </Modal>

      <Modal open={modal === 'team'} onClose={() => setModal(null)} title="New team">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.createTeam(teamForm)); }} className="space-y-3">
          <TextField label="Team name" required value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
          <SelectField label="Type" value={teamForm.teamType} onChange={(e) => setTeamForm({ ...teamForm, teamType: e.target.value })}>
            {['crew', 'department', 'project', 'site', 'shift'].map((t) => <option key={t} value={t}>{t}</option>)}
          </SelectField>
          <TextField label="Supervisor" value={teamForm.supervisorName} onChange={(e) => setTeamForm({ ...teamForm, supervisorName: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Create" />
        </form>
      </Modal>

      <Modal open={modal === 'allocation'} onClose={() => setModal(null)} title="Allocate resource">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.createAllocation(allocForm)); }} className="space-y-3">
          <SelectField label="Type" value={allocForm.resourceType} onChange={(e) => setAllocForm({ ...allocForm, resourceType: e.target.value })}>
            {['employee', 'contractor', 'operator', 'technician'].map((t) => <option key={t} value={t}>{t}</option>)}
          </SelectField>
          <TextField label="Resource ID" required value={allocForm.resourceId} onChange={(e) => setAllocForm({ ...allocForm, resourceId: e.target.value })} />
          <TextField label="Resource name" required value={allocForm.resourceName} onChange={(e) => setAllocForm({ ...allocForm, resourceName: e.target.value })} />
          <TextField label="Project ID" required value={allocForm.projectId} onChange={(e) => setAllocForm({ ...allocForm, projectId: e.target.value })} />
          <TextField label="Task" value={allocForm.taskDescription} onChange={(e) => setAllocForm({ ...allocForm, taskDescription: e.target.value })} />
          <TextField label="Start" type="date" required value={allocForm.startDate} onChange={(e) => setAllocForm({ ...allocForm, startDate: e.target.value })} />
          <TextField label="End" type="date" required value={allocForm.endDate} onChange={(e) => setAllocForm({ ...allocForm, endDate: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Allocate" />
        </form>
      </Modal>

      <Modal open={modal === 'checkin'} onClose={() => setModal(null)} title="Check in">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.checkIn(checkInForm)); }} className="space-y-3">
          <TextField label="Employee ID" required value={checkInForm.employeeId} onChange={(e) => setCheckInForm({ ...checkInForm, employeeId: e.target.value })} />
          <TextField label="Project ID" required value={checkInForm.projectId} onChange={(e) => setCheckInForm({ ...checkInForm, projectId: e.target.value })} />
          <TextField label="Site ID" value={checkInForm.siteId} onChange={(e) => setCheckInForm({ ...checkInForm, siteId: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Check in" />
        </form>
      </Modal>
    </ModulePageLayout>
  );
}

function DataTable({
  columns, rows, actions,
}: {
  columns: string[];
  rows: string[][];
  actions?: Array<{ id: string; label: string; onClick: () => void }>;
}) {
  return (
    <div className="command-card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
            {columns.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}
            {actions?.length ? <th className="px-4 py-3" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">No records</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
              {row.map((cell, j) => <td key={j} className="px-4 py-3 text-slate-300">{cell}</td>)}
              {actions?.[i] && (
                <td className="px-4 py-3">
                  <button type="button" onClick={actions[i].onClick} className="text-xs text-sky-400 hover:underline">
                    {actions[i].label}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
