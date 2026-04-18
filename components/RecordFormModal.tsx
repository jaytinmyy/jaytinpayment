
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash } from 'lucide-react';
import { LedgerRecord, PaymentType } from '../types';

const generateJayTINId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'JayTIN';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateShareKey = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: LedgerRecord) => void;
  initialData?: LedgerRecord;
}

const RecordFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData }) => {
  const [userName, setUserName] = useState('');
  const [type, setType] = useState<PaymentType>('Installment');
  const [cycle, setCycle] = useState<'Day' | 'Weekly' | 'Monthly'>('Monthly');
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (initialData) {
      setUserName(initialData.userName);
      setType(initialData.type);
      setCycle((initialData.paymentCycle as any) || 'Monthly');
      setCycleCount(initialData.cycleCount || 1);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate || '');
    } else if (isOpen) {
      setUserName('');
      setType('Installment');
      setCycle('Monthly');
      setCycleCount(1);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const record: LedgerRecord = initialData ? {
      ...initialData,
      userName,
      type,
      startDate,
      endDate: endDate || undefined,
      paymentCycle: type === 'Installment' ? cycle : undefined,
      cycleCount: type === 'Installment' ? cycleCount : undefined,
      // 如果老数据没有 shareKey，在这里自动补全，解决 URL 变成 ERROR 的问题
      shareKey: initialData.shareKey || generateShareKey(),
    } : {
      id: generateJayTINId(),
      shareKey: generateShareKey(),
      userName,
      type,
      totalAmount: 0,
      paidAmount: 0,
      paymentCycle: type === 'Installment' ? cycle : undefined,
      cycleCount: type === 'Installment' ? cycleCount : undefined,
      startDate,
      endDate: endDate || undefined,
      items: [],
      payments: [],
      notes: [{ id: `N-${Date.now()}`, timestamp: new Date().toLocaleString(), content: 'Protocol initialized.' }],
      attachments: [],
      status: 'Active'
    };
    onSave(record);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#EBFAFF]/80 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} className="glass-card w-full max-w-lg rounded-[32px] overflow-hidden border border-white/50 shadow-2xl relative z-10">
        <div className="p-8 border-b border-white/20 flex justify-between items-center bg-white/10">
          <div><h3 className="text-xl font-jua text-[#333]">{initialData ? 'Refine Protocol' : 'Initialize Ledger'}</h3><p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-1">Private Registry Entry</p></div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/30 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Client Profile Name</label>
              <input required type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Full Legal Name" className="w-full bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Start Date</label>
                <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Maturity Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Protocol Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as PaymentType)} className="w-full bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none appearance-none cursor-pointer">
                <option value="Installment">Installment Agreement</option>
                <option value="Delayed">Delayed Settlement</option>
              </select>
            </div>
            {type === 'Installment' && (
              <div className="p-6 rounded-3xl bg-[#B8A17D]/5 border border-[#B8A17D]/10 space-y-6 overflow-hidden">
                <label className="text-[10px] font-bold text-[#B8A17D] uppercase tracking-wider block mb-3">Cycle Frequency</label>
                <div className="flex space-x-2">
                  {['Day', 'Weekly', 'Monthly'].map(c => (
                    <button key={c} type="button" onClick={() => setCycle(c as any)} className={`flex-1 py-2.5 text-[10px] font-bold rounded-xl border transition-all ${cycle === c ? 'bg-[#333] text-white border-[#333]' : 'bg-white/40 border-white/30 text-gray-400'}`}>{c}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button type="submit" className="w-full bg-[#999] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.3em] shadow-xl gold-glow border border-[#B8A17D]/30 hover:brightness-105 transition-all">Archive Protocol</button>
        </form>
      </motion.div>
    </div>
  );
};

export default RecordFormModal;
