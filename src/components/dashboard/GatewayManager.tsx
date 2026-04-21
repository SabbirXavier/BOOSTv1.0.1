import React, { useState } from 'react';
import { CreditCard, Globe, ShieldCheck, Check, ChevronDown, ChevronUp, Save, Key, Settings, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { PaymentGateway } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  gateways: PaymentGateway[];
  onConnect: (type: PaymentGateway['type'], config: any) => void;
}

export default function GatewayManager({ gateways, onConnect }: Props) {
  const isConnected = (type: string) => gateways.some(g => g.type === type && g.config.connected);
  const getGatewayConfig = (type: string) => gateways.find(g => g.type === type)?.config || {};

  return (
    <div className="space-y-4">
      <GatewayCard 
        id="upi_direct"
        title="UPI Direct (India)"
        description="Receive payments directly to your PhonePe, GPay, or Paytm handle. 0% Fee."
        icon={<img src="https://www.vectorlogo.zone/logos/upi/upi-icon.svg" className="w-8" alt="UPI" />}
        connected={isConnected('upi_direct')}
        currentConfig={getGatewayConfig('upi_direct')}
        verificationMethod="manual"
        onSave={(config: any) => onConnect('upi_direct', { ...getGatewayConfig('upi_direct'), ...config, connected: true, enabled: true })}
        fields={[
          { label: 'UPI ID', key: 'upiId', placeholder: 'yourname@upi', type: 'text' }
        ]}
      />

      <GatewayCard 
        id="razorpay"
        title="Razorpay (India)"
        description="Connect your Razorpay account for cards, netbanking & wallets."
        icon={<CreditCard className="text-indigo-500" />}
        connected={isConnected('razorpay')}
        currentConfig={getGatewayConfig('razorpay')}
        onSave={(config: any) => onConnect('razorpay', { ...getGatewayConfig('razorpay'), ...config, connected: true, enabled: true })}
        fields={[
          { label: 'Key ID (API Key)', key: 'razorpayKeyId', placeholder: 'rzp_live_...', type: 'text' },
          { label: 'Key Secret', key: 'razorpayKeySecret', placeholder: 'Enter your Key Secret', type: 'password' }
        ]}
      />

      <GatewayCard 
        id="stripe"
        title="Stripe (International)"
        description="Connect your own Stripe account for international settlements."
        icon={<Globe className="text-blue-500" />}
        connected={isConnected('stripe')}
        currentConfig={getGatewayConfig('stripe')}
        onSave={(config: any) => onConnect('stripe', { ...getGatewayConfig('stripe'), ...config, connected: true, enabled: true })}
        fields={[
          { label: 'Stripe Publishable Key', key: 'stripePublicKey', placeholder: 'pk_live_...', type: 'text' },
          { label: 'Stripe Secret Key', key: 'stripeSecretKey', placeholder: 'sk_live_...', type: 'password', isSecret: true }
        ]}
      />
    </div>
  );
}

function GatewayCard({ title, description, icon, connected, onSave, fields, currentConfig, verificationMethod = 'automatic' }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState(currentConfig);

  const handleSave = () => {
    onSave(formData);
    setIsExpanded(false);
  };

  return (
    <div className={cn(
      "rounded-3xl border transition-all overflow-hidden",
      connected ? "bg-green-500/5 border-green-500/20" : "bg-neutral-950 border-white/5"
    )}>
      <div className="p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center p-2 shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="font-bold flex items-center gap-2">
              {title}
              {connected && (
                <span className={cn(
                  "flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest transition-all",
                  currentConfig.enabled ? "bg-green-500 text-white" : "bg-neutral-800 text-neutral-500"
                )}>
                  {currentConfig.enabled ? <><Check size={8} /> Active</> : "Inactive"}
                </span>
              )}
              {verificationMethod === 'manual' && (
                <span className="bg-orange-500/10 text-orange-500 text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border border-orange-500/20">
                  Manual Verification
                </span>
              )}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5 max-w-sm line-clamp-1">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {connected && (
              <button 
                onClick={() => onSave({ ...currentConfig, enabled: !currentConfig.enabled })}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all",
                  currentConfig.enabled ? "text-orange-500 hover:bg-orange-500/10" : "bg-orange-600 text-white hover:bg-orange-500"
                )}
              >
                {currentConfig.enabled ? "Deactivate" : "Activate"}
              </button>
           )}
           <button 
             onClick={() => {
               if (isExpanded) {
                 handleSave();
               } else {
                 setIsExpanded(true);
               }
             }}
             className={cn(
               "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
               connected ? (isExpanded ? "bg-orange-600 text-white shadow-lg" : "bg-white/5 text-neutral-400 hover:bg-white/10") : "bg-white text-black hover:bg-neutral-200"
             )}
           >
             {connected ? (isExpanded ? 'Save Changes' : 'Manage') : (isExpanded ? 'Setup Key' : 'Setup')}
             {isExpanded ? <Save size={14} /> : (connected ? <Settings size={14} /> : <Zap size={14} />)}
           </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-black/20"
          >
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field: any) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-neutral-500 flex items-center gap-1">
                      <Key size={10} /> {field.label}
                    </label>
                    <input 
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 outline-none focus:border-orange-500/50 transition-colors text-sm font-bold"
                    />
                  </div>
                ))}
              </div>

              {verificationMethod === 'manual' && (
                <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center gap-3">
                   <AlertCircle className="text-orange-500 shrink-0" size={16} />
                   <div className="text-[10px] text-orange-200/50 leading-relaxed font-medium">
                      <strong className="text-orange-500 block">Unverified Alerts Prevention</strong>
                      Payments made via this method are NOT automatically verified. To prevent abuse, alerts will only trigger after you manually <span className="text-white uppercase">Activate</span> the tip from your Dashboard Log. 
                   </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <p className="text-[10px] text-neutral-600 flex items-center gap-1">
                  <ShieldCheck size={12} /> Your keys are stored securely & never shared.
                </p>
                <button 
                  onClick={handleSave}
                  className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  <Save size={14} /> Save Configuration
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
