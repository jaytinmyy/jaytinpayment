
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  LogOut,
  Users,
  LoaderCircle
} from 'lucide-react';
import { LedgerRecord, DashboardStats, MonthlyTrend } from './types';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import RecordFormModal from './components/RecordFormModal';
import UserManagementModal from './components/UserManagementModal';
import Login from './components/Login';
import { db, auth } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';

const stringifyError = (err: any): string => {
  if (!err) return "Unknown Protocol Error";
  const errMsg = err.message || '';
  if (errMsg.includes('Insufficient permissions')) return "Security Protocol Violation: Access Denied.";
  return String(err);
};

const App: React.FC = () => {
  // 源自 Firebase 的真实认证状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManagingUsers, setIsManagingUsers] = useState(false);
  const [isPublicMode, setIsPublicMode] = useState(() => window.location.hash.startsWith('#/share/'));
  const [publicRecord, setPublicRecord] = useState<LedgerRecord | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);

  // Initialize from localStorage for instant perceived load
  useEffect(() => {
    const saved = localStorage.getItem('jaytin_ledgers');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  // 自动逾期检测逻辑
  const processAutoOverdue = (inputRecords: LedgerRecord[]): LedgerRecord[] => {
    const now = new Date();
    return inputRecords.map(record => {
      if (record.status === 'Settled' || !record.endDate) return record;
      const end = new Date(record.endDate);
      if (end < now && record.paidAmount < record.totalAmount && record.status !== 'Overdue') {
        return { ...record, status: 'Overdue' };
      }
      return record;
    });
  };

  useEffect(() => {
    const handleRoute = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/share/')) {
        const key = hash.replace('#/share/', '');
        if (key && key.length >= 32) {
          setIsPublicMode(true);
          setIsLoading(true);
          try {
            // Track view before fetching
            fetch('/api/track-view', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shareKey: key })
            }).catch(e => console.error("Tracking signal failed", e));

            // Find record by shareKey in the ledgers collection
            const q = query(collection(db, 'ledgers'), where('shareKey', '==', key));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              setPublicRecord(querySnapshot.docs[0].data() as LedgerRecord);
            } else {
              setPublicRecord(null);
            }
          } catch (e) {
            console.error("Vault access failure", e);
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsPublicMode(false);
          setPublicRecord(null);
        }
      } else {
        setIsPublicMode(false);
        setPublicRecord(null);
      }
    };

    handleRoute();
    window.addEventListener('hashchange', handleRoute);
    return () => window.removeEventListener('hashchange', handleRoute);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (!isPublicMode) setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isPublicMode]);

  const fetchFromCloud = async () => {
    if (isPublicMode || !auth.currentUser) {
      if (!isPublicMode) setIsLoading(false);
      return;
    }
    
    try {
      // Remove orderBy to avoid index errors for now, sort locally
      const q = query(
        collection(db, 'ledgers'), 
        where('ownerId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const cloudRecords = processAutoOverdue(
        querySnapshot.docs.map(doc => ({
          ...doc.data() as LedgerRecord,
          id: doc.id // Ensure ID consistency
        }))
      );

      // Sorting locally by updatedAt descending
      cloudRecords.sort((a, b) => {
        const dateA = a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : new Date(a.updatedAt || 0).getTime();
        const dateB = b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : new Date(b.updatedAt || 0).getTime();
        return dateB - dateA;
      });
      
      const localRecordsString = localStorage.getItem('jaytin_ledgers');
      const localRecords = localRecordsString ? JSON.parse(localRecordsString) : [];

      if (cloudRecords.length > 0) {
        setRecords(cloudRecords);
        localStorage.setItem('jaytin_ledgers', JSON.stringify(cloudRecords));
      } else if (localRecords.length > 0) {
        // Cloud is empty but local has data, sync local to cloud
        console.log("Empty vault detected. Migrating local protocols to cloud...");
        syncAllToCloud(localRecords);
      } else {
        setRecords([]);
        localStorage.removeItem('jaytin_ledgers');
      }
    } catch (e: any) {
      console.error(stringifyError(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated === true && !isPublicMode) {
      fetchFromCloud();
    } else if (isAuthenticated === false && !isPublicMode) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isPublicMode]);

  const syncAllToCloud = async (currentRecords: LedgerRecord[]) => {
    if (!auth.currentUser || isPublicMode || currentRecords.length === 0) return;
    setIsSyncing(true);
    try {
      const uid = auth.currentUser.uid;
      const promises = currentRecords.map(r => {
        const ledgerRef = doc(db, 'ledgers', r.id);
        const dataToSave = {
          ...r,
          ownerId: uid,
          updatedAt: serverTimestamp()
        };
        return setDoc(ledgerRef, dataToSave, { merge: true });
      });
      await Promise.all(promises);
    } catch (e: any) {
      console.error("Batch Protocol Sync Failure", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncOneToCloud = async (record: LedgerRecord) => {
    if (!auth.currentUser || isPublicMode) return;
    setIsSyncing(true);
    try {
      const ledgerRef = doc(db, 'ledgers', record.id);
      await setDoc(ledgerRef, {
        ...record,
        ownerId: auth.currentUser!.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e: any) {
      console.error("Single Protocol Update Failure", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRecordUpdate = (newRecords: LedgerRecord[], updatedRecord?: LedgerRecord) => {
    const processed = processAutoOverdue(newRecords);
    // Ensure all records in the list reflect the ownership
    const withOwnership = processed.map(r => ({
      ...r,
      ownerId: auth.currentUser?.uid || r.ownerId
    }));
    
    setRecords(withOwnership);
    localStorage.setItem('jaytin_ledgers', JSON.stringify(withOwnership));
    
    if (updatedRecord) {
      const recordToSync = withOwnership.find(r => r.id === updatedRecord.id) || updatedRecord;
      syncOneToCloud(recordToSync);
    } else {
      if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = window.setTimeout(() => {
        syncAllToCloud(withOwnership);
      }, 1000);
    }
  };

  const stats: DashboardStats = useMemo(() => {
    const totalValuation = records.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalPaid = records.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const totalOutstanding = totalValuation - totalPaid;
    
    const now = new Date();
    const collectedThisMonth = records.reduce((acc, curr) => 
      acc + (curr.payments || []).reduce((pAcc, p) => {
        const pDate = new Date(p.date);
        return (pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear()) ? pAcc + p.amount : pAcc;
      }, 0)
    , 0);

    const overdueAmount = records
      .filter(r => r.status === 'Overdue')
      .reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);

    const monthlyTrend: MonthlyTrend[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const mLabel = d.toLocaleString('en-US', { month: 'short' });
      const mValue = records.reduce((acc, curr) => 
        acc + (curr.payments || []).reduce((pAcc, p) => {
          const pDate = new Date(p.date);
          return (pDate.getMonth() === d.getMonth() && pDate.getFullYear() === d.getFullYear()) ? pAcc + p.amount : pAcc;
        }, 0)
      , 0);
      monthlyTrend.push({ month: mLabel, amount: mValue });
    }

    return {
      totalValuation,
      totalOutstanding,
      activeCustomers: records.filter(r => r.status !== 'Settled').length,
      collectedThisMonth,
      collectionRate: totalValuation > 0 ? (totalPaid / totalValuation) * 100 : 0,
      overdueAmount,
      monthlyTrend
    };
  }, [records]);

  const handleLogin = async (user: string, pass: string) => {
    try {
      // Map UID to a fake email for Firebase Auth
      const email = `${user.toLowerCase()}@jaytin.private`;
      // Firebase requires at least 6 characters for passwords
      const securePass = pass.length < 6 ? pass.padEnd(6, '0') : pass;
      
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, securePass);
        // Ensure user '1' has isAdmin set if it's missing (legacy fix)
        if (user === '1') {
          await setDoc(doc(db, 'users', userCred.user.uid), { isAdmin: true }, { merge: true });
        }
        return true;
      } catch (e: any) {
        // Auto-bootstrap account '1' if not found
        if ((e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') && user === '1') {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, securePass);
            const uid = userCredential.user.uid;
            await setDoc(doc(db, 'users', uid), {
              username: user,
              isAdmin: true,
              created_at: new Date().toISOString()
            });
            return true;
          } catch (createErr: any) {
            console.error("Bootstrap attempt failed", createErr);
          }
        }
        throw e;
      }
    } catch (e) { 
      console.error("Login failure", e);
      return false; 
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const next = records.filter(r => r.id !== id);
    setRecords(next);
    localStorage.setItem('jaytin_ledgers', JSON.stringify(next));
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'ledgers', id));
      } catch (e) {
        console.error("Delete failure", e);
      }
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#EBFAFF]"><LoaderCircle className="w-10 h-10 text-[#B8A17D] animate-spin" /></div>;

  if (isPublicMode && publicRecord) {
    return (
      <div className="min-h-screen bg-[#EBFAFF]">
        <CustomerDetail record={publicRecord} isViewOnly={true} onClose={() => { window.location.hash = ''; }} onUpdateRecord={() => {}} stats={stats} />
      </div>
    );
  }

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen px-4 py-8 md:px-12 md:py-12 flex flex-col items-center bg-[#EBFAFF]">
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 bg-[#333]/80 backdrop-blur-md rounded-full border border-white/10 shadow-2xl flex items-center space-x-2"
          >
            <LoaderCircle className="w-3.5 h-3.5 text-[#B8A17D] animate-spin" />
            <span className="text-[10px] text-white font-bold uppercase tracking-[0.2em]">Synchronizing</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="w-full max-w-7xl flex flex-col space-y-6 mb-12">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-jua text-[#333]">JayTIN TEAM</h1>
          <div className="flex items-center space-x-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsManagingUsers(true)} className="p-2.5 text-[#B8A17D] bg-white rounded-xl border border-white active-scale shadow-sm"><Users className="w-5 h-5" /></motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={async () => { await signOut(auth); setIsAuthenticated(false); localStorage.removeItem('jaytin_auth'); }} className="p-3 text-gray-400 hover:text-red-400 transition-all active-scale"><LogOut className="w-5 h-5" /></motion.button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search protocol..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-5 py-3.5 bg-white/50 border border-white/40 rounded-2xl text-sm" />
          </div>
          <button onClick={() => setIsAddingRecord(true)} className="flex items-center justify-center space-x-3 bg-[#333] text-white px-8 py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest active-scale">
            <Plus className="w-4.5 h-4.5" /><span>New Registry</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl space-y-10">
        <Dashboard stats={stats} />
        <CustomerList records={records.filter(r => r.userName.toLowerCase().includes(searchQuery.toLowerCase()))} onSelect={setSelectedRecordId} selectedId={selectedRecordId} />
      </main>

      <AnimatePresence>
        {selectedRecordId && records.find(r => r.id === selectedRecordId) && (
          <CustomerDetail 
            record={records.find(r => r.id === selectedRecordId)!} 
            onClose={() => setSelectedRecordId(null)}
            onUpdateRecord={(updated) => {
              const next = records.map(r => r.id === updated.id ? updated : r);
              handleRecordUpdate(next, updated);
            }}
            onDeleteRecord={handleDeleteRecord}
            stats={stats}
            allRecords={records}
          />
        )}
      </AnimatePresence>

      <RecordFormModal isOpen={isAddingRecord} onClose={() => setIsAddingRecord(false)} onSave={(newRecord) => {
        handleRecordUpdate([newRecord, ...records], newRecord);
        setIsAddingRecord(false);
      }} />
      <UserManagementModal isOpen={isManagingUsers} onClose={() => setIsManagingUsers(false)} />
    </div>
  );
};

export default App;
