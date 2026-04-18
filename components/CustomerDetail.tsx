
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Edit2, 
  Share2, Check, Trash2, AlertCircle, Target, TrendingDown, Clock, Plus, ShieldCheck
} from 'lucide-react';
import { LedgerRecord, PurchaseItem, PaymentRecord } from '../types';
import AddItemModal from './AddItemModal';
import PaymentModal from './PaymentModal';
import RecordFormModal from './RecordFormModal';

interface Props {
  record: LedgerRecord;
  isViewOnly?: boolean;
  onClose: () => void;
  onUpdateRecord: (record: LedgerRecord) => void;
  onDeleteRecord?: (id: string) => void;
  stats?: any;
  allRecords?: LedgerRecord[];
}

const CustomerDetail: React.FC<Props> = ({ record, isViewOnly = false, onClose, onUpdateRecord, onDeleteRecord, stats, allRecords }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'history'>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<PurchaseItem | undefined>(undefined);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | undefined>(undefined);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const progress = (record.paidAmount / record.totalAmount) * 100 || 0;
  const remaining = Math.max(0, record.totalAmount - record.paidAmount);
  const isOverdue = record.status === 'Overdue';

  const handleSettleCompletely = () => {
    if (!confirm("Confirm full settlement of this protocol?")) return;
    const nextRecord = { 
      ...record, 
      paidAmount: record.totalAmount, 
      status: 'Settled' as const,
      notes: [{ id: `N-${Date.now()}`, timestamp: new Date().toLocaleString(), content: 'Protocol manually settled and closed.' }, ...record.notes]
    };
    onUpdateRecord(nextRecord);
  };

  const handleUpdateItem = (item: PurchaseItem) => {
    let nextItems = [...record.items];
    const index = nextItems.findIndex(i => i.id === item.id);
    if (index >= 0) nextItems[index] = item;
    else nextItems = [item, ...nextItems];

    const total = nextItems.reduce((sum, i) => sum + i.amount, 0);
    const paid = record.payments.reduce((sum, p) => sum + p.amount, 0);
    onUpdateRecord({ ...record, items: nextItems, totalAmount: total, paidAmount: paid });
    setIsAddingItem(false);
    setEditingItem(undefined);
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Remove this asset?")) return;
    const nextItems = record.items.filter(i => i.id !== id);
    const total = nextItems.reduce((sum, i) => sum + i.amount, 0);
    onUpdateRecord({ ...record, items: nextItems, totalAmount: total });
  };

  const handleUpdatePayment = (payment: PaymentRecord) => {
    let nextPayments = [...record.payments];
    const index = nextPayments.findIndex(p => p.id === payment.id);
    if (index >= 0) nextPayments[index] = payment;
    else nextPayments = [payment, ...nextPayments];

    const paid = nextPayments.reduce((sum, p) => sum + p.amount, 0);
    const newStatus = paid >= record.totalAmount ? 'Settled' : record.status;
    onUpdateRecord({ ...record, payments: nextPayments, paidAmount: paid, status: newStatus as any });
    setIsRecordingPayment(false);
    setEditingPayment(undefined);
  };

  const handleDeletePayment = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Void this injection record?")) return;
    const nextPayments = record.payments.filter(p => p.id !== id);
    const paid = nextPayments.reduce((sum, p) => sum + p.amount, 0);
    onUpdateRecord({ ...record, payments: nextPayments, paidAmount: paid });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-[#EBFAFF]/80 backdrop-blur-xl p-0 md:p-8">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="glass-card w-full max-w-6xl h-full md:max-h-[92vh] md:rounded-[48px] overflow-hidden flex flex-col relative shadow-2xl">
        
        {/* Header */}
        <div className="p-6 md:p-10 pb-4 relative flex flex-col md:flex-row justify-between items-start gap-8">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/40 rounded-full z-10 border border-white/40 hover:bg-white active-scale shadow-sm transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-jua text-[#B8A17D] uppercase tracking-[0.3em]">{isViewOnly ? 'Identity Vault' : 'Protocol Detail'}</span>
              <div className={`px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${isOverdue ? 'bg-red-500 text-white animate-pulse border-red-400' : 'bg-white/40 text-gray-500 border-white/60'}`}>
                {record.status}
              </div>
            </div>
            <h2 className="text-3xl md:text-5xl font-jua text-[#333] tracking-tight">{record.userName}</h2>
            <div className="flex items-center gap-2 pt-1">
              {!isViewOnly && (
                <>
                  <button onClick={() => setIsEditingProfile(true)} className="p-2 bg-white/50 border border-white/60 rounded-xl text-[#B8A17D] active-scale shadow-sm hover:bg-white" title="Edit Profile"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={handleSettleCompletely} className="p-2 bg-green-50 border border-green-200 rounded-xl text-green-600 active-scale shadow-sm hover:bg-green-100" title="Instant Settle"><ShieldCheck className="w-4 h-4" /></button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="p-2 bg-red-50 border border-red-100 rounded-xl text-red-400 active-scale shadow-sm hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
              <button onClick={() => { const url = `${window.location.origin}${window.location.pathname}#/share/${record.shareKey}`; navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-4 py-2 bg-white border border-white/60 rounded-xl text-[10px] font-bold uppercase tracking-widest active-scale text-[#B8A17D] flex items-center shadow-sm">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />} {copied ? 'Copied' : 'Share URL'}
              </button>
            </div>
          </div>

          <div className="w-full md:w-96 p-6 rounded-[32px] bg-[#1A1A1A] text-white shadow-2xl space-y-4 border border-white/10">
            <div className="flex justify-between items-end"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocol Fulfillment</span><span className="text-sm font-jua">{progress.toFixed(1)}%</span></div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-[#B8A17D] to-[#8C7A5E]" /></div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div><p className="text-[8px] text-gray-400 uppercase tracking-widest font-bold">Injected</p><p className="text-lg font-jua">RM{record.paidAmount.toLocaleString()}</p></div>
              <div className="text-right"><p className="text-[8px] text-gray-400 uppercase tracking-widest font-bold">Exposure</p><p className={`text-lg font-jua ${isOverdue ? 'text-red-400' : 'text-[#B8A17D]'}`}>RM{remaining.toLocaleString()}</p></div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-4 md:px-12 border-b border-white/10">
          <div className="flex">
            {['overview', 'items', 'history'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-5 px-6 md:px-8 text-[10px] font-bold uppercase tracking-[0.3em] relative ${activeTab === tab ? 'text-[#333]' : 'text-gray-400'}`}>
                {tab}{activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#B8A17D] rounded-t-full" />}
              </button>
            ))}
          </div>
          {!isViewOnly && (
            <div className="flex items-center space-x-2">
              {activeTab === 'items' && (
                <button onClick={() => { setEditingItem(undefined); setIsAddingItem(true); }} className="flex items-center space-x-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-xl text-[9px] font-bold uppercase tracking-widest active-scale shadow-lg"><Plus className="w-3.5 h-3.5" /> <span>Declare Asset</span></button>
              )}
              {activeTab === 'history' && (
                <button onClick={() => { setEditingPayment(undefined); setIsRecordingPayment(true); }} className="flex items-center space-x-2 px-4 py-2 bg-[#B8A17D] text-white rounded-xl text-[9px] font-bold uppercase tracking-widest active-scale shadow-lg"><Plus className="w-3.5 h-3.5" /> <span>Inject Capital</span></button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 pt-8 custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-8 rounded-[32px] bg-white border border-white/60 shadow-xl flex flex-col justify-between">
                    <Target className="w-6 h-6 text-[#B8A17D] mb-4" />
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Agreement Valuation</p><h4 className="text-2xl font-jua text-[#333]">RM{record.totalAmount.toLocaleString()}</h4></div>
                 </div>
                 <div className={`p-8 rounded-[32px] border shadow-xl flex flex-col justify-between ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-white/60'}`}>
                    <TrendingDown className={`w-6 h-6 mb-4 ${isOverdue ? 'text-red-500 animate-bounce' : 'text-red-400'}`} />
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Exposure</p><h4 className={`text-2xl font-jua ${isOverdue ? 'text-red-600' : 'text-red-500'}`}>RM{remaining.toLocaleString()}</h4></div>
                 </div>
                 <div className="p-8 rounded-[32px] bg-[#B8A17D] text-white shadow-xl flex flex-col justify-between">
                    <Clock className="w-6 h-6 text-white/60 mb-4" />
                    <div><p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Maturity Date</p><h4 className="text-xl font-jua">{record.endDate || 'N/A'}</h4></div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evidence Gallery</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[...(record.attachments || []), ...record.items.filter(i => i.attachment).map(i => i.attachment!)].map((att, idx) => (
                      <div key={idx} onClick={() => setFullScreenImage(att.data)} className="aspect-square bg-white border border-white/60 rounded-2xl overflow-hidden cursor-pointer active-scale shadow-sm group">
                        <img src={att.data} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                    ))}
                    {record.items.length === 0 && <div className="col-span-3 text-[10px] text-gray-300 font-bold uppercase italic py-8 border-2 border-dashed border-gray-100 rounded-3xl text-center">No artifacts uploaded.</div>}
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Audit Logs</h4>
                  <div className="space-y-3">
                    {record.notes.map(note => (
                      <div key={note.id} className="p-5 bg-white/50 rounded-2xl border border-white shadow-sm">
                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-2 flex items-center"><Clock className="w-2.5 h-2.5 mr-1.5" /> {note.timestamp}</p>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {record.items.map(item => (
                <div key={item.id} onClick={() => !isViewOnly && (setEditingItem(item), setIsAddingItem(true))} className="group p-6 bg-white border border-white/60 rounded-[32px] shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex space-x-4">
                  {item.attachment && (
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                      <img src={item.attachment.data} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-[#B8A17D] uppercase tracking-widest mb-1">{item.date}</p>
                      <h4 className="text-lg font-bold text-[#333] group-hover:text-black leading-tight">{item.name}</h4>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-xl font-jua text-[#333]">RM{item.amount.toLocaleString()}</span>
                      {!isViewOnly && (
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setIsAddingItem(true); }} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-[#B8A17D]"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => handleDeleteItem(e, item.id)} className="p-2 bg-red-50 rounded-lg text-red-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {record.items.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 text-sm font-medium">No assets declared in this protocol.</div>}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {record.payments.map(payment => (
                <div key={payment.id} onClick={() => !isViewOnly && (setEditingPayment(payment), setIsRecordingPayment(true))} className="group flex items-center space-x-6 p-6 bg-white border border-white/60 rounded-[32px] shadow-sm hover:shadow-xl transition-all cursor-pointer">
                  {payment.attachment ? (
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                      <img src={payment.attachment.data} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center border border-green-100 shrink-0"><Check className="w-6 h-6 text-green-500" /></div>
                  )}
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-[#B8A17D] uppercase tracking-widest">{payment.method} • {payment.date}</p>
                    <p className="text-base font-bold text-gray-800">Injection Confirmed</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-jua text-green-600">+RM{payment.amount.toLocaleString()}</span>
                    {!isViewOnly && (
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={(e) => { e.stopPropagation(); setEditingPayment(payment); setIsRecordingPayment(true); }} className="p-2 text-gray-400 hover:text-[#B8A17D]"><Edit2 className="w-3.5 h-3.5" /></button>
                         <button onClick={(e) => handleDeletePayment(e, payment.id)} className="p-2 text-red-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {record.payments.length === 0 && <div className="py-20 text-center text-gray-400 text-sm font-medium">No injection history found.</div>}
            </div>
          )}
        </div>

        <AnimatePresence>
          {isAddingItem && (
            <AddItemModal isOpen={isAddingItem} onClose={() => { setIsAddingItem(false); setEditingItem(undefined); }} onSubmit={handleUpdateItem} initialData={editingItem} />
          )}
          {isRecordingPayment && (
            <PaymentModal isOpen={isRecordingPayment} onClose={() => { setIsRecordingPayment(false); setEditingPayment(undefined); }} onSubmit={handleUpdatePayment} maxAmount={999999} initialData={editingPayment} />
          )}
          {isEditingProfile && (
            <RecordFormModal isOpen={isEditingProfile} onClose={() => setIsEditingProfile(false)} onSave={onUpdateRecord} initialData={record} />
          )}
          {fullScreenImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFullScreenImage(null)} className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out">
              <img src={fullScreenImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              <button className="absolute top-8 right-8 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"><X className="w-8 h-8" /></button>
            </motion.div>
          )}
          {showDeleteConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-[#000]/40 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center space-y-6 shadow-2xl">
                <div className="w-20 h-20 bg-red-50 rounded-3xl mx-auto flex items-center justify-center"><AlertCircle className="w-10 h-10 text-red-500" /></div>
                <div><h4 className="text-2xl font-jua text-[#333]">Terminate Protocol?</h4><p className="text-xs text-gray-500 mt-2 font-medium">This bond will be permanently erased. This cannot be undone.</p></div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { if(onDeleteRecord) onDeleteRecord(record.id); onClose(); }} className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest active-scale">Confirm Destruction</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="w-full bg-gray-100 text-gray-400 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest active-scale">Abort</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default CustomerDetail;
