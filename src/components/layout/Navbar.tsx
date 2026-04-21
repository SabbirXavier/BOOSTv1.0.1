import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { LayoutDashboard, LogOut, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { db, auth } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';

export default function Navbar() {
  const [platformName, setPlatformName] = useState('Boost');
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    const unsubSettings = onSnapshot(doc(db, 'settings', 'platform'), (snap) => {
      if (snap.exists()) setPlatformName(snap.data().platformName);
    });
    return () => {
      unsubAuth();
      unsubSettings();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        toast.error(`LOGIN BLOCKED: This domain is not authorized in your Firebase console.\n\n1. Go to Google Cloud / Firebase Console\n2. Auth > Settings > Authorized Domains\n3. Add: ${window.location.host}`);
      } else {
        toast.error("Login Error: " + err.message);
      }
    }
  };

  const handleSignOut = () => signOut(auth);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-orange-600/20">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent italic uppercase">
            {platformName}
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
               <Link 
                to="/dashboard" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-orange-400 flex items-center gap-2",
                  isDashboard ? "text-orange-500" : "text-neutral-400"
                )}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <button 
                onClick={handleSignOut}
                className="text-neutral-500 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSignIn}
              className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-neutral-200 transition-colors shadow-lg active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
