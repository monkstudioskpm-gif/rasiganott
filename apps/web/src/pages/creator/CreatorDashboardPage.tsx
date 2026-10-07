import { useQuery } from '@tanstack/react-query';
import { creatorApi } from '../../lib/api';
import { CreatorEarningsSummaryDto, CreatorPayoutStatementDto } from '@rasigan/shared';
import { FileText, Loader2 } from 'lucide-react';

interface SupporterItem {
  id: string;
  supporterName: string;
  amountInr: number;
  date: string;
}

export function CreatorDashboardPage() {
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
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Creator Portal</h1>
        <p className="text-xs text-gray-400 mt-1">Track your performance and total earnings across published titles.</p>
      </div>

      {/* Top 3 Summary Cards (B1.1 - Pure "Earnings" terminology, 0% mentions) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent space-y-1">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Earnings</span>
          <h2 className="text-3xl font-black text-white">₹{(summary?.earningsInr || 0).toLocaleString('en-IN')}</h2>
          <p className="text-[10px] text-gray-400 pt-1">Accumulated earnings across titles</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent space-y-1">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending Payout</span>
          <h2 className="text-3xl font-black text-white">₹{(summary?.pendingPayoutInr || 0).toLocaleString('en-IN')}</h2>
          <p className="text-[10px] text-gray-400 pt-1">Scheduled for next payout cycle</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-transparent space-y-1">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Paid So Far</span>
          <h2 className="text-3xl font-black text-white">₹{(summary?.paidSoFarInr || 0).toLocaleString('en-IN')}</h2>
          <p className="text-[10px] text-gray-400 pt-1">Transferred directly to registered bank account</p>
        </div>
      </div>

      {/* Per-Title Performance Table */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Per-Title Earnings & Stats</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase font-mono text-[10px]">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Views</th>
                <th className="py-3 px-4">Watch Time</th>
                <th className="py-3 px-4">Supporters Count</th>
                <th className="py-3 px-4 text-right">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {summary?.titles.map((t) => (
                <tr key={t.titleId} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img src={t.posterUrl} alt={t.title} className="w-8 h-11 object-cover rounded-lg flex-none" />
                    <span className="font-bold text-white">{t.title}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">{t.viewsCount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-300 font-mono">{t.watchTimeMinutes.toLocaleString()} mins</td>
                  <td className="py-3 px-4 text-gray-300 font-mono">{t.supportersCount} supporters</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-400 text-sm">
                    ₹{t.earningsInr.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Statements Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Payout Statements</h3>

        <div className="space-y-3">
          {statements.map((s) => (
            <div key={s.id} className="p-4 rounded-2xl bg-dark-card border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <h4 className="font-bold text-sm text-white">{s.cycle}</h4>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${s.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{s.period}</p>
                {s.referenceUtr && <p className="text-[10px] font-mono text-gray-500">UTR: {s.referenceUtr}</p>}
              </div>

              <div className="text-right space-y-0.5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Net Payable</span>
                <p className="text-xl font-black text-white">₹{s.netPayableInr.toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supporter Messages (Amounts hidden per B1.2) */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Recent Supporters</h3>
        <p className="text-xs text-gray-400">View messages and wishes sent by your title supporters.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {supporters.map((sup: any) => (
            <div key={sup.id} className="p-4 rounded-2xl bg-dark-card border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{sup.supporterName}</span>
                <span className="text-[10px] text-gray-500">{new Date(sup.date).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-rose-300 italic font-medium">Supported "{sup.title}"</p>
              {sup.message && <p className="text-xs text-gray-300 bg-white/5 p-2.5 rounded-xl border border-white/5 font-normal">"{sup.message}"</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
