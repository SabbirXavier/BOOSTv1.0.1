import React from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Play, Copy, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, Info, Zap, Terminal } from 'lucide-react';
import { Streamer, Widget } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  streamer: Streamer;
  widgets: Widget[];
}

export default function SetupGuide({ streamer, widgets }: Props) {
  const alertWidget = widgets.find(w => w.type === 'alert');
  const goalWidget = widgets.find(w => w.type === 'goal');

  return (
    <div className="space-y-8">
      <div className="bg-orange-600/5 border border-orange-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-xl">
        <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center shrink-0 border-4 border-orange-600/20 shadow-lg rotate-3 overflow-hidden">
          <img src="https://static-cdn.jtvnw.net/jtv_user_pictures/8a6361a3-2395-46fd-9c3f-c67b2d56a066-profile_image-70x70.png" className="w-full h-full object-cover opacity-50 grayscale" alt="" />
          <Play size={40} className="text-white absolute ml-2" />
        </div>
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Connect to OBS Studio</h2>
          <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed font-medium">
            Boost uses <span className="text-white font-bold italic">Browser Sources</span> to display real-time interactive overlays. No downloads or complicated plugins required.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 1: Alerts */}
        <div className="bg-neutral-900 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-600/10 text-orange-500 flex items-center justify-center font-bold">1</div>
              <h3 className="text-lg font-bold">Live Alert Box</h3>
           </div>
           <p className="text-xs text-neutral-500 leading-relaxed">
             Triggers animations, confetti, and <span className="text-orange-500 font-bold">AI Voice TTS</span> when you receive a tip.
           </p>
           
           {alertWidget ? (
             <div className="space-y-4">
                <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 font-mono text-[10px] break-all text-neutral-400 flex items-center justify-between gap-4">
                   <span className="truncate">{window.location.origin}/overlay/{alertWidget.id}</span>
                   <button 
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/overlay/${alertWidget.id}`); toast.success("Alert URL copied!"); }}
                    className="p-2 bg-white/5 hover:bg-orange-600 hover:text-white rounded-lg transition-all shrink-0"
                   >
                     <Copy size={14} />
                   </button>
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest text-neutral-500">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Alert Widget is Active
                </div>
             </div>
           ) : (
             <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 flex items-center gap-2 font-bold">
                <AlertCircle size={14} /> No Alert widget found. Please create one.
             </div>
           )}
        </div>

        {/* Step 2: Goal */}
        <div className="bg-neutral-900 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold">2</div>
              <h3 className="text-lg font-bold">Dynamic Goal Bar</h3>
           </div>
           <p className="text-xs text-neutral-500 leading-relaxed">
             Shows your progress towards a goal (e.g. New PC). Updates instantly as people support you.
           </p>
           
           {goalWidget ? (
             <div className="space-y-4">
                <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 font-mono text-[10px] break-all text-neutral-400 flex items-center justify-between gap-4">
                   <span className="truncate">{window.location.origin}/overlay/{goalWidget.id}</span>
                   <button 
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/overlay/${goalWidget.id}`); toast.success("Goal URL copied!"); }}
                    className="p-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-lg transition-all shrink-0"
                   >
                     <Copy size={14} />
                   </button>
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest text-neutral-500">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Goal Widget is Active
                </div>
             </div>
           ) : (
             <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-400 flex items-center gap-2 font-bold">
                <Info size={14} /> No Goal widget found.
             </div>
           )}
        </div>
      </div>

      <div className="bg-neutral-900 border border-white/5 rounded-[2.5rem] p-10">
         <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
           <Terminal size={20} className="text-orange-500" /> OBS Setup Configuration
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
               <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Source Types</h4>
               <p className="text-xs text-neutral-400 leading-relaxed">Right-click in OBS Sources {'->'} <span className="text-white">Add</span> {'->'} <span className="text-orange-500">Browser</span>.</p>
            </div>
            <div className="space-y-3">
               <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Resolution</h4>
               <p className="text-xs text-neutral-400 leading-relaxed">Set Width to <span className="text-white font-mono">800</span> and Height to <span className="text-white font-mono">600</span> (or 1920x1080 for full screen).</p>
            </div>
            <div className="space-y-3">
               <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Audio Monitoring</h4>
               <p className="text-xs text-neutral-400 leading-relaxed">Check <span className="text-white">"Control audio via OBS"</span> if you want to apply filters to the AI Voice.</p>
            </div>
         </div>

         <div className="mt-12 p-6 bg-orange-600/10 border border-orange-500/20 rounded-3xl flex items-start gap-4">
            <Zap className="text-orange-500 shrink-0 mt-1" size={20} />
            <div>
               <p className="text-sm font-bold text-white mb-1">Verify your setup!</p>
               <p className="text-xs text-neutral-400">Go to the <span className="text-white uppercase">Overlays</span> tab and click <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded text-[10px]">TRIGGER LIVE TEST ALERT</span>. If OBS is connected correctly, the alert will appear instantly.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
