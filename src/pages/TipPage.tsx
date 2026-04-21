import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { CreditCard, Send, IndianRupee, MessageCircle, CheckCircle2, ShieldCheck, Globe, Zap } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { Streamer } from '../types';
import { cn } from '../lib/utils';

export default function TipPage() {
  const { username } = useParams();
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [platformName, setPlatformName] = useState('Boost');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'platform'), (snap) => {
      if (snap.exists()) setPlatformName(snap.data().platformName);
    });
    return unsub;
  }, []);

  const currencyMap: Record<string, string> = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  useEffect(() => {
    async function fetchStreamer() {
      const q = query(collection(db, 'streamers'), where('username', '==', username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Streamer;
        setStreamer(data);
        
        if (data.preferredCurrency && currencyMap[data.preferredCurrency]) {
          setCurrency(currencyMap[data.preferredCurrency]);
        }

        const activeGateways = (data.gateways || []).filter(g => g.config.enabled || (g.config.connected && g.config.enabled === undefined));
        if (activeGateways.length > 0) {
          setSelectedGateway(activeGateways[0].type);
        }
        
        // Load Razorpay Script if Razorpay is enabled and active
        if (activeGateways.some(g => g.type === 'razorpay')) {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          document.body.appendChild(script);
        }
      }
      setLoading(false);
    }
    fetchStreamer();
  }, [username]);

  const handleTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamer || !selectedGateway) return;

    setStatus('processing');

    if (selectedGateway === 'razorpay') {
      try {
        const response = await fetch('/api/payment/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamerId: streamer.id,
            amount: parseFloat(amount),
            currency: currency
          })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: streamer.displayName,
          description: `Tip for ${streamer.displayName}`,
          order_id: data.orderId,
          handler: async function (response: any) {
            // Verification logic would go here, for now we assume success if handler called
            try {
              await addDoc(collection(db, 'donations'), {
                streamerId: streamer.id,
                donorName: donorName || 'Anonymous',
                amount: parseFloat(amount),
                currency: currency,
                message: message,
                isTTSPlayed: false,
                gatewayUsed: 'razorpay',
                status: 'verified',
                razorpayId: response.razorpay_payment_id,
                createdAt: serverTimestamp(),
              });
              setStatus('success');
            } catch (err) {
              console.error(err);
              setStatus('idle');
            }
          },
          prefill: {
            name: donorName,
          },
          theme: {
            color: streamer.accentColor || '#ea580c',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setStatus('idle'); // Set idle so they can click again if they close it? No, maybe keep processing until closed.
      } catch (err: any) {
        console.error(err);
        toast.error(`Payment Initialization Failed: ${err.message}`);
        setStatus('idle');
      }
      return;
    }

    // Default/Legacy Mock logic for other gateways
    setTimeout(async () => {
      try {
        await addDoc(collection(db, 'donations'), {
          streamerId: streamer.id,
          donorName: donorName || 'Anonymous',
          amount: parseFloat(amount),
          currency: currency,
          message: message,
          isTTSPlayed: false,
          gatewayUsed: selectedGateway,
          status: selectedGateway === 'upi_direct' ? 'pending' : 'verified',
          createdAt: serverTimestamp(),
        });
        setStatus('success');
      } catch (err) {
        console.error(err);
        setStatus('idle');
      }
    }, 1500);
  };

  if (loading) return <div className="pt-40 text-center">Loading profile...</div>;
  if (!streamer) return <div className="pt-40 text-center">Streamer not found</div>;

  return (
    <main className="pt-24 pb-20 px-4">
      <div className="max-w-xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          style={{ borderColor: streamer.accentColor ? `${streamer.accentColor}33` : undefined }}
        >
          {/* Header */}
          <div className="h-32 bg-orange-600 relative" style={{ backgroundColor: streamer.accentColor || '#ea580c' }}>
             <div className="absolute -bottom-10 left-8 w-20 h-20 rounded-2xl bg-neutral-900 border-4 border-neutral-900 overflow-hidden shadow-xl">
                <img 
                  src={streamer.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${streamer.username}`} 
                  alt={streamer.displayName}
                  className="w-full h-full object-cover"
                />
             </div>
          </div>
          
          <div className="pt-14 px-8 pb-8">
            <h1 className="text-2xl font-bold tracking-tight">{streamer.displayName}</h1>
            <p className="text-neutral-400 text-sm mb-6 flex items-center gap-1">
              @{streamer.username}
              <div className="w-1 h-1 rounded-full bg-neutral-700 mx-1" />
              <span className="text-[10px] uppercase font-black text-orange-500 tracking-tighter italic">Verified Creator</span>
            </p>
            <p className="text-neutral-300 text-sm mb-8 leading-relaxed italic">
              "{streamer.bio || "Supporting the stream one tip at a time! 🚀"}"
            </p>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20 shadow-lg">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Tip Successfully Sent!</h2>
                  <p className="text-neutral-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">Thank you for supporting {streamer.displayName}. Your message will appear on stream shortly.</p>
                  <button 
                    onClick={() => { setStatus('idle'); setAmount(''); setMessage(''); }}
                    className="font-bold text-sm px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Send another contribution
                  </button>
                </motion.div>
              ) : (
                <form key="form" onSubmit={handleTip} className="space-y-6">
                  <div className="grid grid-cols-4 gap-2">
                    {['₹', '$', '€', '£'].map(c => (
                      <button 
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={cn(
                          "py-3 rounded-xl border font-bold transition-all text-sm",
                          currency === c ? "text-white" : "bg-neutral-950 border-white/5 text-neutral-500"
                        )}
                        style={currency === c ? { backgroundColor: streamer.accentColor || '#ea580c', borderColor: streamer.accentColor || '#ea580c' } : {}}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Amount</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">{currency}</div>
                      <input 
                        type="number"
                        required
                        min="1"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-orange-500 outline-none transition-colors text-xl font-bold"
                        style={{'--tw-ring-color': streamer.accentColor} as any}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Select Payment Method</label>
                    <div className="grid grid-cols-1 gap-3">
                      {streamer.gateways?.filter(g => g.config.enabled || (g.config.connected && g.config.enabled === undefined)).length > 0 ? (
                        streamer.gateways.filter(g => g.config.enabled || (g.config.connected && g.config.enabled === undefined)).map(g => (
                          <button
                            key={g.type}
                            type="button"
                            onClick={() => setSelectedGateway(g.type)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border transition-all",
                              selectedGateway === g.type ? "bg-orange-600/10" : "bg-neutral-950 border-white/5 shadow-inner"
                            )}
                            style={selectedGateway === g.type ? { borderColor: streamer.accentColor || '#ea580c' } : {}}
                          >
                             <div className="flex items-center gap-3">
                               {g.type === 'upi_direct' && <img src="https://www.vectorlogo.zone/logos/upi/upi-icon.svg" className="w-6" alt="" />}
                               {g.type === 'stripe' && <Globe size={18} className="text-blue-500" />}
                               {g.type === 'razorpay' && <CreditCard size={18} className="text-indigo-500" />}
                               <span className="font-bold text-sm capitalize">{g.type.replace('_', ' ')}</span>
                             </div>
                             {selectedGateway === g.type && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: streamer.accentColor || '#ea580c' }} />}
                          </button>
                        ))
                      ) : (
                        <div className="p-10 rounded-2xl bg-neutral-950 border border-white/5 text-center text-xs text-neutral-500 italic border-dashed border-2">
                          No payment methods configured by streamer.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Your Name</label>
                    <input 
                      type="text"
                      placeholder="Display Name"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-4 px-4 focus:border-orange-500 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Message</label>
                    <textarea 
                      placeholder="Your support message..."
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-4 px-4 focus:border-orange-500 outline-none transition-colors resize-none"
                    />
                  </div>

                  <button 
                    disabled={status === 'processing' || (streamer.gateways?.length || 0) === 0}
                    className={cn(
                      "w-full text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all",
                      (status === 'processing' || (streamer.gateways?.length || 0) === 0) ? "opacity-50 cursor-not-allowed bg-neutral-700" : "hover:scale-[1.02] shadow-xl"
                    )}
                    style={!(status === 'processing' || (streamer.gateways?.length || 0) === 0) ? { backgroundColor: streamer.accentColor || '#ea580c', shadowColor: streamer.accentColor } : {}}
                  >
                    {status === 'processing' ? "Processing Tip..." : <>Support Streamer <Send size={18} /></>}
                  </button>
                </form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Info */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-neutral-500 font-medium">
          <ShieldCheck size={14} />
          <span>Secured by {platformName}. 100% direct to creator.</span>
        </div>
      </div>
    </main>
  );
}
