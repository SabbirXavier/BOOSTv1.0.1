import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { SubscriptionPlan, SystemSettings } from '../../types';
import { Plus, Trash2, Edit3, Save, X, Check, Search, IndianRupee, Clock, Mic, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  settings: SystemSettings | null;
}

export default function PlanManager({ settings }: Props) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'plans'), (snap) => {
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPlan)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSave = async (plan: Partial<SubscriptionPlan>) => {
    const id = plan.id || Math.random().toString(36).substr(2, 9);
    const planData = {
      ...plan,
      id
    };
    await setDoc(doc(db, 'plans', id), planData);
    setEditingPlan(null);
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      await deleteDoc(doc(db, 'plans', id));
    }
  };

  const toggleVoice = (voice: string) => {
    if (!editingPlan?.features) return;
    const current = editingPlan.features.ttsVoices || [];
    const updated = current.includes(voice) 
      ? current.filter(v => v !== voice)
      : [...current, voice];
    
    setEditingPlan({
      ...editingPlan,
      features: { ...editingPlan.features, ttsVoices: updated }
    });
  };

  const defaultPlan: Partial<SubscriptionPlan> = {
    name: '',
    price: 0,
    currency: '₹',
    trialDays: 7,
    features: {
      maxWidgets: 1,
      customThemes: false,
      advancedAnalytics: false,
      prioritySupport: false,
      ttsVoices: ['default'],
      handlingFee: 5
    }
  };

  if (loading) return <div className="p-20 text-center text-neutral-500 italic">Fetching platform tiers...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-xl font-bold tracking-tight">Subscription Tiers</h3>
           <p className="text-sm text-neutral-500">Define price points and unlocked features for your creators.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowComparison(!showComparison)}
            className="px-6 py-3 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            {showComparison ? 'Hide Comparison' : 'Feature Comparison'}
          </button>
          <button 
            onClick={() => { setIsCreating(true); setEditingPlan(defaultPlan); }}
            className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20"
          >
            <Plus size={18} /> New Plan
          </button>
        </div>
      </div>

      {showComparison && (
        <div className="bg-neutral-950 border border-white/5 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left">
             <thead>
                <tr className="border-b border-white/10">
                   <th className="p-6 text-[10px] font-black uppercase text-neutral-500">Feature</th>
                   {plans.map(p => (
                     <th key={p.id} className="p-6 text-sm font-bold text-center border-l border-white/5">{p.name}</th>
                   ))}
                </tr>
             </thead>
             <tbody className="text-sm">
                <tr className="border-b border-white/5">
                   <td className="p-6 text-neutral-400">Price</td>
                   {plans.map(p => <td key={p.id} className="p-6 text-center font-black border-l border-white/5">{p.currency}{p.price}</td>)}
                </tr>
                <tr className="border-b border-white/5">
                   <td className="p-6 text-neutral-400">Trial Period</td>
                   {plans.map(p => <td key={p.id} className="p-6 text-center font-bold border-l border-white/5">{p.trialDays} Days</td>)}
                </tr>
                <tr className="border-b border-white/5">
                   <td className="p-6 text-neutral-400">Max Widgets</td>
                   {plans.map(p => <td key={p.id} className="p-6 text-center border-l border-white/5">{p.features.maxWidgets}</td>)}
                </tr>
                <tr className="border-b border-white/5">
                   <td className="p-6 text-neutral-400">Platform Fee</td>
                   {plans.map(p => <td key={p.id} className="p-6 text-center border-l border-white/5">{p.features.handlingFee}%</td>)}
                </tr>
                <tr className="border-b border-white/5">
                   <td className="p-6 text-neutral-400">Custom Branding</td>
                   {plans.map(p => <td key={p.id} className="p-6 text-center border-l border-white/5 group">{p.features.customThemes ? <Check className="mx-auto text-emerald-500" size={18} /> : <X className="mx-auto text-neutral-700" size={18} />}</td>)}
                </tr>
                <tr className="border-b border-white/5">
                   <td className="p-6 text-neutral-400">TTS Voices</td>
                   {plans.map(p => <td key={p.id} className="p-6 text-center border-l border-white/5 font-mono text-xs text-orange-500">{p.features.ttsVoices.length} Enabled</td>)}
                </tr>
             </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="p-6 rounded-[2.5rem] bg-neutral-950 border border-white/5 relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button onClick={() => setEditingPlan(plan)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <Edit3 size={16} className="text-neutral-400" />
                </button>
                <button onClick={() => handleDelete(plan.id)} className="p-2 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors">
                  <Trash2 size={16} className="text-red-500" />
                </button>
             </div>

             <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Tier</span>
                  {plan.trialDays > 0 && (
                    <span className="bg-orange-600/10 text-orange-500 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Clock size={10} /> {plan.trialDays}D TRIAL
                    </span>
                  )}
                </div>
                <h4 className="text-2xl font-bold tracking-tighter">{plan.name}</h4>
                <p className="text-3xl font-black mt-2">{plan.currency}{plan.price}<span className="text-xs font-normal text-neutral-600 tracking-normal ml-1">/mo</span></p>
             </div>

             <div className="space-y-3 pt-6 border-t border-white/5">
                <FeatureItem label={`Max ${plan.features.maxWidgets} Widgets`} active={true} />
                <FeatureItem label="Custom Branding" active={plan.features.customThemes} />
                <FeatureItem label={`${plan.features.ttsVoices.length} Premium Voices`} active={plan.features.ttsVoices.length > 1} />
                <FeatureItem label="Platform Fee" value={`${plan.features.handlingFee}%`} active={true} />
                <FeatureItem label="Advanced Insights" active={plan.features.advancedAnalytics} />
             </div>
          </div>
        ))}
      </div>

      {(editingPlan || isCreating) && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-y-auto max-h-[90vh] no-scrollbar">
             <button onClick={() => { setEditingPlan(null); setIsCreating(false); }} className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
             </button>

             <h2 className="text-3xl font-bold mb-8 tracking-tight">{isCreating ? 'Forge New Tier' : 'Edit Subscription Tier'}</h2>
             
             <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Plan Name</label>
                  <input 
                    value={editingPlan?.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-3 px-4 font-bold outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Trial (Days)</label>
                  <input 
                    type="number"
                    value={editingPlan?.trialDays}
                    onChange={(e) => setEditingPlan({ ...editingPlan, trialDays: parseInt(e.target.value) })}
                    className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-3 px-4 font-bold outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Price</label>
                  <input 
                    type="number"
                    value={editingPlan?.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                    className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-3 px-4 font-bold outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Currency</label>
                  <input 
                    value={editingPlan?.currency}
                    onChange={(e) => setEditingPlan({ ...editingPlan, currency: e.target.value })}
                    className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-3 px-4 font-bold outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Handling Fee (%)</label>
                  <input 
                    type="number"
                    value={editingPlan?.features?.handlingFee}
                    onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan!.features!, handlingFee: parseFloat(e.target.value) }})}
                    className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-3 px-4 font-bold outline-none focus:border-orange-500"
                  />
                </div>
             </div>

             <div className="mb-8">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-4 block">Enabled TTS Voices</label>
                <div className="flex flex-wrap gap-2">
                   {settings?.availableTTSVoices?.map(voice => (
                     <button 
                        key={voice}
                        onClick={() => toggleVoice(voice)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2",
                          editingPlan?.features?.ttsVoices?.includes(voice) 
                            ? "bg-orange-600 border-orange-500 text-white" 
                            : "bg-neutral-950 border-white/5 text-neutral-500 hover:border-white/20"
                        )}
                     >
                       <Mic size={14} /> {voice}
                     </button>
                   ))}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-10">
                <ToggleFeature 
                   label="Custom Themes" 
                   active={editingPlan?.features?.customThemes || false} 
                   onChange={(val) => setEditingPlan({ ...editingPlan, features: { ...editingPlan!.features!, customThemes: val }})} 
                />
                <ToggleFeature 
                   label="Advanced Analytics" 
                   active={editingPlan?.features?.advancedAnalytics || false} 
                   onChange={(val) => setEditingPlan({ ...editingPlan, features: { ...editingPlan!.features!, advancedAnalytics: val }})} 
                />
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Max Active Widgets</label>
                  <input 
                    type="number"
                    value={editingPlan?.features?.maxWidgets}
                    onChange={(e) => setEditingPlan({ ...editingPlan, features: { ...editingPlan!.features!, maxWidgets: parseInt(e.target.value) }})}
                    className="w-full bg-neutral-950 border border-white/5 rounded-xl py-2 px-4 text-sm font-bold outline-none"
                  />
                </div>
             </div>

             <button 
               onClick={() => handleSave(editingPlan!)}
               className="w-full py-5 bg-orange-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20"
             >
               <Save size={18} /> Deploy Plan Configuration
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureItem({ label, value, active }: any) {
  return (
    <div className={cn("flex items-center justify-between text-xs font-medium", active ? "text-neutral-300" : "text-neutral-600 opacity-50")}>
       <span className="flex items-center gap-2">
          {active ? <Check size={14} className="text-emerald-500" /> : <X size={14} />}
          {label}
       </span>
       {value && <span className="text-white font-bold">{value}</span>}
    </div>
  );
}

function ToggleFeature({ label, active, onChange }: any) {
  return (
    <button 
      onClick={() => onChange(!active)}
      className="flex items-center justify-between text-xs font-bold p-3 rounded-xl bg-neutral-950 border border-white/5 hover:border-white/10 transition-all"
    >
      <span>{label}</span>
      <div className={cn("w-10 h-5 rounded-full relative transition-all", active ? "bg-orange-600" : "bg-neutral-800")}>
         <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", active ? "right-1" : "left-1")} />
      </div>
    </button>
  );
}
