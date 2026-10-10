import { useState } from 'react';
import {
  X,
  Heart,
  IndianRupee,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Title } from '@rasigan/shared';
import { fundingApi } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: Title | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ title, isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen || !title) return null;

  const presetTiers = [
    { value: 50, label: 'Supporter', icon: '☕' },
    { value: 100, label: 'Fan Favorite', icon: '🍿', badge: 'Popular' },
    { value: 500, label: 'Patron', icon: '🎬' },
    { value: 1000, label: 'Producer', icon: '👑' },
  ];

  const supportedHistory = JSON.parse(localStorage.getItem('rasigan_supported') || '[]');
  const hasSupportedBefore = supportedHistory.some(
    (item: any) => item.titleId === title?.id || item.titleName === title?.title
  );

  const finalAmount = customAmount ? parseInt(customAmount, 10) || 0 : amount;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSupport = async () => {
    if (finalAmount < 10) {
      setErrorMessage('Minimum contribution amount is ₹10');
      return;
    }
    if (finalAmount > 50000) {
      setErrorMessage('Maximum contribution amount is ₹50,000');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      // 1. Ensure Razorpay SDK script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !(window as any).Razorpay) {
        throw new Error('Could not load Razorpay payment SDK. Please check your internet connection.');
      }

      // 2. Call server-side order creation API
      const order = await fundingApi.createOrder({
        titleId: title.id,
        amountInr: finalAmount,
        message: message.trim() || undefined,
        isAnonymous,
      });

      // 3. Launch Razorpay Checkout dialog
      const options = {
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency || 'INR',
        name: 'Rasigan OTT',
        description: `Support creator for ${title.title}`,
        image: title.posterUrl || undefined,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            setIsVerifying(true);
            const verifyRes = await fundingApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              titleId: title.id,
            });

            setReceiptId(response.razorpay_payment_id);

            // Record to local library state
            const existingSupported = JSON.parse(localStorage.getItem('rasigan_supported') || '[]');
            const newSupport = {
              id: verifyRes.fundingId || `sup_${Date.now()}`,
              titleId: title.id,
              titleName: title.title,
              posterUrl: title.posterUrl,
              creatorName: title.creatorName || 'Indie Creator',
              amountInr: finalAmount,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              paidAt: new Date().toISOString(),
            };
            localStorage.setItem('rasigan_supported', JSON.stringify([newSupport, ...existingSupported]));

            setIsSuccess(true);
          } catch (verifyErr: any) {
            console.error('Signature verification failed:', verifyErr);
            setErrorMessage(verifyErr?.message || 'Payment signature verification failed. Please try again.');
          } finally {
            setIsVerifying(false);
            setIsLoading(false);
          }
        },
        prefill: {
          name: isAnonymous ? 'Rasigan Supporter' : 'Rasigan Member',
          email: 'supporter@rasigan.com',
        },
        theme: {
          color: '#0284c7',
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on('payment.failed', (resp: any) => {
        console.warn('Payment failed:', resp.error);
        setErrorMessage(resp.error?.description || 'Payment was cancelled or failed. You can try again.');
        setIsLoading(false);
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error('Support order initiation error:', err);
      setErrorMessage(err?.message || 'Failed to initiate payment. Please try again.');
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setErrorMessage(null);
    setIsLoading(false);
    setIsVerifying(false);
    setReceiptId(null);
    onClose();
  };

  const handleGoToLibrary = () => {
    handleReset();
    navigate('/library');
  };

  const addCustomAmount = (delta: number) => {
    const current = parseInt(customAmount, 10) || 0;
    const next = current + delta;
    setCustomAmount(String(next));
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-[500px] my-auto bg-[#0d121f] border border-white/10 sm:border-sky-500/25 rounded-2xl sm:rounded-3xl shadow-2xl shadow-sky-950/50 text-gray-100 overflow-hidden">
        
        {/* Top Film Banner / Ambient Header */}
        <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-gradient-to-b from-sky-950/80 via-slate-900/90 to-[#0d121f]">
          {title.bannerUrl || title.posterUrl ? (
            <img
              src={title.bannerUrl || title.posterUrl}
              alt={title.title}
              className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-sm scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d121f] via-[#0d121f]/70 to-transparent" />

          {/* Close Button */}
          <button
            onClick={handleReset}
            disabled={isLoading || isVerifying}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 text-gray-300 hover:text-white rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md border border-white/10 transition-all disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Content with Creator & Film Title */}
          <div className="relative z-10 h-full flex items-end px-5 pb-3 gap-3.5">
            <div className="w-14 h-20 sm:w-16 sm:h-22 rounded-xl overflow-hidden border border-white/20 shadow-xl bg-slate-900 flex-shrink-0 -mb-2">
              <img
                src={title.posterUrl}
                alt={title.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 pb-1 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Heart className="w-3 h-3 fill-sky-400 text-sky-400" />
                <span>Creator Support</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white truncate tracking-tight">
                {title.title}
              </h2>
              <p className="text-xs text-gray-300 truncate">
                by <span className="text-sky-400 font-bold">{title.creatorName || 'Indie Creator'}</span>
              </p>
            </div>
          </div>
        </div>

        {!isSuccess ? (
          <div className="p-4 sm:p-6 pt-5 space-y-4 sm:space-y-5">
            {/* Loyalty / Re-support Alert */}
            {hasSupportedBefore && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold">
                  You previously supported this creator. Support them again!
                </span>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-medium leading-relaxed">{errorMessage}</p>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="text-[11px] text-rose-400 hover:underline font-bold"
                  >
                    Dismiss & Try again
                  </button>
                </div>
              </div>
            )}

            {/* Amount Preset Tiers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold uppercase tracking-wider text-gray-400 text-[10px] sm:text-[11px]">
                  Select Tier (INR)
                </label>
                <span className="text-[11px] text-sky-400 font-medium">
                  Direct support to creator & team
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presetTiers.map((tier) => {
                  const isSelected = finalAmount === tier.value && !customAmount;
                  return (
                    <button
                      key={tier.value}
                      type="button"
                      disabled={isLoading || isVerifying}
                      onClick={() => {
                        setAmount(tier.value);
                        setCustomAmount('');
                        setErrorMessage(null);
                      }}
                      className={`relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-b from-sky-500/25 to-sky-600/10 border-sky-400 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                          : 'bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      {tier.badge && (
                        <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-sky-500 text-[9px] font-black text-white uppercase tracking-wider shadow">
                          {tier.badge}
                        </span>
                      )}
                      <div className="text-base sm:text-lg mb-0.5">{tier.icon}</div>
                      <div className="text-sm sm:text-base font-black tracking-tight text-white">
                        ₹{tier.value}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium truncate">
                        {tier.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount Field */}
            <div className="space-y-2">
              <label className="block font-bold uppercase tracking-wider text-gray-400 text-[10px] sm:text-[11px]">
                Or Custom Amount
              </label>

              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400" />
                <input
                  type="number"
                  min="10"
                  max="50000"
                  disabled={isLoading || isVerifying}
                  placeholder="Enter amount between ₹10 and ₹50,000"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full pl-9 pr-24 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-sm font-semibold focus:outline-none focus:border-sky-400 transition-colors"
                />

                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => addCustomAmount(50)}
                    disabled={isLoading || isVerifying}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300 border border-white/10 transition-colors"
                  >
                    +₹50
                  </button>
                  <button
                    type="button"
                    onClick={() => addCustomAmount(100)}
                    disabled={isLoading || isVerifying}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300 border border-white/10 transition-colors"
                  >
                    +₹100
                  </button>
                </div>
              </div>
            </div>

            {/* Message to Creator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold uppercase tracking-wider text-gray-400 text-[10px] sm:text-[11px]">
                  Message to Creator (Optional)
                </label>
                <span className="text-[10px] text-gray-500 font-mono">
                  {message.length}/140
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={140}
                disabled={isLoading || isVerifying}
                placeholder="Write a message of appreciation to the creator..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-sky-400 transition-colors resize-none"
              />
            </div>

            {/* Anonymous Toggle Card */}
            <label className="flex items-start gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                disabled={isLoading || isVerifying}
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-0.5 rounded border-white/20 text-sky-500 focus:ring-sky-500 bg-white/5 w-4 h-4"
              />
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-sky-400" />
                  <span>Support Anonymously</span>
                </div>
                <div className="text-[11px] text-gray-400">
                  Keep your name private on creator supporter credits
                </div>
              </div>
            </label>

            {/* CTA Button */}
            <button
              onClick={handleSupport}
              disabled={isLoading || isVerifying || finalAmount < 10}
              className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base tracking-wide shadow-xl shadow-sky-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading || isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isVerifying ? 'Verifying payment...' : 'Connecting to Razorpay...'}</span>
                </>
              ) : (
                <>
                  <IndianRupee className="w-4 h-4" />
                  <span>Pay ₹{finalAmount.toLocaleString('en-IN')} via Razorpay</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {/* Security Badges */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 pt-1 border-t border-white/5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Razorpay Secured • UPI, Cards, NetBanking • Instant Creator Credit</span>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25 animate-bounce">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Contribution Verified</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Thank You for Supporting!
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-sm mx-auto">
                You successfully contributed{' '}
                <span className="text-emerald-400 font-extrabold text-base">
                  ₹{finalAmount.toLocaleString('en-IN')}
                </span>{' '}
                to <strong className="text-white">{title.creatorName || 'the creator'}</strong> for{' '}
                <span className="text-sky-400 font-bold">{title.title}</span>.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-gray-300 space-y-2 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Payment ID:</span>
                <span className="text-white font-mono font-bold">
                  {receiptId || `pay_${Date.now().toString(36)}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Title:</span>
                <span className="text-white font-semibold truncate max-w-[220px]">
                  {title.title}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PAID (Cryptographically Verified)
                </span>
              </div>
              <div className="pt-2 border-t border-white/5 text-[11px] text-gray-400">
                This film is now unlocked and highlighted under your{' '}
                <strong className="text-sky-400">Library → Supported</strong> tab.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGoToLibrary}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Library</span>
              </button>

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-lg shadow-sky-500/30 transition-all active:scale-95"
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
