import React, { useState } from 'react';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { SystemSettings } from '../../types';
import { Save, Plus, X, Shield, Globe, Volume2, Mic } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  settings: SystemSettings;
}

export default function PlatformSettings({ settings }: Props) {
  const [formData, setFormData] = useState<Partial<SystemSettings>>({
    platformName: settings.platformName || 'Boost',
    logoUrl: settings.logoUrl || '',
    allowedAdmins: settings.allowedAdmins || [],
    commissionRate: settings.commissionRate || 0,
    maintenanceMode: settings.maintenanceMode || false,
    availableTTSVoices: settings.availableTTSVoices || ['Aditi', 'Raveena', 'Matthew', 'Joey']
  });
  const [newAdmin, setNewAdmin] = useState('');
  const [newVoice, setNewVoice] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'platform'), formData);
      toast.success("Platform settings updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update settings. Check console for details.");
    }
    setSaving(false);
  };

  const addAdmin = () => {
    if (!newAdmin || formData.allowedAdmins?.includes(newAdmin)) return;
    setFormData({
      ...formData,
      allowedAdmins: [...(formData.allowedAdmins || []), newAdmin]
    });
    setNewAdmin('');
  };

  const removeAdmin = (email: string) => {
    setFormData({
      ...formData,
      allowedAdmins: (formData.allowedAdmins || []).filter(e => e !== email)
    });
  };

  const addVoice = () => {
    if (!newVoice || formData.availableTTSVoices?.includes(newVoice)) return;
    setFormData({
      ...formData,
      availableTTSVoices: [...(formData.availableTTSVoices || []), newVoice]
    });
    setNewVoice('');
  };

  const removeVoice = (voice: string) => {
    setFormData({
      ...formData,
      availableTTSVoices: (formData.availableTTSVoices || []).filter(v => v !== voice)
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Platform Identity</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
              <input 
                value={formData.platformName}
                onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-orange-500 outline-none transition-all font-bold"
                placeholder="Boost"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Platform Logo URL</label>
            <input 
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-4 px-4 focus:border-orange-500 outline-none transition-all text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center justify-between">
                <span>Manage Administrators</span>
                <span className="text-orange-500">{formData.allowedAdmins?.length} Active</span>
             </label>
             <div className="flex gap-2">
                <input 
                  value={newAdmin}
                  onChange={(e) => setNewAdmin(e.target.value)}
                  placeholder="admin@example.com"
                  className="grow bg-neutral-950 border border-white/5 rounded-xl py-3 px-4 text-sm outline-none focus:border-orange-500"
                />
                <button onClick={addAdmin} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                  <Plus size={20} />
                </button>
             </div>
             <div className="flex flex-wrap gap-2">
                {formData.allowedAdmins?.map(email => (
                  <div key={email} className="bg-neutral-950 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold text-neutral-300">
                    {email}
                    <button onClick={() => removeAdmin(email)} className="text-neutral-600 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center justify-between">
                <span>Voice Inventory (AI TTS)</span>
                <span className="text-orange-500">{formData.availableTTSVoices?.length} Voices</span>
             </label>
             <div className="flex gap-2">
                <input 
                  value={newVoice}
                  onChange={(e) => setNewVoice(e.target.value)}
                  placeholder="Voice Name (e.g. Raveena)"
                  className="grow bg-neutral-950 border border-white/5 rounded-xl py-3 px-4 text-sm outline-none focus:border-orange-500"
                />
                <button onClick={addVoice} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                  <Plus size={20} />
                </button>
             </div>
             <div className="flex flex-wrap gap-2">
                {formData.availableTTSVoices?.map(voice => (
                  <div key={voice} className="bg-orange-600/10 border border-orange-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-black text-orange-400">
                    <Mic size={12} />
                    {voice}
                    <button onClick={() => removeVoice(voice)} className="text-orange-900 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full py-5 bg-orange-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50"
        >
          {saving ? 'Applying Changes...' : <><Save size={18} /> Push Platform Update</>}
        </button>
      </div>

      <div className="space-y-6">
         <div className="p-6 bg-neutral-950 border border-white/5 rounded-[2rem]">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
               <Shield className="text-orange-500" size={16} /> Root Administrator Notice
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed mb-4">
              Admins have full write access to all transaction logs, streamer configurations, and global secrets. Ensure only trusted stakeholders are added.
            </p>
            <div className="pt-4 border-t border-white/5 space-y-2">
               <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 italic">Environment Whitelist</p>
               <p className="text-[10px] text-neutral-500 leading-relaxed">
                 You can also authorize admins via environment variables in AI Studio. Use the key <code className="text-orange-500 font-mono">VITE_PLATFORM_ADMINS</code> with a comma-separated list of emails.
               </p>
            </div>
         </div>

         <div className="p-8 bg-orange-600/10 border border-orange-500/20 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-black italic text-lg shadow-lg">B</div>
               <div>
                  <p className="text-xs font-black uppercase tracking-widest text-orange-500">Live Preview</p>
                  <p className="text-lg font-bold">{formData.platformName}</p>
               </div>
            </div>
            <p className="text-xs text-neutral-400">
              The platform name and logo will update instantly for all users across their dashboards and tipping pages once pushed to production.
            </p>
         </div>
      </div>
    </div>
  );
}
