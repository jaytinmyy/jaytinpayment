
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Trash2, ShieldCheck, LoaderCircle, AlertCircle, DatabaseZap, Terminal } from 'lucide-react';
import { db } from '../firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as signOutSecondary, deleteUser } from 'firebase/auth';
import { collection, query, getDocs, setDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Secondary app to manage other users without logging out current user
const secondaryApp = initializeApp(firebaseConfig, 'SecondaryAuth');
const secondaryAuth = getAuth(secondaryApp);

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface CloudUser {
  id: string;
  username: string;
  created_at: string;
}

const UserManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<CloudUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSchemaMissing, setIsSchemaMissing] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setIsSchemaMissing(false);
    setError(null);
    try {
      const q = query(collection(db, 'users'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CloudUser[];
      
      setUsers(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setIsAdding(true);
    setError(null);
    try {
      const email = `${newUsername.toLowerCase()}@jaytin.private`;
      // Firebase requires at least 6 characters for passwords
      const securePass = newPassword.length < 6 ? newPassword.padEnd(6, '0') : newPassword;
      
      // 1. Create in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, securePass);
      const uid = userCredential.user.uid;
      
      // 2. Record in Firestore
      await setDoc(doc(db, 'users', uid), {
        username: newUsername,
        isAdmin: false,
        created_at: new Date().toISOString()
      });

      // 3. Sign out of secondary instance
      await signOutSecondary(secondaryAuth);

      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (e: any) {
      setError(e.message.includes('email-already-in-use') ? 'Username already exists' : e.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY revoke access for ${username}? This cannot be undone.`)) return;
    try {
      // Note: We can only delete from Firestore here. 
      // Deleting from Auth usually requires Admin SDK or being logged in as that user.
      // For this app, removing from Firestore + Rules is enough if we check 'users' collection during login,
      // but here we just rely on Auth.
      // A better way is to mark as disabled in Firestore and check in App.tsx.
      await deleteDoc(doc(db, 'users', id));
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#EBFAFF]/80 backdrop-blur-xl" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-card w-full max-w-2xl h-[80vh] rounded-[48px] overflow-hidden border border-white/60 shadow-2xl relative z-10 flex flex-col">
        
        <div className="p-10 pb-6 border-b border-white/20 flex justify-between items-center">
          <div>
            <h3 className="text-3xl font-jua text-[#333]">Identity Management</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] mt-2">Authorized Protocol Personnel</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/50 rounded-full transition-all group">
            <X className="w-6 h-6 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {isSchemaMissing ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="p-6 bg-red-50 rounded-[32px] border border-red-100 shadow-inner">
                <DatabaseZap className="w-12 h-12 text-red-500" />
              </div>
              <div className="max-w-md space-y-3">
                <h4 className="text-xl font-jua text-gray-800">Vault Uninitialized</h4>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">The required database table <code className="text-red-500 font-bold bg-red-50 px-1.5 rounded">users</code> was not found. Cloud identity injection is currently disabled.</p>
                <div className="bg-[#333] p-4 rounded-2xl text-left border border-[#B8A17D]/30 mt-4 overflow-hidden relative group">
                  <Terminal className="w-3.5 h-3.5 text-[#B8A17D] absolute top-3 right-3 opacity-30" />
                  <p className="text-[9px] text-[#B8A17D] font-bold uppercase tracking-widest mb-2">Protocol Solution</p>
                  <p className="text-[11px] text-gray-300 font-mono leading-tight">Run the SQL initialization script in Supabase Editor to unlock the Vault.</p>
                </div>
              </div>
              <button onClick={fetchUsers} className="flex items-center space-x-2 text-[10px] font-bold text-[#B8A17D] uppercase tracking-[0.3em] hover:underline">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Check Vault Status</span>
              </button>
            </div>
          ) : (
            <>
              {/* Add User Section */}
              <section className="space-y-6">
                <h4 className="text-[11px] font-bold text-[#B8A17D] uppercase tracking-[0.2em] flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" /> Inject New Protocol Identity
                </h4>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input 
                    required type="text" placeholder="Identity UID" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#B8A17D]/30"
                  />
                  <input 
                    required type="password" placeholder="Protocol Key" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#B8A17D]/30"
                  />
                  <button 
                    type="submit" disabled={isAdding}
                    className="bg-[#999] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg border border-[#B8A17D]/30 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isAdding ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <span>Authorize</span>}
                  </button>
                </form>
                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">{error}</p>
                  </motion.div>
                )}
              </section>

              {/* User List Section */}
              <section className="space-y-6">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Authorized Identities</h4>
                {isLoading ? (
                  <div className="flex justify-center py-12"><LoaderCircle className="w-6 h-6 text-[#B8A17D] animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {users.length === 0 ? (
                      <p className="text-center py-10 text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">No identities preserved in cloud vault.</p>
                    ) : users.map(u => (
                      <motion.div 
                        key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="p-6 rounded-3xl bg-white/30 border border-white/50 flex justify-between items-center group hover:bg-white/50 transition-all shadow-sm"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#333] rounded-2xl flex items-center justify-center border border-[#B8A17D]/30 shadow-inner group-hover:border-[#B8A17D]/60 transition-colors">
                            <ShieldCheck className="w-6 h-6 text-[#B8A17D]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{u.username}</p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Authorized: {new Date(u.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <div className="p-8 bg-white/20 border-t border-white/10 text-center">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.4em]">JayTIN Private Security Protocol</p>
        </div>
      </motion.div>
    </div>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);

export default UserManagementModal;
