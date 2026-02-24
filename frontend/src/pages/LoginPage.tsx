import { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRouter } from '@tanstack/react-router';
import { Shield, Lock, CheckCircle, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login, loginStatus, identity, isInitializing } = useInternetIdentity();
  const router = useRouter();

  useEffect(() => {
    if (identity) {
      router.navigate({ to: '/' });
    }
  }, [identity, router]);

  const isLoggingIn = loginStatus === 'logging-in';

  const features = [
    { icon: <Shield size={16} />, text: 'Role-Based Access Control' },
    { icon: <CheckCircle size={16} />, text: 'Intelligent Approval Routing' },
    { icon: <BarChart3 size={16} />, text: 'Real-Time Progress Tracking' },
    { icon: <Users size={16} />, text: 'AI Risk & Compliance Monitoring' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/generated/login-bg.dim_1440x900.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-navy-900/80" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <img src="/assets/generated/accessflow-logo.dim_128x128.png" alt="AccessFlow" className="w-10 h-10" />
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">AccessFlow</h1>
              <p className="text-white/60 text-xs">Team 23 — Enterprise Edition</p>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-white text-3xl font-bold leading-tight">
              Workplace Access &<br />Resource Management
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              Streamline access requests, automate approvals, and maintain compliance — all in one intelligent platform.
            </p>
          </div>
          <div className="mt-10 space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  {f.icon}
                </div>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/40 text-xs">
          © {new Date().getFullYear()} AccessFlow. All rights reserved.
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <img src="/assets/generated/accessflow-logo.dim_128x128.png" alt="AccessFlow" className="w-10 h-10" />
            <div>
              <h1 className="font-bold text-xl">AccessFlow</h1>
              <p className="text-muted-foreground text-xs">Team 23</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Access your workplace management portal
            </p>
          </div>

          {/* MFA Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <Lock size={13} className="text-green-600" />
            <span className="text-xs text-green-700 font-medium">MFA Protected — Secure Authentication</span>
          </div>

          {/* Demo fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Demo fields — use Internet Identity below
            </p>
          </div>

          {/* Internet Identity Login */}
          <Button
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold h-11"
            onClick={login}
            disabled={isLoggingIn || isInitializing}
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield size={16} />
                Sign in with Internet Identity
              </span>
            )}
          </Button>

          {/* Role info */}
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">Available Roles (RBAC)</p>
            <div className="grid grid-cols-2 gap-1.5">
              {['Employee', 'Manager', 'IT Admin', 'Finance Admin'].map(role => (
                <div key={role} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  {role}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Roles are assigned by administrators after login.</p>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'accessflow-team23')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
