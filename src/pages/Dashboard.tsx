import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  Plus, Settings, Copy, ExternalLink, 
  IndianRupee, Activity, Users, Wallet,
  CheckCircle2, AlertCircle, Volume2, ShieldCheck,
  CreditCard, Layout, History, BarChart3, Globe,
  Palette, Play, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { 
  collection, query, where, getDocs, 
  doc, setDoc, onSnapshot, orderBy, limit,
  serverTimestamp, updateDoc, addDoc
} from 'firebase/firestore';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithCustomToken } from 'firebase/auth';
import { Streamer, Donation, Widget, PaymentGateway, SystemSettings, SubscriptionPlan } from '../types';
import { cn } from '../lib/utils';
import GatewayManager from '../components/dashboard/GatewayManager';
import WidgetCustomizer from '../components/dashboard/WidgetCustomizer';
import HistoryLog from '../components/dashboard/HistoryLog';
import BrandingManager from '../components/dashboard/BrandingManager';
import PlatformSettingsComponent from '../components/dashboard/PlatformSettings';
import PlanManager from '../components/dashboard/PlanManager';
import SetupGuide from '../components/dashboard/SetupGuide';
import PaymentGuide from '../components/dashboard/PaymentGuide';

type Tab = 'overview' | 'widgets' | 'payments' | 'history' | 'admin' | 'branding' | 'platform' | 'plans' | 'setup';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [allStreamers, setAllStreamers] = useState<Streamer[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Global Platform Settings Listener
    const settingsRef = doc(db, 'settings', 'platform');
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
       if (snap.exists()) {
         setSystemSettings({ id: snap.id, ...snap.data() } as SystemSettings);
       } else {
         // Initialize default settings with current user as admin
         const defaultAdmins = ['nemesis.developers.org@gmail.com', 'dcpromoidse@gmail.com'];
         setDoc(settingsRef, {
           platformName: 'StreamVibe',
           logoUrl: '',
           allowedAdmins: defaultAdmins,
           commissionRate: 0,
           maintenanceMode: false,
           availableTTSVoices: ['Aditi', 'Raveena', 'Matthew', 'Joey', 'Zephyr']
         });
       }
    }, (err) => console.error("Platform Settings Snapshot Error:", err));

    const unsubPlans = onSnapshot(collection(db, 'plans'), (snap) => {
      if (snap.empty) {
        // Initialize default plans
        const defaultPlans = [
          {
            name: 'Standard',
            price: 0,
            currency: '₹',
            trialDays: 14,
            features: {
              maxWidgets: 2,
              customThemes: false,
              advancedAnalytics: false,
              prioritySupport: false,
              ttsVoices: ['Aditi', 'Matthew'],
              handlingFee: 0
            }
          },
          {
            name: 'Pro Streamer',
            price: 499,
            currency: '₹',
            trialDays: 0,
            features: {
              maxWidgets: 10,
              customThemes: true,
              advancedAnalytics: true,
              prioritySupport: true,
              ttsVoices: ['Aditi', 'Raveena', 'Matthew', 'Joey', 'Zephyr'],
              handlingFee: 0
            }
          }
        ];
        defaultPlans.forEach(plan => {
          addDoc(collection(db, 'plans'), plan);
        });
      } else {
        setAvailablePlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPlan)));
      }
    }, (err) => console.error("Plans Snapshot Error:", err));

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const streamRef = doc(db, 'streamers', u.uid);
        onSnapshot(streamRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = { id: snapshot.id, ...snapshot.data() } as Streamer;
            setStreamer(data);
            
            const envAdmins = (import.meta.env.VITE_PLATFORM_ADMINS || '').split(',').map((e: string) => e.trim());
            const isSystemAdmin = u.email === 'dcpromoidse@gmail.com' || 
                                 systemSettings?.allowedAdmins.includes(u.email || '') ||
                                 envAdmins.includes(u.email || '');
            
            if (isSystemAdmin) {
              getDocs(collection(db, 'streamers')).then(snap => {
                setAllStreamers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Streamer)));
              }).catch(err => console.error("Admin Streamers Fetch Error:", err));
            }
          }
        }, (err) => console.error("Streamer Private Snapshot Error:", err));

        const wq = query(collection(db, 'widgets'), where('streamerId', '==', u.uid));
        onSnapshot(wq, (snap) => {
          setWidgets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Widget)));
        }, (err) => console.error("Widgets Snapshot Error:", err));

        const dq = query(
          collection(db, 'donations'), 
          where('streamerId', '==', u.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        onSnapshot(dq, (snap) => {
          setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
        }, (err) => console.error("Donations Snapshot Error:", err));
      }
      setLoading(false);
    });

    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.provider === 'twitch') {
        const { token, user: twitchUser } = event.data;
        if (token) {
          try {
            await signInWithCustomToken(auth, token);
          } catch (err) {
            console.error("Twitch Sign-in Error:", err);
          }
        } else {
          // If no admin token, at least we have the twitch info
          console.log("Twitch User Data (Manual Link Required):", twitchUser);
          toast.info("Twitch account identified. Please sign in with Google to link it, or contact admin to enable Twitch login.");
        }
      }
    };
    window.addEventListener('message', handleOAuthMessage);

    return () => {
      unsubSettings();
      unsubPlans();
      unsubAuth();
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [systemSettings?.allowedAdmins]);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Auth Fail:", err);
      if (err.code === 'auth/unauthorized-domain') {
        toast.error(`CONFIGURATION REQUIRED: The domain "${window.location.host}" is not authorized in the Firebase Console. \n\nGo to Authentication > Settings > Authorized Domains and add it.`);
      } else {
        toast.error(`Sign-in failed: ${err.message}`);
      }
    }
  };

  const handleTwitchSignIn = async () => {
    try {
      const response = await fetch('/api/auth/twitch/url');
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      
      window.open(url, 'twitch_auth', 'width=600,height=700');
    } catch (err: any) {
      toast.error(`Twitch connection failed: ${err.message}`);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const freePlan = availablePlans.find(p => p.price === 0) || availablePlans[0];
    const trialDays = freePlan?.trialDays || 0;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const envAdmins = (import.meta.env.VITE_PLATFORM_ADMINS || '').split(',').map((e: string) => e.trim());
    const isSystemAdmin = user.email === 'dcpromoidse@gmail.com' || 
                         systemSettings?.allowedAdmins.includes(user.email) ||
                         envAdmins.includes(user.email);

    const streamData = {
      displayName,
      username: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
      role: isSystemAdmin ? 'admin' : 'streamer',
      subscriptionActive: true,
      planId: freePlan?.id || 'standard',
      isTrial: trialDays > 0,
      trialEndsAt: trialDays > 0 ? trialEndsAt : null,
      obsToken: `bst_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      createdAt: serverTimestamp(),
      gateways: []
    };

    await setDoc(doc(db, 'streamers', user.uid), streamData);

    // Default widgets
    await addDoc(collection(db, 'widgets'), {
      streamerId: user.uid,
      type: 'alert',
      config: { minAmount: 1, ttsEnabled: true, primaryColor: '#ea580c', animationType: 'fade-up' }
    });
    await addDoc(collection(db, 'widgets'), {
      streamerId: user.uid,
      type: 'goal',
      config: { minAmount: 1, primaryColor: '#3b82f6', goalAmount: 10000, goalTitle: 'Streaming Setup' }
    });
  };

  const updateGateways = async (type: string, config: any) => {
    if (!streamer) return;
    
    // Split config into public and secret
    const publicConfig: any = {};
    const secretConfig: any = {};
    
    // Identify secrets based on common naming or specific keys
    const secretKeys = ['stripeSecretKey', 'razorpayKeySecret'];
    
    Object.keys(config).forEach(key => {
      if (secretKeys.includes(key)) {
        secretConfig[key] = config[key];
      } else {
        publicConfig[key] = config[key];
      }
    });

    const existingGateways = streamer.gateways || [];
    const filtered = existingGateways.filter(g => g.type !== type);
    const updatedGateways = [...filtered, { type, config: publicConfig }] as PaymentGateway[];
    
    const existingSecrets = streamer.secrets || {};
    const updatedSecrets = { ...existingSecrets, ...secretConfig };

    await updateDoc(doc(db, 'streamers', streamer.id), { 
      gateways: updatedGateways,
      secrets: updatedSecrets
    });
  };

  const handleToggleSubscription = async (sid: string, active: boolean) => {
    await updateDoc(doc(db, 'streamers', sid), { subscriptionActive: !active });
    // Refresh admin view
    const snap = await getDocs(collection(db, 'streamers'));
    setAllStreamers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Streamer)));
  };

  const handleAddWidget = async (type: 'alert' | 'goal' | 'ticker') => {
    if (!streamer || !user) return;
    
    await addDoc(collection(db, 'widgets'), {
      streamerId: user.uid,
      type,
      config: type === 'ticker' ? { minAmount: 1, primaryColor: '#ef4444', tickerSpeed: 'normal', showText: true } : 
             type === 'goal' ? { minAmount: 1, primaryColor: '#3b82f6', goalAmount: 5000, goalTitle: 'New Goal' } :
             { minAmount: 1, ttsEnabled: true, primaryColor: '#ea580c', animationType: 'fade-up' }
    });
  };

  if (loading) return <div className="pt-40 text-center text-neutral-500 italic">Authenticating {systemSettings?.platformName || 'Boost'} session...</div>;
  if (!user) {
    return (
      <main className="pt-40 px-4 text-center">
        <div className="max-w-md mx-auto p-12 rounded-[2.5rem] bg-neutral-900 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-600" />
          <div className="w-20 h-20 bg-orange-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-orange-500">
            <Wallet size={40} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Creator Login</h1>
          <div className="space-y-4 mb-10">
            <button 
              onClick={handleSignIn}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-neutral-200 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl"
            >
              <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" className="w-5" alt="" />
              Continue with Google
            </button>
            <button 
              onClick={handleTwitchSignIn}
              className="w-full bg-[#9146FF] text-white py-4 rounded-2xl font-bold hover:bg-[#a970ff] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl"
            >
              <Play size={20} fill="currentColor" />
              Sign in with Twitch
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!streamer) {
    return (
      <main className="pt-32 px-4 max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Claim your handle</h1>
          <p className="text-neutral-500">Kickstart your zero-commission journey.</p>
        </div>
        <form onSubmit={handleSetup} className="space-y-8 bg-neutral-900/50 p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Pick a username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-600 text-sm">boost.live/t/</span>
                <input 
                  required
                  placeholder="kamalfps"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-4 pl-[8.5rem] pr-4 focus:border-orange-500 outline-none transition-colors font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Display Name</label>
              <input 
                required
                placeholder="Kamal FPS"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-4 px-4 focus:border-orange-500 outline-none transition-colors font-bold"
              />
            </div>
          </div>
          <button className="w-full bg-orange-600 text-white py-5 rounded-[1.5rem] font-bold text-lg hover:bg-orange-500 transition-all shadow-[0_0_30px_rgba(234,88,12,0.3)] active:scale-95">
            Create Profile
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="pt-24 px-4 max-w-7xl mx-auto pb-20">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold mb-1 tracking-tight">{systemSettings?.platformName || 'Boost'} <span className="text-orange-500">Console</span></h1>
          <p className="text-neutral-500 text-sm font-medium">Logged in as {streamer.displayName} (@{streamer.username})</p>
        </div>
        <div className="flex gap-4">
           <a 
            href={`/t/${streamer.username}`} 
            target="_blank" 
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold shadow-lg"
           >
             <ExternalLink size={16} /> My Tipping Page
           </a>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1 bg-white/5 p-1.5 rounded-2xl w-fit mb-10 overflow-x-auto no-scrollbar border border-white/5">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={16} />} label="Overview" />
        <TabButton active={activeTab === 'widgets'} onClick={() => setActiveTab('widgets')} icon={<Layout size={16} />} label="Overlays" />
        <TabButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={<Palette size={16} />} label="Branding" />
        <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={<CreditCard size={16} />} label="Gateways" />
        <TabButton active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} icon={<Play size={16} />} label="OBS Connection" />
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={16} />} label="Log" />
        {streamer.role === 'admin' && (
          <>
            <TabButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Settings size={16} />} label="Streamers" />
            <TabButton active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} icon={<Zap size={16} />} label="Plans" />
            <TabButton active={activeTab === 'platform'} onClick={() => setActiveTab('platform')} icon={<Globe size={16} />} label="Config" />
          </>
        )}
      </div>

      {(['admin', 'plans', 'platform'].includes(activeTab)) && streamer.role !== 'admin' && (
         <div className="py-40 text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
               <ShieldCheck size={40} />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Access Restricted</h2>
            <p className="text-neutral-500 max-w-sm mx-auto">This module is reserved for Platform Administrators. Please contact the site owner for permissions.</p>
            <button onClick={() => setActiveTab('overview')} className="px-8 py-3 bg-white text-black rounded-xl font-bold">Back to Overview</button>
         </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard title="Earnings" value="₹24,800" icon={<IndianRupee className="text-green-500" />} change="+12%" />
              <StatCard title="Total Tips" value="102" icon={<Users className="text-blue-500" />} change="+5%" />
              <StatCard title="Global Reach" value="International" badge="GLOBAL" icon={<Globe className="text-blue-400" />} />
              <StatCard 
                title="Active Plan" 
                value={availablePlans.find(p => p.id === streamer.planId)?.name || 'Default Tier'} 
                badge={streamer.isTrial ? "TRIAL" : "ACTIVE"} 
                icon={<Zap className={cn(streamer.isTrial ? "text-orange-400" : "text-orange-500")} />} 
                change={streamer.isTrial ? `${Math.ceil((streamer.trialEndsAt?.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left` : undefined}
              />
            </div>

            <div className="bg-neutral-900/50 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-8 flex items-center justify-between">
                Recent Contributions
                <button className="text-sm font-medium text-orange-500 hover:underline px-4 py-2 hover:bg-orange-500/10 rounded-xl transition-colors">View All</button>
              </h2>
              <div className="space-y-4">
                {donations.length === 0 && <div className="text-center py-20 text-neutral-600 italic">No donations received at this moment.</div>}
                {donations.map(donation => (
                  <div key={donation.id} className="flex items-center justify-between p-5 rounded-2xl bg-neutral-950/50 border border-white/5 hover:border-white/10 transition-all hover:bg-neutral-950">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-600/10 text-orange-500 flex items-center justify-center font-bold text-xl uppercase italic border border-orange-500/20">
                        {donation.donorName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          {donation.donorName} 
                          <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-neutral-500 uppercase tracking-tighter">
                            {donation.gatewayUsed}
                          </span>
                        </p>
                        <p className="text-sm text-neutral-400 mt-1 italic line-clamp-1">"{donation.message}"</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl">{donation.currency || '$'} {donation.amount}</p>
                      <p className="text-[10px] text-neutral-600 uppercase font-bold tracking-widest mt-1">
                        {donation.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'widgets' && (
          <motion.div key="widgets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
             <div className="bg-orange-600/5 border border-orange-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-xl">
               <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center shrink-0 border-4 border-orange-600/20 shadow-lg rotate-3">
                  <Play size={40} className="text-white ml-2" />
               </div>
               <div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">How to Setup OBS / Streamlabs</h2>
                 <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
                   {systemSettings?.platformName || 'Boost'} works as a <span className="text-white font-bold italic">Browser Source</span>. Perfect for OBS, Streamlabs, and vMix. No plugin download required. 
                 </p>
                 <ol className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    <li className="bg-neutral-950/50 p-3 rounded-xl border border-white/5 font-mono">1. Copy widget URL</li>
                    <li className="bg-neutral-950/50 p-3 rounded-xl border border-white/5 font-mono">2. Add "Browser Source"</li>
                    <li className="bg-neutral-950/50 p-3 rounded-xl border border-white/5 font-mono">3. Set 800x600 resolution</li>
                 </ol>
               </div>
             </div>

             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Active Overlays</h2>
                <div className="flex gap-2">
                   <button onClick={() => handleAddWidget('alert')} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-500 transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20">
                      <Plus size={14} /> Alert Box
                   </button>
                   <button onClick={() => handleAddWidget('goal')} className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2 border border-white/10">
                      <Plus size={14} /> Donation Goal
                   </button>
                   <button onClick={() => handleAddWidget('ticker')} className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2 border border-white/10">
                      <Plus size={14} /> Event Ticker
                   </button>
                </div>
             </div>

             {widgets.map(w => (
               <div key={w.id} className="bg-neutral-900/50 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm shadow-xl">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                      <div className="w-2 h-8 bg-orange-600 rounded-full" />
                      {w.type} WIDGET
                    </h3>
                    <div className="flex items-center gap-3 bg-neutral-950 px-4 py-3 rounded-2xl border border-white/5">
                       <span className="text-[11px] font-mono text-neutral-500 truncate max-w-[200px]">.../overlay/{w.id}</span>
                       <button 
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/overlay/${w.id}`); toast.success("Link copied to OBS source!"); }}
                        className="p-2 rounded-lg bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-white transition-all active:scale-95 border border-orange-500/20"
                        title="Copy Overlay URL"
                       >
                         <Copy size={16} />
                       </button>
                       <Link to={`/overlay/${w.id}`} target="_blank" className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                         <ExternalLink size={16} />
                       </Link>
                    </div>
                  </div>
                  <WidgetCustomizer widget={w} />
               </div>
             ))}

             {/* Real Test Trigger */}
             <div className="bg-neutral-900/50 border border-white/10 rounded-[2.5rem] p-8 text-center space-y-6">
                <div>
                   <h2 className="text-xl font-bold mb-2 tracking-tight">End-to-End Test</h2>
                   <p className="text-sm text-neutral-500 max-w-md mx-auto">Trigger a real database record to test your OBS Browser Source and AI Voice integration.</p>
                </div>
                <button 
                  onClick={async () => {
                    if (!streamer) return;
                    try {
                      await addDoc(collection(db, 'donations'), {
                        streamerId: streamer.id,
                        donorName: 'Test Supporter',
                        amount: 69,
                        currency: '₹',
                        message: 'This is a test tip to verify your full stream setup! AI voice should play now.',
                        isTTSPlayed: false,
                        gatewayUsed: 'test_trigger',
                        status: 'verified',
                        createdAt: serverTimestamp(),
                      });
                      toast.success("Test tip triggered! Check your OBS or Overlay page.");
                    } catch (err) {
                      console.error(err);
                      toast.error("Failed to trigger test tip. Check permissions.");
                    }
                  }}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex items-center gap-2 mx-auto"
                >
                  <Zap size={18} fill="currentColor" /> Trigger Live Test Alert
                </button>
             </div>
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <div className="bg-neutral-900/50 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm shadow-xl">
                <div className="mb-10 text-center md:text-left">
                   <h2 className="text-3xl font-bold mb-2 tracking-tight">Financial Hub</h2>
                   <p className="text-neutral-500 max-w-xl">Integration your specific payment gateways. Go international with Stripe or stay local with UPI Direct.</p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                   <GatewayManager gateways={streamer.gateways || []} onConnect={updateGateways} />
                   <PaymentGuide />
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <SetupGuide streamer={streamer} widgets={widgets} />
          </motion.div>
        )}

        {activeTab === 'admin' && streamer.role === 'admin' && (
          <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <div className="bg-neutral-900/50 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm shadow-xl">
                <div className="mb-10">
                   <h2 className="text-3xl font-bold mb-2 tracking-tight">Platform Admin</h2>
                   <p className="text-neutral-500">Manage all streamers and system-wide settings.</p>
                </div>
                
                <div className="space-y-4">
                  {allStreamers.map(s => (
                    <div key={s.id} className="p-6 rounded-2xl bg-neutral-950 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold">
                          {s.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold">{s.displayName} (@{s.username})</p>
                          <p className="text-xs text-neutral-500">Role: {s.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold hover:bg-white/10 uppercase tracking-tighter">View Page</button>
                        <button 
                          onClick={() => handleToggleSubscription(s.id, s.subscriptionActive)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-tighter",
                            s.subscriptionActive ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          )}
                        >
                          {s.subscriptionActive ? 'Suspend Account' : 'Reactivate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'branding' && (
          <motion.div key="branding" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <div className="bg-neutral-900/50 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm shadow-xl">
                <div className="mb-10 text-center md:text-left">
                   <h2 className="text-3xl font-bold mb-2 tracking-tight">Profile & Branding</h2>
                   <p className="text-neutral-500 max-w-xl">Customize your tipping page to match your stream aesthetic.</p>
                </div>
                <BrandingManager streamer={streamer} />
             </div>
          </motion.div>
        )}

        {activeTab === 'platform' && streamer.role === 'admin' && systemSettings && (
          <motion.div key="platform" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <div className="bg-neutral-900/50 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm shadow-xl">
                <div className="mb-10 text-center md:text-left">
                   <h2 className="text-3xl font-bold mb-2 tracking-tight">Platform Configuration</h2>
                   <p className="text-neutral-500">Manage global branding, administrators, and system-wide settings.</p>
                </div>
                <PlatformSettingsComponent settings={systemSettings} />
             </div>
          </motion.div>
        )}

        {activeTab === 'plans' && streamer.role === 'admin' && (
          <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <div className="bg-neutral-900/50 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm shadow-xl">
                <div className="mb-10">
                   <h2 className="text-3xl font-bold mb-1 tracking-tight">Plan Monetization</h2>
                   <p className="text-neutral-500">Configure feature gates and pricing for different creator tiers.</p>
                </div>
                <PlanManager settings={systemSettings} />
             </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <div className="bg-neutral-900/50 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm shadow-xl">
                <div className="mb-10 flex items-center justify-between">
                   <div>
                     <h2 className="text-3xl font-bold mb-1 tracking-tight">Contribution Log</h2>
                     <p className="text-neutral-500">Real-time ledger of all tips received through StreamVibe.</p>
                   </div>
                </div>
                <HistoryLog donations={donations} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap",
        active ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-neutral-500 hover:text-neutral-100 hover:bg-white/5"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ title, value, icon, badge, change }: any) {
  return (
    <div className="bg-neutral-900/50 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group backdrop-blur-sm shadow-xl">
      {badge && <span className="absolute top-4 right-4 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded italic shadow-lg shadow-orange-600/20">{badge}</span>}
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">{title}</p>
          {change && <span className="text-[10px] font-bold text-green-500">{change}</span>}
        </div>
        <p className="text-3xl font-bold tracking-tighter">{value}</p>
      </div>
    </div>
  );
}
