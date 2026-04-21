import React, { useState } from 'react';
import { Streamer } from '../../types';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Palette, User, Image as ImageIcon, Save, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  streamer: Streamer;
}

export default function BrandingManager({ streamer }: Props) {
  const [formData, setFormData] = useState({
    displayName: streamer.displayName || '',
    bio: streamer.bio || '',
    accentColor: streamer.accentColor || '#ea580c',
    profileImage: streamer.profileImage || '',
    coverImage: streamer.coverImage || '',
    preferredCurrency: streamer.preferredCurrency || 'INR'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateDoc(doc(db, 'streamers', streamer.id), formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Settings Form */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Public Display Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
              <input 
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-orange-500 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">About / Bio</label>
            <textarea 
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell your viewers why you stream..."
              className="w-full bg-neutral-950 border border-white/5 rounded-2xl p-4 focus:border-orange-500 outline-none transition-all resize-none text-sm leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Accent Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-12 h-12 bg-transparent rounded-xl cursor-pointer"
                />
                <span className="font-mono text-sm text-neutral-400">{formData.accentColor}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Primary Currency</label>
              <select 
                value={formData.preferredCurrency}
                onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                className="w-full bg-neutral-950 border border-white/5 rounded-2xl p-4 text-sm font-bold focus:border-orange-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="INR">INR (₹) - Best for India</option>
                <option value="USD">USD ($) - Global</option>
                <option value="EUR">EUR (€) - Europe</option>
                <option value="GBP">GBP (£) - UK</option>
              </select>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
            saved ? "bg-emerald-600 text-white" : "bg-orange-600 text-white hover:bg-orange-500 shadow-xl shadow-orange-600/20"
          )}
        >
          {saving ? 'Synchronizing...' : saved ? <><Check size={18} /> Profile Updated</> : <><Save size={18} /> Save Branding</>}
        </button>
      </div>

      {/* Preview Section */}
      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
          <Palette size={14} /> Tipping Page Preview
        </label>
        <div className="aspect-[4/3] w-full bg-neutral-950 rounded-[2.5rem] border border-white/5 overflow-hidden relative group">
           <div className="h-24 w-full bg-neutral-900 border-b border-white/5 relative">
              <div className="absolute -bottom-8 left-8 w-16 h-16 rounded-2xl border-4 border-neutral-950 bg-neutral-800 flex items-center justify-center">
                 <User className="text-neutral-600" />
              </div>
           </div>
           <div className="pt-12 px-8">
              <h3 className="text-xl font-bold">{formData.displayName || 'Creator Name'}</h3>
              <p className="text-xs text-neutral-500 mt-1">@ {streamer.username}</p>
              <p className="text-sm text-neutral-400 mt-4 leading-relaxed line-clamp-2">
                {formData.bio || 'Your bio will appear here to welcome your donors.'}
              </p>
              
              <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/5 border-dashed border-2 flex flex-col items-center gap-3">
                 <div className="w-full h-8 rounded-xl bg-white/5 animate-pulse" />
                 <div className="w-full h-12 rounded-xl" style={{ backgroundColor: formData.accentColor }} />
              </div>
           </div>
           <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p className="text-xs font-bold uppercase tracking-widest">Interactive Preview</p>
           </div>
        </div>
      </div>
    </div>
  );
}
