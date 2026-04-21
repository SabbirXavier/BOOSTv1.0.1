import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, ShieldCheck, Cpu, Volume2, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Home() {
  const [platformName, setPlatformName] = useState('Boost');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'platform'), (snap) => {
      if (snap.exists()) setPlatformName(snap.data().platformName);
    });
    return unsub;
  }, []);

  return (
    <main className="pt-32 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="px-4 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-600/20 blur-[120px] -z-10 rounded-full" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
            Future of Tipping
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
            Empowering Indian Streamers with <span className="text-orange-500">Zero Commissions.</span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Keep 100% of your earnings. Direct UPI integration, real-time alerts, and multilingual AI TTS. No cuts, just a simple subscription.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="w-full sm:w-auto bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-orange-500 transition-all shadow-[0_0_40px_rgba(234,88,12,0.3)] flex items-center justify-center gap-2">
              Start Free Trial <ArrowRight size={20} />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg border border-white/10 hover:bg-white/5 transition-colors">
              Explore Demo
            </button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <FeatureCard 
            icon={<Zap className="text-orange-500" />}
            title="Instant UPI Tips"
            description="Viewers tip via phone apps directly to your UPI ID. No waiting for weekly payouts."
          />
          <FeatureCard 
            icon={<Volume2 className="text-blue-500" />}
            title="Multilingual TTS"
            description="AI reads donor messages in Hindi, Marathi, and English with perfect pronunciation."
          />
          <FeatureCard 
            icon={<Globe className="text-green-500" />}
            title="Zero Commission"
            description="We never take a cut of your tips. You keep every rupee sent by your fans."
          />
        </div>
      </section>
      
      {/* Pricing Mockup */}
      <section className="mt-32 px-4">
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-neutral-900/50 p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Simple Monthly Subscription</h2>
          <p className="text-neutral-400 mb-8">One flat fee for all premium features. No hidden charges.</p>
          <div className="text-6xl font-bold mb-8">₹499 <span className="text-xl text-neutral-500">/ month</span></div>
          <button className="bg-white text-black px-12 py-4 rounded-2xl font-bold text-lg hover:bg-neutral-200 transition-colors">
            Get Pro Badge
          </button>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl border border-white/5 bg-neutral-900/30 backdrop-blur-sm hover:border-white/10 transition-colors group">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-neutral-400 leading-relaxed">{description}</p>
    </div>
  );
}
