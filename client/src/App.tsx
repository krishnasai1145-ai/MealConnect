import { useState } from 'react';
import CsrDashboard from "./CsrDashboard";
import DonorDashboard from './DonorDashboard';
import ImpactDashboard from './ImpactDashboard';
import Leaderboard from './Leaderboard';
import LoginForm from './LoginForm';
import NgoDashboard from './NgoDashboard';
import NgoDirectory from './NgoDirectory';
import Sidebar from './Sidebar';
import type { SidebarView } from './Sidebar';
import VolunteerDashboard from './VolunteerDashboard';

const TOKEN_KEY = 'mc_token';

type TabId = SidebarView;

const PAGE_HEADERS: Record<TabId, { title: string; subtitle: string }> = {
  donor: {
    title: 'Donor dashboard',
    subtitle: 'Post surplus food and manage your listings',
  },
  ngo: {
    title: 'NGO dashboard',
    subtitle: 'Find and claim available food near you',
  },
  impact: {
    title: 'Impact dashboard',
    subtitle: 'Sample data · 1 meal = 500 g of food',
  },
  directory: {
    title: 'NGO directory',
    subtitle: 'Verified NGOs and their trust scores',
  },
  volunteer: {
    title: 'Volunteer dashboard',
    subtitle: 'Pick up surplus food and deliver it to NGOs',
  },
  leaderboard: {
    title: 'Leaderboard',
    subtitle: 'Achievements for NGOs and volunteers',
  },
  csr: {
    title: 'CSR sponsorship dashboard',
    subtitle: 'Companies sponsor deliveries and food rescue campaigns (mock data)',
  },
};

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [showLogin, setShowLogin] = useState(false);
  const [tab, setTab] = useState<TabId>('donor');

  function handleLogin(newToken: string, newEmail: string) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setEmail(newEmail);
    setShowLogin(false);
  }

  function handleSignOut() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setEmail(undefined);
  }

  const header = PAGE_HEADERS[tab];

  return (
    <div className="app-shell">
      <Sidebar
        active={tab}
        onSelect={setTab}
        signedIn={token !== null}
        email={email}
        onSignOut={handleSignOut}
        onSignIn={() => setShowLogin((s) => !s)}
      />

      <main className="main-area">
        <div key={tab} className="page-enter">
          <header className="page-header">
            <h1 className="page-title">{header.title}</h1>
            <p className="page-subtitle">{header.subtitle}</p>
          </header>

          <p className="safety-notice" role="note"><span aria-hidden="true">ⓘ</span> The platform connects people and does not certify that food is safe.</p>


          {!token && showLogin && <LoginForm onLogin={handleLogin} />}

          {tab === 'donor' ? (
            <DonorDashboard token={token ?? undefined} />
          ) : tab === 'ngo' ? (
            <NgoDashboard token={token ?? undefined} />
          ) : tab === 'directory' ? (
            <NgoDirectory />
          ) : tab === 'volunteer' ? (
            <VolunteerDashboard />
          ) : tab === 'leaderboard' ? (
            <Leaderboard />
          ) : tab === 'csr' ? (
            <CsrDashboard />
          ) : (
            <ImpactDashboard />
          )}
        </div>
      </main>
    </div>
  );
}
