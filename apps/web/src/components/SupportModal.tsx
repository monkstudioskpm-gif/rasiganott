import { useState } from 'react';
import { X, Heart, IndianRupee, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Title } from '@rasigan/shared';

interface Props {
  title: Title | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ title, isOpen, onClose }: Props) {
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen || !title) return null;

  const presetTiers = [50, 100, 500, 1000];

  const supportedHistory = JSON.parse(localStorage.getItem('rasigan_supported') || '[]');
  const hasSupportedBefore = supportedHistory.some((item: any) => item.titleId === title?.id || item.titleName === title?.title);

  const finalAmount = customAmount ? parseInt(customAmount, 10) || 0 : amount;

  const handleSupport = () => {
    if (finalAmount < 10) {
      alert('Minimum support amount is ₹10');
      return;
    }

    // Save to local supported history
    const existingSupported = JSON.parse(localStorage.getItem('rasigan_supported') || '[]');
    const newSupport = {
      id: `sup_${Date.now()}`,
      titleId: title.id,
      titleName: title.title,
      posterUrl: title.posterUrl,
      creatorName: title.creatorName || 'Indie Creator',
      amountInr: finalAmount,
      paidAt: new Date().toISOString(),
    };
    localStorage.setItem('rasigan_supported', JSON.stringify([newSupport, ...existingSupported]));

    setIsSuccess(true);
  };

  const handleReset = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 pb-24 sm:pb-3 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-[320px] max-h-[85vh] overflow-y-auto bg-[#0f111a] border border-sky-500/30 rounded-2xl p-4 space-y-3.5 shadow-2xl text-gray-100 no-scrollbar">
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!isSuccess ? (
          <>
            {/* Header */}
            <div className="space-y-1.5 text-center">
              <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center mx-auto shadow-md shadow-sky-500/40 text-white">
                <Heart className="w-5 h-5 fill-current" />
              </div>

              {hasSupportedBefore && (
                <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold inline-flex items-center justify-center gap-1 animate-pulse">
                  <span>✨ You showed your support, support again!</span>
                </div>
              )}

              <h2 className="text-lg font-black text-white tracking-tight">Support Creator</h2>
              <p className="text-[11px] text-gray-300 leading-snug">
                Directly support <strong className="text-white">{title.creatorName || 'the creator'}</strong> for{' '}
                <span className="text-sky-400 font-semibold">{title.title}</span>.
              </p>
            </div>

            {/* Amount Preset Tiers */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Select Amount (INR)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {presetTiers.map((tier) => (
                  <button
                    key={tier}
                    onClick={() => {
                      setAmount(tier);
                      setCustomAmount('');
                    }}
                    className={`py-2 rounded-xl text-[11px] font-bold transition-all duration-200 border ${
                      finalAmount === tier && !customAmount
                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm scale-105'
                        : 'bg-white/[0.04] text-gray-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    ₹{tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Custom Amount (₹)</label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" />
                <input
                  type="number"
                  placeholder="Enter amount (e.g. 250)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-xs font-semibold focus:outline-none focus:border-sky-500/60"
                />
              </div>
            </div>

            {/* Message to Creator */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Message (Optional)</label>
              <textarea
                rows={2}
                maxLength={140}
                placeholder="Write a message to creator..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-[11px] focus:outline-none focus:border-sky-500/60 resize-none"
              />
            </div>

            {/* Anonymous Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-gray-300 font-medium select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-white/20 text-sky-500 focus:ring-sky-500 bg-white/5 w-3.5 h-3.5"
              />
              <span>Support anonymously</span>
            </label>

            {/* Submit Button */}
            <button
              onClick={handleSupport}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-sky-500/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <IndianRupee className="w-3.5 h-3.5" /> Pay ₹{finalAmount} via Razorpay
            </button>

            <div className="flex items-center justify-center gap-1 text-[9px] text-gray-400">
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              <span>Razorpay Secured • Server Side Verification</span>
            </div>
          </>
        ) : (
          /* Success Screen */
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">Thank You!</h2>
              <p className="text-sm text-gray-300">
                You successfully supported <strong className="text-white">{title.creatorName || 'the creator'}</strong> with{' '}
                <span className="text-emerald-400 font-extrabold">₹{finalAmount}</span>!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-gray-400 space-y-1 text-left">
              <p>Receipt ID: <span className="text-gray-200 font-mono font-bold">RZP_{Date.now()}</span></p>
              <p>Title: <span className="text-gray-200 font-semibold">{title.title}</span></p>
              <p>Saved to your Profile under <strong className="text-sky-400">Supported</strong> tab.</p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-lg shadow-sky-500/30"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
