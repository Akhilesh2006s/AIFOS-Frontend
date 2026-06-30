import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuthStore, getStoredToken } from '@/store/auth';
import { getDefaultLandingPath, BEKEM_DEMO_ACCOUNTS, BEKEM_DEMO_PASSWORD } from '@/config/roleLanding';
import { useWorkspaceStore } from '@/store/workspace';
import { getRoleWorkspace } from '@/config/roleLanding';

export function LoginPage() {
  const navigate = useNavigate();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const { login, isLoading, token } = useAuthStore();
  const [email, setEmail] = useState(import.meta.env.DEV ? 'ceo@bekem.com' : '');
  const [password, setPassword] = useState(import.meta.env.DEV ? BEKEM_DEMO_PASSWORD : '');
  const [error, setError] = useState('');

  if (token || getStoredToken()) {
    const userStr = sessionStorage.getItem('afios_user') || localStorage.getItem('afios_user') || '{}';
    const user = JSON.parse(userStr);
    return <Navigate to={getDefaultLandingPath(user.role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      const user = JSON.parse(sessionStorage.getItem('afios_user') || localStorage.getItem('afios_user') || '{}');
      setWorkspace(getRoleWorkspace(user.role));
      navigate(getDefaultLandingPath(user.role));
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err) && !err.response
          ? 'Cannot reach API server. Check VITE_API_URL and backend CORS settings.'
          : 'Invalid email or password',
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-command-bg">
      {/* Left panel */}
      <div className="relative hidden overflow-hidden bg-navy lg:flex lg:w-[55%]">
        <div className="absolute inset-0" aria-hidden>
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-navy-light blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute -right-10 bottom-1/4 h-72 w-72 rounded-full bg-accent blur-3xl"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 ring-1 ring-accent/40">
                <span className="font-display text-2xl font-bold text-accent" aria-hidden>◆</span>
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-[0.18em] text-white">AFIOS</h1>
                <p className="text-overline mt-1">Operating System</p>
              </div>
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              Infrastructure
              <br />
              <span className="text-accent">Mission Control</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-slate-400">
              Enterprise visibility from procurement to project delivery.
              Built for CEOs, project directors and plant managers.
            </p>
            <div className="mt-14 grid max-w-sm grid-cols-2 gap-3">
              {['Projects', 'Equipment', 'Fleet', 'Compliance'].map((m, i) => (
                <motion.div
                  key={m}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-slate-300 backdrop-blur-sm"
                >
                  <span className="text-accent" aria-hidden>◆</span> {m}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel */}
      <div className="page-canvas flex flex-1 items-center justify-center px-6 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:hidden">
            <h1 className="font-display text-2xl font-bold tracking-wider text-white">AFIOS</h1>
            <p className="mt-1 text-sm text-slate-500">Infrastructure Operating System</p>
          </div>

          <div className="command-card p-8 sm:p-10">
            <div className="relative z-10">
              <p className="section-label mb-2">Secure Access</p>
              <h3 className="font-display text-2xl font-bold text-white">Sign in</h3>
              <p className="mb-8 mt-2 text-sm text-slate-500">Enter the infrastructure command center</p>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="login-email" className="input-label">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field py-3"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="input-label">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field py-3"
                    required
                  />
                </div>

                {error && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                  >
                    {error}
                  </motion.p>
                )}

                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5" aria-busy={isLoading}>
                  {isLoading ? 'Authenticating…' : 'Enter AFIOS →'}
                </button>
              </form>

              {import.meta.env.DEV && (
                <div className="mt-6 space-y-3 border-t border-white/5 pt-6">
                  <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Bekem demo personas
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {BEKEM_DEMO_ACCOUNTS.map((acct) => (
                      <button
                        key={acct.email}
                        type="button"
                        onClick={() => {
                          setEmail(acct.email);
                          setPassword(BEKEM_DEMO_PASSWORD);
                        }}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] transition-colors ${
                          email === acct.email
                            ? 'border-teal-500/50 bg-teal-500/10 text-teal-300'
                            : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                        }`}
                      >
                        {acct.label.split(' — ')[0]}
                      </button>
                    ))}
                  </div>
                  <p className="text-center font-mono text-[10px] text-slate-600">
                    Password: {BEKEM_DEMO_PASSWORD}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
