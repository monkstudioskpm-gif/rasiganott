import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { creatorApi, adminApi } from '../../lib/api';
import { CreatorEarningsSummaryDto, CreatorPayoutStatementDto } from '@rasigan/shared';
import { FileText, Loader2, BarChart3, X, Eye, TrendingUp, Users, Star, CreditCard } from 'lucide-react';

interface SupporterItem {
  id: string;
  supporterName: string;
  amountInr: number;
  date: string;
}

export function CreatorDashboardPage() {
  const [selectedAnalyticsData, setSelectedAnalyticsData] = useState<any | null>(null);

  const { data: summary, isLoading: isLoadingSummary } = useQuery<CreatorEarningsSummaryDto>({
    queryKey: ['creator-earnings'],
    queryFn: creatorApi.getEarnings,
  });

  const { data: payoutsData, isLoading: isLoadingPayouts } = useQuery<{ statements: CreatorPayoutStatementDto[] }>({
    queryKey: ['creator-payouts'],
    queryFn: creatorApi.getPayouts,
  });

  const { data: supportersData, isLoading: isLoadingSupporters } = useQuery<{ supporters: SupporterItem[] }>({
    queryKey: ['creator-supporters'],
    queryFn: creatorApi.getSupporters,
  });

  const openAnalytics = async (titleId: string) => {
    try {
      const res = await adminApi.getTitleAnalytics(titleId);
      if (res?.analytics) {
        setSelectedAnalyticsData(res.analytics);
      }
    } catch (err) {
      console.error('Failed to load title analytics:', err);
    }
  };

  if (isLoadingSummary || isLoadingPayouts || isLoadingSupporters) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-xs text-gray-400 font-semibold">Loading creator earnings dashboard...</p>
      </div>
    );
  }

  const statements = payoutsData?.statements || [];
  const supporters = supportersData?.supporters || [];

  return (
    <div className="space-y-8 pb-16 pt-4 max-w-7xl mx-auto px-4 text-gray-100">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Creator Analytics & Earnings Portal</h1>
        <p className="text-xs text-gray-400 mt-1">Track content performance, watch time, supporters, and payout status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 space-y-1 shadow-xl">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Earnings</span>
          <h2 className="text-3xl font-black text-white">₹{(summary?.earningsInr || 0).toLocaleString('en-IN')}</h2>
          <p className="text-[10px] text-gray-400 pt-1">Accumulated net earnings across all published titles</p>
        </div>

        <div className="p-6 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 space-y-1 shadow-xl">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pending Payout</span>
          <h2 className="text-3xl font-black text-white">₹{(summary?.pendingPayoutInr || 0).toLocaleString('en-IN')}</h2>
          <p className="text-[10px] text-gray-400 pt-1">Scheduled for next monthly bank transfer</p>
        </div>

        <div className="p-6 rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-slate-900 to-slate-950 space-y-1 shadow-xl">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Paid So Far</span>
          <h2 className="text-3xl font-black text-white">₹{(summary?.paidSoFarInr || 0).toLocaleString('en-IN')}</h2>
          <p className="text-[10px] text-gray-400 pt-1">Transferred directly to registered bank account</p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>Per-Title Studio Performance Analytics</span>
          </h3>
          <span className="text-xs text-gray-400 font-medium">Click analytics icon to view YouTube Studio breakdown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase font-mono text-[10px] tracking-wider font-bold">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Plays / Views</th>
                <th className="py-3 px-4">Watch Time</th>
                <th className="py-3 px-4">Supporters</th>
                <th className="py-3 px-4 text-right">Net Earnings</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!summary?.titles || summary.titles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    <p className="font-bold text-sm text-gray-300">No titles assigned to your studio yet</p>
                    <p className="text-xs text-gray-500 mt-1">When an administrator assigns catalog titles to your studio or email, your watch time, backer stats, and earnings will appear here.</p>
                  </td>
                </tr>
              ) : (
                summary.titles.map((t) => (
                  <tr key={t.titleId} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img src={t.posterUrl} alt={t.title} className="w-8 h-11 object-cover rounded-lg flex-none" />
                      <span className="font-extrabold text-white text-sm">{t.title}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-mono font-bold">{t.viewsCount.toLocaleString()} plays</td>
                    <td className="py-3 px-4 text-gray-300 font-mono font-bold">{t.watchTimeMinutes.toLocaleString()} mins</td>
                    <td className="py-3 px-4 text-gray-300 font-mono font-bold">{t.supportersCount} backers</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-400 text-sm">
                      ₹{t.earningsInr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openAnalytics(t.titleId)}
                        className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors"
                        title="View YouTube Studio Analytics & Payment Captures"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
        <h3 className="text-lg font-bold text-white tracking-tight">Payout Statements & Bank Reference UTR</h3>

        <div className="space-y-3">
          {statements.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-gray-400 text-xs">
              No payout statements generated yet for this period.
            </div>
          ) : (
            statements.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <h4 className="font-bold text-sm text-white">{s.cycle}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${s.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{s.period}</p>
                  {s.referenceUtr && <p className="text-[11px] font-mono text-purple-300 font-bold">Bank UTR Ref: {s.referenceUtr}</p>}
                </div>

                <div className="text-right space-y-0.5">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Net Payable</span>
                  <p className="text-xl font-black text-emerald-400">₹{s.netPayableInr.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
        <h3 className="text-lg font-bold text-white tracking-tight">Recent Supporters & Cheer Notes</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {supporters.length === 0 ? (
            <div className="col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-gray-400 text-xs">
              No supporters yet. When fans back your content, their cheer messages will appear here.
            </div>
          ) : (
            supporters.map((sup: any) => (
              <div key={sup.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-white">{sup.supporterName}</span>
                  <span className="text-[10px] text-gray-500">{new Date(sup.date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-amber-300 font-extrabold">Supported "{sup.title}"</p>
                {sup.message && <p className="text-xs text-gray-300 bg-white/5 p-2.5 rounded-xl border border-white/5 font-normal">"{sup.message}"</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Creator YouTube Studio Analytics Modal */}
      {selectedAnalyticsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-[#0B0F19] border border-purple-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedAnalyticsData(null)}
              className="absolute top-5 right-5 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-white/10 pb-6">
              <img
                src={selectedAnalyticsData.posterUrl}
                alt={selectedAnalyticsData.title}
                className="w-16 h-24 rounded-2xl object-cover border border-white/10 shadow-lg flex-shrink-0"
              />
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider">
                  <BarChart3 className="w-3 h-3" />
                  <span>Title Studio Performance</span>
                </div>
                <h2 className="text-2xl font-black text-white">{selectedAnalyticsData.title}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                  <span>Format: <strong className="text-purple-300">{selectedAnalyticsData.kind} ({selectedAnalyticsData.orientation})</strong></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-cyan-400 text-xs font-bold">
                  <span>Plays</span>
                  <Eye className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-white">{selectedAnalyticsData.totalViews.toLocaleString()}</div>
                <div className="text-[10px] text-gray-400">{selectedAnalyticsData.watchTimeHours} hrs watch time</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
                  <span>Support Raised</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-emerald-400">₹{selectedAnalyticsData.fundingRaised.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-gray-400">{selectedAnalyticsData.fundingPercent}% of ₹{selectedAnalyticsData.fundingGoal.toLocaleString('en-IN')}</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
                  <span>Supporters</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-white">{selectedAnalyticsData.supportersCount}</div>
                <div className="text-[10px] text-gray-400">Direct backers</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-pink-400 text-xs font-bold">
                  <span>Rating & Likes</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-xl font-black text-white">{selectedAnalyticsData.editorRating} ★</div>
                <div className="text-[10px] text-gray-400">{selectedAnalyticsData.likesCount} viewer likes</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-300">Crowdfunding Goal Progress</span>
                <span className="text-emerald-400">₹{selectedAnalyticsData.fundingRaised.toLocaleString('en-IN')} / ₹{selectedAnalyticsData.fundingGoal.toLocaleString('en-IN')} ({selectedAnalyticsData.fundingPercent}%)</span>
              </div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${selectedAnalyticsData.fundingPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Title Supporters & Payment Captures</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 uppercase text-[10px] font-mono">
                      <th className="py-2.5 px-3">Donor / Supporter</th>
                      <th className="py-2.5 px-3">Razorpay Payment ID</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedAnalyticsData.payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{p.donorName}</div>
                          {p.message && <div className="text-[10px] text-rose-300 italic mt-0.5">"{p.message}"</div>}
                        </td>

                        <td className="py-3 px-3 font-mono text-purple-300 text-xs">
                          {p.razorpayPaymentId}
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            {p.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[11px] text-gray-400 whitespace-nowrap">
                          {new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
