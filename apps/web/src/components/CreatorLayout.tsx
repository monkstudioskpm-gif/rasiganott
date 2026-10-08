import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ExternalLink,
  LogOut,
  LayoutDashboard,
  Film,
  TrendingUp,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Grid,
} from 'lucide-react';

interface CreatorLayoutProps {
  children: ReactNode;
}

interface NavGroup {
  groupTitle: string;
  items: Array<{
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    subItems?: Array<{ label: string; path: string }>;
  }>;
}

export function CreatorLayout({ children }: CreatorLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'My Content & Titles': true,
    'Financials & Payouts': true,
  });

  const handleSignOutCreator = () => {
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
          label: 'Creator Studio Overview',
          path: '/creator',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupTitle: 'My Content & Titles',
      items: [
        {
          label: 'Titles & Analytics',
          path: '/creator?sub=titles',
          icon: Film,
          subItems: [
            { label: 'Published Content Titles', path: '/creator?sub=titles' },
            { label: 'Views & Audience Metrics', path: '/creator?sub=titles' },
          ],
        },
      ],
    },
    {
      groupTitle: 'Financials & Payouts',
      items: [
        {
          label: 'Earnings & Statements',
          path: '/creator?sub=earnings',
          icon: TrendingUp,
          subItems: [
            { label: 'Revenue Share Breakdown', path: '/creator?sub=earnings' },
            { label: 'Payout Statements & UTR', path: '/creator?sub=payouts' },
            { label: 'Supporters & Donors', path: '/creator?sub=supporters' },
          ],
        },
      ],
    },
  ];

  const getBreadcrumb = () => {
    const search = location.search;
    if (search.includes('sub=titles')) return 'My Content & Titles / Published Content Titles';
    if (search.includes('sub=earnings')) return 'Financials & Payouts / Revenue Share Breakdown';
    if (search.includes('sub=payouts')) return 'Financials & Payouts / Payout Statements & UTR';
    if (search.includes('sub=supporters')) return 'Financials & Payouts / Supporters & Donors';
    return 'Creator Studio / Overview & Earnings';
  };

  return (
    <div className="min-h-screen bg-[#060A12] text-gray-100 flex font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. LEFT SIDEBAR PANEL */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0b101c] border-r border-white/10 flex flex-col transition-transform duration-300 transform lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between">
          <Link to="/creator" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              C
            </div>
            <div>
              <span className="font-black text-lg tracking-tighter text-white block leading-none">
                RASIGAN<span className="text-emerald-400">.</span>
              </span>
              <span className="text-[9px] text-emerald-400/80 font-mono font-bold tracking-widest uppercase">Creator Studio</span>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
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
                    item.path === '/creator'
                      ? location.pathname === '/creator' && !location.search
                      : location.pathname === '/creator' && location.search.includes(item.path.split('?')[1]);

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
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isPathActive ? 'text-emerald-400' : 'text-gray-400 group-hover:text-emerald-300'}`} />
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
                                ? location.pathname === '/creator' && location.search.includes(sub.path.split('?')[1])
                                : location.pathname === sub.path;

                            return (
                              <Link
                                key={subIdx}
                                to={sub.path}
                                onClick={() => setIsMobileOpen(false)}
                                className={`block px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                  isSubActive
                                    ? 'bg-emerald-500/20 text-white font-bold border border-emerald-400/30'
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black text-xs flex items-center justify-center border border-emerald-400/40 shadow-sm">
                CR
              </div>
              <div className="truncate">
                <span className="font-extrabold text-xs text-white block truncate">Welcome, Creator!</span>
                <span className="text-[10px] text-emerald-400 font-mono">Revenue Partner</span>
              </div>
            </div>

            <button
              onClick={handleSignOutCreator}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* 2. MAIN CONTENT CONTAINER */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-[#060A12]/90 border-b border-white/10 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white border border-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Grid className="w-4 h-4 text-emerald-400" />
              <span>{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">View Main App</span>
            </Link>

            <button
              onClick={handleSignOutCreator}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
