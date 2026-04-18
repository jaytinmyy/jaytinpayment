
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Ticket } from 'lucide-react';
import { Voucher } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (voucher: Voucher) => void;
  initialData?: Voucher;
}

const VoucherModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Voucher['status']>('Unused');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code);
      setAmount(initialData.amount.toString());
      setExpiryDate(initialData.expiryDate);
      setDescription(initialData.description || '');
      setStatus(initialData.status);
    } else {
      setName('');
      setCode('V-' + Math.random().toString(36).substring(2, 10).toUpperCase());
      setAmount('');
      setExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 30 days default
      setDescription('');
      setStatus('Unused');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id || `VOU-${Date.now()}`,
      name,
      code,
      amount: parseFloat(amount) || 0,
      expiryDate,
      description,
      status,
      createdAt: initialData?.createdAt || new Date().toISOString()
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#EBFAFF]/80 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} className="glass-card w-full max-w-lg rounded-[32px] overflow-hidden border border-white/50 shadow-2xl relative z-10">
        <div className="p-8 border-b border-white/20 flex justify-between items-center bg-white/10">
          <div className="flex items-center space-x-3">
             <div className="p-2.5 bg-indigo-50 rounded-2xl"><Ticket className="w-6 h-6 text-indigo-500" /></div>
             <div><h3 className="text-xl font-jua text-[#333]">{initialData ? 'Update Privilege' : 'Issue Voucher'}</h3><p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Exclusive Value Protocol</p></div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/30 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Voucher Name</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Early Bird" className="w-full bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Access Code</label>
                <input required type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Value (RM)</label>
                <input required type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Expiry Threshold</label>
                <input required type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Description (Optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none resize-none" />
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocol Status</span>
               <div className="flex space-x-1">
                 {(['Unused', 'Used', 'Expired'] as const).map(s => (
                   <button key={s} type="button" onClick={() => setStatus(s)} className={`px-4 py-2 text-[8px] font-bold uppercase rounded-lg border transition-all ${status === s ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-gray-400 border-gray-200'}`}>{s}</button>
                 ))}
               </div>
            </div>
          </div>
          
          <button type="submit" className="w-full bg-indigo-500 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 active-scale">Confirm Synchronization</button>
        </form>
      </motion.div>
    </div>
  );
};

export default VoucherModal;
