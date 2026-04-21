import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import { 
  doc, onSnapshot, collection, query, 
  where, orderBy, limit, updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { Donation, Widget } from '../types';
import { generateTTS } from '../lib/gemini';
import { IndianRupee } from 'lucide-react';

export default function OverlayPage() {
  const { widgetId } = useParams();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [queue, setQueue] = useState<Donation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const startTime = useRef(Timestamp.now());

  // 1. Fetch Widget Config
  useEffect(() => {
    if (!widgetId) return;
    const unsub = onSnapshot(doc(db, 'widgets', widgetId), (docSnap) => {
      if (docSnap.exists()) {
        setWidget({ id: docSnap.id, ...docSnap.data() } as Widget);
      }
    });
    return unsub;
  }, [widgetId]);

  // 2. Listen for New Donations
  useEffect(() => {
    if (!widget) return;

    const dq = query(
      collection(db, 'donations'),
      where('streamerId', '==', widget.streamerId),
      where('status', '==', 'verified'),
      where('createdAt', '>', startTime.current),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(dq, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const donation = { id: change.doc.id, ...change.doc.data() } as Donation;
          setQueue(prev => [...prev, donation]);
        }
      });
    });

    return unsub;
  }, [widget]);

  // 3. Process Queue
  useEffect(() => {
    if (queue.length > 0 && !isProcessing) {
      processNextAlert();
    }
  }, [queue, isProcessing]);

  const processNextAlert = async () => {
    setIsProcessing(true);
    const nextAlert = queue[0];
    setQueue(prev => prev.slice(1));
    setCurrentAlert(nextAlert);

    // Confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: [widget?.config.primaryColor || '#ea580c', '#ffffff']
    });

    // Handle TTS
    if (widget?.config.ttsEnabled && nextAlert.message) {
      const audioBase64 = await generateTTS(nextAlert.message, widget.config.ttsVoice || 'Zephyr');
      if (audioBase64) {
        await playAudio(audioBase64);
      }
    } else {
      // Delay if no TTS
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Done with this alert
    setCurrentAlert(null);
    setIsProcessing(false);
  };

  const playAudio = (base64: string): Promise<void> => {
    return new Promise((resolve) => {
      const audio = new Audio(`data:audio/wav;base64,${base64}`);
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  };

  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [goalTotal, setGoalTotal] = useState(0);

  useEffect(() => {
    if (!widget) return;

    if (widget.type === 'ticker') {
      const q = query(
        collection(db, 'donations'), 
        where('streamerId', '==', widget.streamerId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      return onSnapshot(q, (snap) => {
        setRecentDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
      });
    }

    if (widget.type === 'goal') {
      const q = query(
        collection(db, 'donations'),
        where('streamerId', '==', widget.streamerId),
        where('status', '==', 'verified')
      );
      return onSnapshot(q, (snap) => {
        const total = snap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
        setGoalTotal(total);
      });
    }
  }, [widget]);

  if (!widget) return null;

  const currentGoalAmount = (widget.config.currentProgress || 0) + goalTotal;
  const goalTarget = widget.config.goalAmount || 1000;
  const progressPercent = Math.min(100, Math.round((currentGoalAmount / goalTarget) * 100));

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-transparent overflow-hidden">
      {/* Alert Component */}
      <AnimatePresence>
        {widget.type === 'alert' && currentAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
            className="flex flex-col items-center text-center p-8 rounded-[40px] bg-black/90 backdrop-blur-md border border-white/20 shadow-2xl max-w-2xl min-w-[400px]"
          >
             <div 
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
              style={{ backgroundColor: widget.config.primaryColor }}
             >
                <IndianRupee size={48} className="text-white" />
             </div>
             
             <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tight italic">
               {currentAlert.donorName} SENT {currentAlert.currency || '₹'}{currentAlert.amount}
             </h1>
             
             <div className="h-1 w-24 bg-white/20 rounded-full mb-6" />
             
             <p className="text-2xl font-bold text-orange-400 leading-relaxed max-w-md italic">
               "{currentAlert.message}"
             </p>

             <motion.div 
               className="mt-8 flex gap-1"
               animate={{ opacity: [0.4, 1, 0.4] }}
               transition={{ duration: 1.5, repeat: Infinity }}
             >
                {[...Array(5)].map((_, i) => (
                   <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
                ))}
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Component */}
      {widget.type === 'goal' && (
        <div className="absolute bottom-10 left-10 w-96 p-6 rounded-3xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2 italic">
            <span className="text-white">{widget.config.goalTitle || 'DONATION GOAL'}</span>
            <span className="text-neutral-400">
              {progressPercent}%
            </span>
          </div>
          <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full shadow-[0_0_20px_rgba(234,88,12,0.5)]"
              style={{ backgroundColor: widget.config.primaryColor }}
            />
          </div>
          <div className="flex justify-between mt-3 text-[10px] font-bold font-mono text-neutral-500 uppercase tracking-tighter">
            <span>₹ {currentGoalAmount}</span>
            <span>₹ {goalTarget}</span>
          </div>
        </div>
      )}

      {/* Ticker Component */}
      {widget.type === 'ticker' && (
        <div className="absolute top-0 left-0 w-full bg-neutral-950/80 backdrop-blur-md border-b border-white/10 h-12 flex items-center overflow-hidden">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-12 whitespace-nowrap px-10"
          >
            {recentDonations.length > 0 ? recentDonations.map(d => (
              <div key={d.id} className="flex items-center gap-2">
                <span className="text-xs font-black text-orange-500 italic uppercase">{d.donorName}</span>
                <span className="text-xs font-bold text-white">{d.currency}{d.amount}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 mx-4" />
              </div>
            )) : (
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Awaiting contributions... StreamVibe.live</span>
            )}
            {/* Duplicate for seamless loop */}
            {recentDonations.map(d => (
              <div key={`${d.id}-dup`} className="flex items-center gap-2">
                <span className="text-xs font-black text-orange-500 italic uppercase">{d.donorName}</span>
                <span className="text-xs font-bold text-white">{d.currency}{d.amount}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 mx-4" />
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
