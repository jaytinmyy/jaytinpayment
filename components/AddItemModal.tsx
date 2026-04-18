
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingBag, ImageIcon, AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { PurchaseItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: PurchaseItem) => void;
  initialData?: PurchaseItem;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DRAFT_KEY = 'jaytin_item_draft';

const AddItemModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [itemImage, setItemImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setName('');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setItemImage(null);
    setError(null);
    localStorage.removeItem(DRAFT_KEY);
  }

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmount(initialData.amount);
      setDate(initialData.date);
      setNote(initialData.note || '');
      setItemImage(initialData.attachment?.data || null);
    } else if (isOpen) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setName(parsed.name || '');
          setAmount(parsed.amount || 0);
          setNote(parsed.note || '');
        } catch (e) {}
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError("Proof photo exceeds 5MB limit.");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setItemImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setItemImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0) {
      setError("Verify entry details.");
      return;
    }
    
    const item: PurchaseItem = {
      id: initialData?.id || `I-${Date.now()}`,
      name: name.trim(),
      amount: Number(amount),
      date,
      note,
      attachment: itemImage ? {
        id: initialData?.attachment?.id || `A-I-${Date.now()}`,
        name: `Asset: ${name}`,
        data: itemImage,
        type: 'image',
      } : undefined
    };

    onSubmit(item);
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-md" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card w-full max-w-lg rounded-[40px] overflow-hidden border border-white/60 shadow-2xl relative z-10 bg-white"
      >
        <div className="p-8 border-b border-white/20 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-jua text-[#333]">{initialData ? 'Refine Asset' : 'Declare Asset'}</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Registry Protocol</p>
          </div>
          <div className="flex items-center space-x-2">
            {!initialData && (name || amount > 0) && (
              <button type="button" onClick={resetForm} className="p-2 text-gray-300 hover:text-red-400 active-scale"><RotateCcw className="w-4 h-4" /></button>
            )}
            <button type="button" onClick={onClose} className="p-2 hover:bg-white rounded-full active-scale transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block px-1">Asset Name</label>
            <input required type="text" placeholder="Artifact Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block px-1">Valuation (RM)</label>
              <input required type="number" step="0.01" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none font-jua" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block px-1">Date</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block px-1">Annotation</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notes..." className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-4 text-xs focus:outline-none min-h-[80px]" />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block px-1">Evidence Photo</label>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <div 
              onClick={() => !itemImage && fileInputRef.current?.click()} 
              className={`w-full h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all relative group overflow-hidden ${itemImage ? 'border-transparent' : 'border-gray-100 hover:border-[#B8A17D]/30 hover:bg-[#B8A17D]/5 cursor-pointer'}`}
            >
              {itemImage ? (
                <>
                  <img src={itemImage} className="w-full h-full object-cover" />
                  <button onClick={handleRemoveImage} className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <ImageIcon className="w-6 h-6 text-gray-300 mb-2 group-hover:text-[#B8A17D]" />
                  <span className="text-[9px] uppercase font-bold text-gray-400">Click to upload artifact image</span>
                </>
              )}
            </div>
            {error && <p className="text-[10px] text-red-400 mt-2 flex items-center font-bold uppercase"><AlertCircle className="w-3 h-3 mr-1"/> {error}</p>}
          </div>

          <button type="submit" className="w-full bg-[#1A1A1A] text-white py-5 rounded-[24px] font-bold text-xs uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all active-scale">Confirm Archive</button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddItemModal;
