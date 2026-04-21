import React from 'react';
import { toast } from 'sonner';
import { Donation } from '../../types';
import { IndianRupee, Clock, CheckCircle2, Search, Zap, AlertCircle, Check } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

interface Props {
  donations: Donation[];
}

export default function HistoryLog({ donations }: Props) {
  const handleVerify = async (id: string) => {
    try {
      await updateDoc(doc(db, 'donations', id), { status: 'verified' });
      toast.success("Tip verified! The alert and goal progress will now trigger.");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input 
              placeholder="Search by donor name..."
              className="w-full bg-neutral-950 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-orange-500 outline-none transition-all"
            />
         </div>
         <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">Export CSV</button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-500 transition-all">Filter</button>
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              <th className="px-6 py-3">Donor</th>
              <th className="px-6 py-3">Message</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Gateway</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {donations.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-20 text-neutral-600 italic">No transactions found.</td>
              </tr>
            )}
            {donations.map(d => (
              <tr key={d.id} className="bg-neutral-950/50 border border-white/5 rounded-2xl hover:bg-neutral-950 transition-all group">
                <td className="px-6 py-4 rounded-l-2xl">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-600/10 text-orange-500 flex items-center justify-center font-bold text-xs">
                        {d.donorName.charAt(0)}
                      </div>
                      <span className="font-bold text-sm">{d.donorName}</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-neutral-400 line-clamp-1 italic">"{d.message}"</p>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-white text-sm">{d.currency} {d.amount}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-neutral-500 uppercase font-mono">
                    {d.gatewayUsed}
                  </span>
                </td>
                <td className="px-6 py-4">
                   {d.status === 'verified' ? (
                      <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase">
                         <CheckCircle2 size={12} /> Success
                      </div>
                   ) : (
                      <button 
                       onClick={() => handleVerify(d.id)}
                       className="flex items-center gap-1.5 text-orange-500 text-[10px] font-bold uppercase hover:bg-orange-500/10 px-2 py-1 rounded-lg transition-all border border-orange-500/20"
                      >
                         <AlertCircle size={12} /> Pending - Activate
                      </button>
                   )}
                </td>
                <td className="px-6 py-4 rounded-r-2xl">
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[10px] font-mono">
                    <Clock size={12} /> {d.createdAt?.toDate().toLocaleDateString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
