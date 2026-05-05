import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  ClipboardList,
  BookOpen,
  Newspaper,
  Lightbulb,
  Settings,
} from 'lucide-react';
import { useAppState } from '../hooks/useLocalStorage';

function isOverdue(contact: { reply_status: string; follow_up_due: string | null }): boolean {
  if (!contact.follow_up_due) return false;
  if (contact.reply_status === 'call_booked' || contact.reply_status === 'declined') return false;
  const today = new Date().toISOString().slice(0, 10);
  return contact.follow_up_due < today;
}

function NavItem({
  to,
  icon: Icon,
  label,
  badge,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}) {
  return (
    <NavLink
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
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

export default function Layout() {
  const [state] = useAppState();
  const overdueContacts = (state.contacts ?? []).filter(isOverdue).length;

  return (
    <div className="flex h-screen">
      <aside className="w-60 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-zinc-200">
          <h1 className="text-sm font-bold tracking-tight text-zinc-900 uppercase">
            sponsor-track-ie
          </h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/jobs" icon={Briefcase} label="Jobs" />
          <NavItem to="/contacts" icon={Users} label="Contacts" badge={overdueContacts || undefined} />
          <NavItem to="/sponsors" icon={Building2} label="Sponsors" />
          <NavItem to="/interview" icon={ClipboardList} label="Interview" />
          <NavItem to="/study" icon={BookOpen} label="Study" />
          <NavItem to="/news" icon={Newspaper} label="News" />
          <NavItem to="/blog" icon={Lightbulb} label="Blog Ideas" />
          <NavItem to="/settings" icon={Settings} label="Settings" />
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
