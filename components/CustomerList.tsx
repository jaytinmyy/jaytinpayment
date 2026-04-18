
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { LedgerRecord } from '../types';

interface Props {
  records: LedgerRecord[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const CustomerList: React.FC<Props> = ({ records, onSelect, selectedId }) => {
  if (records.length === 0) {
    return (
      <div className="glass-card rounded-[32px] flex flex-col items-center justify-center py-24 text-gray-400 border border-white/50">
        <AlertCircle className="w-12 h-12 mb-4 opacity-10" />
        <p className="text-sm font-medium tracking-wide">No financial protocols detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop View (Table) */}
      <div className="hidden md:block glass-card rounded-[32px] overflow-hidden border border-white/40 min-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Client Profile</th>
              <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Protocol Type</th>
              <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] text-right">Balance</th>
              <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Status</th>
              <th className="px-8 py-6 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {records.map((record, index) => (
              <motion.tr 
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelect(record.id)}
                className={`group cursor-pointer hover:bg-white/40 transition-all duration-300 ${selectedId === record.id ? 'bg-white/60' : ''}`}
              >
                <td className="px-10 py-6">
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-[#333] mb-1 group-hover:text-black">{record.userName}</span>
                    <span className="text-[10px] font-jua text-gray-400 tracking-wider uppercase">{record.id}</span>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <span className="text-[10px] font-bold text-[#999] bg-white/50 border border-white/60 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                    {record.type}
                  </span>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-jua text-[#333]">
                      RM{(record.totalAmount - record.paidAmount).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">Total: RM{record.totalAmount.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <StatusBadge status={record.status} />
                </td>
                <td className="px-6 py-6">
                  <ChevronRight className={`w-5 h-5 text-gray-300 transition-all duration-300 ${selectedId === record.id ? 'translate-x-2 text-[#B8A17D]' : 'group-hover:translate-x-2'}`} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4 pb-8">
        {records.map((record, index) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(record.id)}
            className={`glass-card p-6 rounded-[28px] border border-white/50 shadow-sm active-scale ${selectedId === record.id ? 'bg-white/80 border-[#B8A17D]/30 ring-1 ring-[#B8A17D]/20' : ''}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-[#B8A17D] uppercase tracking-[0.3em]">Protocol Entry</p>
                <h3 className="text-xl font-bold text-[#333] tracking-tight">{record.userName}</h3>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase opacity-70">{record.id}</p>
              </div>
              <StatusBadge status={record.status} />
            </div>

            <div className="flex justify-between items-end bg-white/30 p-4 rounded-2xl border border-white/40">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Remaining Capital</p>
                <p className="text-2xl font-jua text-[#333] tracking-tighter">RM{(record.totalAmount - record.paidAmount).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Valuation</p>
                <p className="text-xs font-jua text-gray-500 opacity-60">RM{record.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-between items-center px-1">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{record.type}</span>
               <div className="flex items-center text-[#B8A17D] text-[10px] font-bold uppercase tracking-widest">
                  View Detail <ChevronRight className="w-3.5 h-3.5 ml-1" />
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'Active') {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/40 border border-[#B8A17D]/20">
        <div className="w-1.5 h-1.5 rounded-full bg-[#B8A17D] shadow-[0_0_8px_#B8A17D]" />
        <span className="text-[10px] font-bold text-[#B8A17D] uppercase tracking-widest">Active</span>
      </div>
    );
  }
  if (status === 'Settled') {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#333] border border-[#B8A17D]/30 shadow-md">
        <ShieldCheck className="w-3.5 h-3.5 text-[#B8A17D]" />
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Settled</span>
      </div>
    );
  }
  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-500 border border-red-400 shadow-lg animate-pulse">
      <AlertTriangle className="w-3.5 h-3.5 text-white" />
      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Overdue</span>
    </div>
  );
};

export default CustomerList;
