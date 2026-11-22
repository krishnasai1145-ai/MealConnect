import { BarChart3, HeartHandshake, Leaf, LayoutDashboard, LogIn, LogOut, ShieldCheck, Trophy, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SidebarView = 'donor' | 'ngo' | 'impact' | 'directory' | 'volunteer' | 'leaderboard' | 'csr';

interface SidebarProps {
  active: SidebarView;
  onSelect: (view: SidebarView) => void;
  signedIn: boolean;
  email?: string;
  onSignOut?: () => void;
  onSignIn?: () => void;
}

const LINKS: { view: SidebarView; label: string; icon: LucideIcon }[] = [
  { view: 'donor', label: "PG's / Hostels", icon: LayoutDashboard },
  { view: 'ngo', label: 'Helpers/NGO', icon: HeartHandshake },
  { view: 'impact', label: 'Impact', icon: BarChart3 },
  { view: 'volunteer', label: 'Volunteer', icon: Truck },
  { view: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { view: 'csr', label: 'CSR Sponsors', icon: Leaf },
  { view: 'directory', label: 'Verified NGOs', icon: ShieldCheck },
];

export default function Sidebar({
  active,
  onSelect,
  signedIn,
  email,
  onSignOut,
  onSignIn,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">
          <Leaf size={18} strokeWidth={2} aria-hidden="true" />
        </span>
        <div>
          <p className="sidebar-title">Meal Connect</p>
          <p className="sidebar-caption">Food rescue platform</p>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Dashboards">
        {LINKS.map(({ view, label, icon: Icon }) => {
          const isActive = active === view;
          return (
            <button
              key={view}
              type="button"
              className={`sidebar-link${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(view)}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {signedIn ? (
          <>
            {email && (
              <p className="sidebar-email" title={email}>
                {email}
              </p>
            )}
            <button type="button" className="secondary sidebar-action" onClick={onSignOut}>
              <LogOut size={18} strokeWidth={2} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </>
        ) : (
          <button type="button" className="primary sidebar-action" onClick={onSignIn}>
            <LogIn size={18} strokeWidth={2} aria-hidden="true" />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </aside>
  );
}
