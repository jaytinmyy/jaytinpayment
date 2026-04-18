
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, User, AlertCircle, ChevronRight, LoaderCircle } from 'lucide-react';

interface Props {
  onLogin: (user: string, pass: string) => Promise<boolean> | boolean;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(false);
    
    try {
      const success = await onLogin(user, pass);
      if (!success) {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#EBFAFF]">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="glass-card w-full max-w-[440px] rounded-[48px] p-12 border border-white/60 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#B8A17D]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="text-center mb-12 relative">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-white/40 rounded-3xl mx-auto flex items-center justify-center mb-6 border border-white/60 shadow-inner"
          >
            <ShieldCheck className="w-10 h-10 text-[#B8A17D]" />
          </motion.div>
          <h1 className="text-4xl font-jua text-[#333] mb-2 tracking-tight">JayTIN TEAM</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">Vault Access Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Identity UID</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#B8A17D] transition-colors" />
              <input 
                required
                disabled={isAuthenticating}
                type="text" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Cloud Identifier"
                className="w-full bg-white/40 border border-white/30 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#B8A17D]/30 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Protocol Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#B8A17D] transition-colors" />
              <input 
                required
                disabled={isAuthenticating}
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/40 border border-white/30 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#B8A17D]/30 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 text-red-500 text-[10px] font-bold uppercase tracking-widest justify-center"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Authorization Rejected</span>
            </motion.div>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isAuthenticating}
            type="submit"
            className="w-full bg-[#999] text-white py-5 rounded-[24px] font-bold text-xs uppercase tracking-[0.4em] shadow-xl border border-[#B8A17D]/30 gold-glow flex items-center justify-center space-x-2 group disabled:opacity-70"
          >
            {isAuthenticating ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Handshake Protocol</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            Private Financial System • Authorized Use Only
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
