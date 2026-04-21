import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Play, Save, Info, AlertCircle, Volume2, Mic, Headphones, IndianRupee } from 'lucide-react';
import { Widget } from '../../types';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { generateTTS } from '../../lib/gemini';

interface Props {
  widget: Widget;
}

export default function WidgetCustomizer({ widget }: Props) {
  const [config, setConfig] = useState(widget.config);
  const [saving, setSaving] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState(false);
  const [testAlert, setTestAlert] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'widgets', widget.id), { config });
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handlePreviewVoice = async () => {
    if (previewingVoice) return;
    setPreviewingVoice(true);
    try {
      const voice = config.ttsVoice || 'Zephyr';
      const audioBase64 = await generateTTS(`Hello! I am the ${voice} voice. This is how I will sound on your stream.`, voice);
      if (audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        await audio.play();
      }
    } catch (err) {
      console.error(err);
    }
    setPreviewingVoice(false);
  };

  const triggerTestAlert = () => {
    setTestAlert(true);
    setTimeout(() => setTestAlert(false), 5000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-neutral-500 flex items-center gap-2">
            <Play size={12} /> Live Preview
          </h3>
          {widget.type === 'alert' && (
            <button 
              onClick={triggerTestAlert}
              className="text-[10px] font-black uppercase text-orange-500 hover:underline"
            >
              Test Alert
            </button>
          )}
        </div>
        <div className="aspect-video w-full bg-neutral-950 rounded-3xl border border-white/5 relative overflow-hidden flex items-center justify-center p-8 border-dashed border-2">
          {widget.type === 'alert' && (
            <AnimatePresence>
              {testAlert && (
                <motion.div 
                   initial={{ y: 20, opacity: 0, scale: 0.9 }}
                   animate={{ y: 0, opacity: 1, scale: 1 }} 
                   exit={{ opacity: 0, scale: 0.8 }}
                   className="bg-black/90 p-6 rounded-3xl border border-white/10 text-center shadow-2xl relative z-10"
                >
                  <div className="w-12 h-12 rounded-xl mx-auto mb-4 animate-bounce" style={{ backgroundColor: config.primaryColor }} />
                  <p className="font-black text-white uppercase italic text-lg tracking-tighter">DONOR Name Sent ₹50</p>
                  <p className="text-sm text-neutral-400 mt-2 italic">"Example message for {widget.type}!"</p>
                </motion.div>
              )}
              {!testAlert && <p className="text-[10px] text-neutral-700 uppercase italic font-bold">Waiting for test signal...</p>}
            </AnimatePresence>
          )}
          
          {widget.type === 'goal' && (
            <div className="w-full max-w-sm space-y-3">
               <div className="flex justify-between text-xs font-black uppercase italic tracking-tight">
                 <span>{config.goalTitle || 'New PC Goal'}</span>
                 <span className="text-orange-500">
                    {Math.round(((config.currentProgress || 0) / (config.goalAmount || 1000)) * 100)}%
                 </span>
               </div>
               <div className="h-5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(100, ((config.currentProgress || 0) / (config.goalAmount || 1000)) * 100)}%` }}
                   className="h-full rounded-full shadow-[0_0_15px_rgba(234,88,12,0.3)] transition-all" 
                   style={{ backgroundColor: config.primaryColor }} 
                 />
               </div>
               <div className="flex justify-between text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1">
                  <span>₹{config.currentProgress || 0}</span>
                  <span>₹{config.goalAmount || 1000}</span>
               </div>
            </div>
          )}
        </div>
        {widget.type === 'alert' && (
          <p className="text-[10px] text-neutral-500 italic text-center">Tip: Click "Test Alert" to simulate a real contribution.</p>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-neutral-500">Accent Color</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-10 h-10 bg-transparent rounded cursor-pointer"
                />
                <span className="text-sm font-mono uppercase text-neutral-400">{config.primaryColor}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-neutral-500">Min Amount</label>
              <input 
                type="number"
                value={config.minAmount}
                onChange={(e) => setConfig({ ...config, minAmount: parseInt(e.target.value) })}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl p-2 outline-none"
              />
            </div>
         </div>

         <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
               <div>
                 <p className="text-sm font-bold">TTS Enabled</p>
                 <p className="text-[10px] text-neutral-500">Read donor messages using AI</p>
               </div>
               <button 
                 onClick={() => setConfig({ ...config, ttsEnabled: !config.ttsEnabled })}
                 className={cn(
                   "w-12 h-6 rounded-full transition-colors relative",
                   config.ttsEnabled ? "bg-orange-600" : "bg-neutral-800"
                 )}
               >
                 <div className={cn(
                   "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                   config.ttsEnabled ? "right-1" : "left-1"
                 )} />
               </button>
            </div>

            {config.ttsEnabled && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 className="space-y-2"
               >
                  <label className="text-xs font-bold uppercase text-neutral-500 flex items-center gap-2">
                    <Mic size={12} /> AI Voice Selection
                  </label>
                  <div className="flex gap-2">
                    <select 
                      value={config.ttsVoice || 'Zephyr'}
                      onChange={(e) => setConfig({ ...config, ttsVoice: e.target.value })}
                      className="grow bg-neutral-950 border border-white/10 rounded-xl p-3 outline-none text-sm font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat"
                    >
                      <option value="Zephyr">Zephyr (Energetic)</option>
                      <option value="Kore">Kore (Balanced)</option>
                      <option value="Puck">Puck (Playful)</option>
                      <option value="Charon">Charon (Deep/Narration)</option>
                      <option value="Fenrir">Fenrir (Mysterious)</option>
                    </select>
                    <button 
                      onClick={handlePreviewVoice}
                      disabled={previewingVoice}
                      className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all text-orange-500 disabled:opacity-50"
                      title="Play Preview"
                    >
                      {previewingVoice ? <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> : <Volume2 size={20} />}
                    </button>
                  </div>
               </motion.div>
            )}
         </div>

         {widget.type === 'goal' && (
           <div className="space-y-4 pt-4 border-t border-white/5">
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-neutral-500">Goal Title</label>
                <input 
                  type="text"
                  value={config.goalTitle}
                  onChange={(e) => setConfig({ ...config, goalTitle: e.target.value })}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl p-2 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-neutral-500">Goal Amount</label>
                  <input 
                    type="number"
                    value={config.goalAmount}
                    onChange={(e) => setConfig({ ...config, goalAmount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition-colors font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-neutral-500">Starting Amount</label>
                  <input 
                    type="number"
                    value={config.currentProgress || 0}
                    onChange={(e) => setConfig({ ...config, currentProgress: parseInt(e.target.value) || 0 })}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500 transition-colors font-bold text-orange-500"
                  />
                </div>
              </div>
           </div>
         )}

         <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
         >
           <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
         </button>
      </div>
    </div>
  );
}
