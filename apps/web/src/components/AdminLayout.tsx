import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Plus,
  Users,
  ExternalLink,
  LogOut,
  Sparkles,
  Clapperboard,
  ChevronDown,
  ChevronRight,
  Film,
  Receipt,
  Menu,
  X,
  Grid,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavGroup {
  groupTitle: string;
  items: Array<{
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    subItems?: Array<{ label: string; path: string }>;
  }>;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Artists Management': true,
    'Catalog & Content': true,
    'Appearance & Storefront': true,
    'Creators & Database Users': true,
  });

  const handleSignOutAdmin = () => {
    localStorage.removeItem('user_role');
    navigate('/');
  };

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };

  const menuGroups: NavGroup[] = [
    {
      groupTitle: 'Dashboard',
      items: [
        {
          label: 'Default Overview',
          path: '/admin',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupTitle: 'Cast & Crew',
      items: [
        {
          label: 'Artists Management',
          path: '/admin/people',
          icon: Users,
          subItems: [
            { label: 'All Cast & Crew', path: '/admin/people' },
          ],
        },
      ],
    },
    {
      groupTitle: 'Series & Episodes',
      items: [
        {
          label: 'Catalog & Content',
          path: '/admin?tab=catalog',
          icon: Film,
          subItems: [
            { label: 'All Catalog Content', path: '/admin?tab=catalog' },
            { label: 'Add New Series / Movie', path: '/admin/titles/new' },
            { label: 'Manage Series Genre', path: '/admin/genres' },
          ],
        },
      ],
    },
    {
      groupTitle: 'Appearance & Storefront',
      items: [
        {
          label: 'Appearance & Ranking',
          path: '/admin?tab=appearance',
          icon: Sparkles,
          subItems: [
            { label: 'Realtime Ranking Studio', path: '/admin?tab=appearance&sub=ranking' },
            { label: 'Featured Hero Pins', path: '/admin?tab=appearance&sub=featured' },
            { label: 'Section Controls', path: '/admin?tab=appearance&sub=sections' },
          ],
        },
      ],
    },
    {
      groupTitle: 'Registration Management',
      items: [
        {
          label: 'Creators & Registration',
          path: '/admin?tab=creators-list',
          icon: Clapperboard,
          subItems: [
            { label: 'Creators Directory', path: '/admin?tab=creators-list' },
            { label: 'Revenue Share Breakdown', path: '/admin?tab=creators' },
          ],
        },
      ],
    },
    {
      groupTitle: 'Playout Management',
      items: [
        {
          label: 'Payout Statements & UTR',
          path: '/admin?tab=payouts',
          icon: Receipt,
          subItems: [
            { label: 'Payout Statements & UTR', path: '/admin?tab=payouts' },
          ],
        },
      ],
    },
  ];

  // Calculate Breadcrumb text
  const getBreadcrumb = () => {
    const search = location.search;
    if (location.pathname === '/admin/titles/new') return 'Series & Episodes / Add New Content';
    if (location.pathname.includes('/edit')) return 'Series & Episodes / Edit Content Title';
    if (location.pathname === '/admin/people') return 'Cast & Crew / Artists Management';
    if (location.pathname === '/admin/genres') return 'Series & Episodes / Manage Series Genre';
    if (search.includes('tab=appearance')) return 'Appearance & Storefront / Ranking & Sections';
    if (search.includes('tab=creators')) return 'Registration Management / Creators Directory';
    if (search.includes('tab=payouts')) return 'Playout Management / Payout Statements & UTR';
    return 'Dashboards / Default Overview';
  };

  return (
    <div className="min-h-screen bg-[#070913] text-gray-100 flex font-sans selection:bg-purple-500 selection:text-white">
      {/* 1. LEFT SIDEBAR PANEL (Desktop persistent, Mobile slide-over) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d121f] border-r border-white/10 flex flex-col transition-transform duration-300 transform lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
              R
            </div>
            <div>
              <span className="font-black text-lg tracking-tighter text-white block leading-none">
                RASIGAN<span className="text-purple-400">.</span>
              </span>
              <span className="text-[9px] text-purple-300/80 font-mono font-bold tracking-widest uppercase">Admin Panel</span>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Structured Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-[10px] font-black uppercase tracking-wider text-gray-400/80">
                {group.groupTitle}
              </h3>

              <div className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const hasSub = item.subItems && item.subItems.length > 0;
                  const isOpen = openGroups[item.label] ?? true;

                  const isPathActive =
                    item.path === '/admin'
                      ? location.pathname === '/admin' && !location.search
                      : item.path.includes('?')
                      ? location.pathname === '/admin' && location.search.includes(item.path.split('?')[1])
                      : location.pathname.startsWith(item.path);

                  return (
                    <div key={itemIdx} className="space-y-1">
                      <div
                        onClick={() => {
                          if (hasSub) {
                            toggleGroup(item.label);
                          } else {
                            navigate(item.path);
                            setIsMobileOpen(false);
                          }
                        }}
                        className={`group px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          isPathActive
                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-md'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isPathActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-300'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {hasSub && (
                          <span className="text-gray-400 group-hover:text-white transition-colors">
                            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </span>
                        )}
                      </div>

                      {/* Collapsible Sub-menu Items */}
                      {hasSub && isOpen && (
                        <div className="ml-6 pl-2.5 border-l border-white/10 space-y-1 pt-0.5">
                          {item.subItems!.map((sub, subIdx) => {
                            const isSubActive =
                              sub.path.includes('?')
                                ? location.pathname === '/admin' && location.search.includes(sub.path.split('?')[1])
                                : location.pathname === sub.path;

                            return (
                              <Link
                                key={subIdx}
                                to={sub.path}
                                onClick={() => setIsMobileOpen(false)}
                                className={`block px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                  isSubActive
                                    ? 'bg-purple-500/20 text-white font-bold border border-purple-400/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-black text-xs flex items-center justify-center border border-purple-400/40 shadow-sm">
                AD
              </div>
              <div className="truncate">
                <span className="font-extrabold text-xs text-white block truncate">Good Day, Admin!</span>
                <span className="text-[10px] text-purple-400 font-mono">Welcome to ADMIN!</span>
              </div>
            </div>

            <button
              onClick={handleSignOutAdmin}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* 2. RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#090D16]/90 border-b border-white/10 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white border border-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Grid className="w-4 h-4 text-purple-400" />
              <span>{getBreadcrumb()}</span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/admin/titles/new"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Series / Content</span>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition-all"
              title="View Main App"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">View Main App</span>
            </Link>

            <button
              onClick={handleSignOutAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Admin</span>
            </button>
          </div>
        </header>

        {/* Main Content View Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
