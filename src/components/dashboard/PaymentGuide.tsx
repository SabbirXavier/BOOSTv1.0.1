import React from 'react';
import { CreditCard, IndianRupee, Globe, Zap, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function PaymentGuide() {
  const steps = [
    {
      title: "Choose your Gateway",
      description: "Pick a payment method that suits your audience. Razorpay and UPI are best for Indian viewers, while Stripe is best for international support.",
      icon: <CreditCard className="text-orange-500" />
    },
    {
      title: "Acquire API Keys",
      description: "For Razorpay/Stripe, visit their dashboards to find your Secret and Public keys. For UPI, simply enter your VPA (e.g., name@upi).",
      icon: <Zap className="text-yellow-500" />
    },
    {
      title: "Activate & Test",
      description: "Once connected, toggle the 'Active' switch. Use the 'Trigger Test Alert' in the Overlays tab to ensure your widgets are communicating with our servers.",
      icon: <CheckCircle2 className="text-emerald-500" />
    }
  ];

  return (
    <div className="bg-neutral-950 border border-white/5 rounded-[2.5rem] p-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center">
          <Globe className="text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Payment Setup Guide</h2>
          <p className="text-xs text-neutral-500">Configure your financial hub in 3 simple steps</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <div key={i} className="relative p-6 rounded-3xl bg-white/5 border border-white/5">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-xs font-black italic shadow-lg">
              0{i + 1}
            </div>
            <div className="mb-4">{step.icon}</div>
            <h3 className="font-bold text-sm mb-2">{step.title}</h3>
            <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
          <h4 className="text-xs font-black uppercase text-indigo-400 mb-3 flex items-center gap-2">
            <ShieldCheck size={14} /> Razorpay & Stripe (Auto)
          </h4>
          <ul className="space-y-2">
            <li className="text-[10px] text-neutral-500 flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              Alerts trigger instantly upon successful payment confirmation from the bank.
            </li>
            <li className="text-[10px] text-neutral-500 flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              Suitable for large audiences to prevent fake donation spam.
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10">
          <h4 className="text-xs font-black uppercase text-orange-400 mb-3 flex items-center gap-2">
            <IndianRupee size={14} /> UPI Direct (Manual)
          </h4>
          <ul className="space-y-2">
            <li className="text-[10px] text-neutral-500 flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 shrink-0" />
              0% Settlement fees. You receive money directly in your bank account.
            </li>
            <li className="text-[10px] text-neutral-500 flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 shrink-0" />
              <AlertTriangle className="inline text-orange-500" size={10} /> Must be manually activated from your Log once you receive payment.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
