'use client';

import { Shield, Home, BarChart3, Settings, FileText, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/authContext';

const navItems = [
  { icon: Home, label: 'Dashboard' },
  { icon: Shield, label: 'Threats' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: FileText, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
  activePage?: string;
}

export default function Sidebar({ onLogout, onNavigate, activePage = 'dashboard' }: SidebarProps) {
  const { logout } = useAuth();

  const handleNavClick = (label: string) => {
    const page = label.toLowerCase();
    console.log(`🔵 [Sidebar] Navigating to: ${page}`);
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const handleLogout = () => {
    console.log('🔴 [Sidebar] Logout clicked');
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  return (
    <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">ThreatXAI</h1>
          <p className="text-xs text-dark-text/60">Detection Engine</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item, i) => {
          const isActive = activePage === item.label.toLowerCase();
          return (
            <motion.button
              key={item.label}
              onClick={() => handleNavClick(item.label)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-red-600/20 text-white border-l-2 border-red-500'
                  : 'text-dark-text/80 hover:text-white hover:bg-dark-surface-alt'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${
                isActive ? 'text-red-500' : 'group-hover:text-red-500'
              }`} />
              <span className="text-sm font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border">
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-dark-text/80 hover:text-white hover:bg-dark-surface-alt transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </motion.button>
      </div>
    </aside>
  );
}
