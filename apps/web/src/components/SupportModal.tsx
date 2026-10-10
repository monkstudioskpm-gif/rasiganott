import { useState } from 'react';
import { X, Heart, IndianRupee, CheckCircle2, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { Title } from '@rasigan/shared';
import { fundingApi } from '../lib/api';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen || !title) return null;

  const presetTiers = [50, 100, 500, 1000];

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

      // 2. Call server-side order creation API (creates Razorpay order + PostgreSQL Funding row)
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
            // 4. Verify signature cryptographically on server
            const verifyRes = await fundingApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              titleId: title.id,
            });

            setReceiptId(response.razorpay_payment_id);

            // 5. Record to local library state for instant feedback
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 pb-24 sm:pb-3 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-[340px] max-h-[85vh] overflow-y-auto bg-[#0f111a] border border-sky-500/30 rounded-2xl p-4.5 space-y-3.5 shadow-2xl text-gray-100 no-scrollbar">
        {/* Close Button */}
        <button
          onClick={handleReset}
          disabled={isLoading || isVerifying}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
          aria-label="Close"
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

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-[11px] leading-tight font-medium">{errorMessage}</p>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="text-[10px] text-rose-400 hover:underline font-bold"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Amount Preset Tiers */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Select Amount (INR)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {presetTiers.map((tier) => (
                  <button
                    key={tier}
                    disabled={isLoading || isVerifying}
                    onClick={() => {
                      setAmount(tier);
                      setCustomAmount('');
                      setErrorMessage(null);
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
                  min="10"
                  max="50000"
                  disabled={isLoading || isVerifying}
                  placeholder="Enter amount (₹10 - ₹50,000)"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setErrorMessage(null);
                  }}
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
                disabled={isLoading || isVerifying}
                placeholder="Write a warm note to the creator (up to 140 chars)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-[11px] focus:outline-none focus:border-sky-500/60 resize-none"
              />
            </div>

            {/* Anonymous Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-gray-300 font-medium select-none">
              <input
                type="checkbox"
                disabled={isLoading || isVerifying}
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-white/20 text-sky-500 focus:ring-sky-500 bg-white/5 w-3.5 h-3.5"
              />
              <span>Support anonymously</span>
            </label>

            {/* Submit Button */}
            <button
              onClick={handleSupport}
              disabled={isLoading || isVerifying || finalAmount < 10}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs tracking-wide shadow-lg shadow-sky-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading || isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>{isVerifying ? 'Verifying payment...' : 'Connecting to Razorpay...'}</span>
                </>
              ) : (
                <>
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Pay ₹{finalAmount.toLocaleString('en-IN')} via Razorpay</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1 text-[9px] text-gray-400">
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              <span>Razorpay Secured • Server Side Signature Verification</span>
            </div>
          </>
        ) : (
          /* Success Screen */
          <div className="space-y-5 text-center py-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-white">Payment Successful!</h2>
              <p className="text-xs text-gray-300">
                You successfully supported <strong className="text-white">{title.creatorName || 'the creator'}</strong> with{' '}
                <span className="text-emerald-400 font-extrabold">₹{finalAmount.toLocaleString('en-IN')}</span>!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-gray-300 space-y-1.5 text-left">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400">Payment ID:</span>
                <span className="text-gray-100 font-mono font-bold">{receiptId || `pay_${Date.now().toString(36)}`}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400">Title:</span>
                <span className="text-gray-100 font-semibold truncate max-w-[180px]">{title.title}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400">Status:</span>
                <span className="text-emerald-400 font-bold">PAID (Verified)</span>
              </div>
              <div className="pt-1 border-t border-white/5 text-[10px] text-gray-400">
                Saved to your Profile under <strong className="text-sky-400">Library → Supported</strong>.
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-lg shadow-sky-500/30 transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
