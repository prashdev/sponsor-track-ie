import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  BookOpen,
  Newspaper,
  Lightbulb,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/sponsors', icon: Building2, label: 'Sponsors' },
  { to: '/study', icon: BookOpen, label: 'Study' },
  { to: '/news', icon: Newspaper, label: 'News' },
  { to: '/blog', icon: Lightbulb, label: 'Blog Ideas' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  return (
    <div className="flex h-screen">
      <aside className="w-60 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-zinc-200">
          <h1 className="text-sm font-bold tracking-tight text-zinc-900 uppercase">
            sponsor-track-ie
          </h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-zinc-200 text-xs text-zinc-400">
          v1.0 &middot; Data in localStorage
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-zinc-50 p-8">
        <Outlet />
      </main>
    </div>
  );
}
