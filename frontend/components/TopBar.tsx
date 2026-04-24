'use client';

import { Upload, Bell, Search, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopBarProps {
  onUploadClick: () => void;
  onLogout: () => void;
}

export default function TopBar({ onUploadClick, onLogout }: TopBarProps) {
  const handleUploadClick = () => {
    console.log('🔴 [TopBar] Upload button clicked');
    onUploadClick();
  };

  const handleLogoutClick = () => {
    console.log('🔴 [TopBar] Logout button clicked');
    onLogout();
  };

  return (
    <header className="bg-dark-surface border-b border-dark-border px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-white">Threat Detection Dashboard</h2>
        <p className="text-sm text-dark-text/60 mt-1">Real-time monitoring and analysis</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text/40" />
          <input
            type="text"
            placeholder="Search alerts..."
            className="pl-10 pr-4 py-2 bg-dark-surface-alt border border-dark-border rounded-lg text-sm text-dark-text placeholder:text-dark-text/40 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-dark-surface-alt transition-colors relative"
        >
          <Bell className="w-5 h-5 text-dark-text/80" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </motion.button>

        {/* Upload Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleUploadClick}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-red-500/20 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </motion.button>

        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogoutClick}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface-alt border border-dark-border rounded-lg text-dark-text hover:bg-dark-surface hover:border-dark-text/40 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Clear</span>
        </motion.button>
      </div>
    </header>
  );
}
