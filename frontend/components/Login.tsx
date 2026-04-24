'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export default function LoginComponent() {
  const [username, setUsername] = useState('analyst');
  const [password, setPassword] = useState('analyst123');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      console.log('🔐 [Login] Submitting login form');
      await login(username, password);
    } catch (err) {
      console.error('❌ [Login] Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-red-600/10" />

      {/* Content */}
      <div className="relative w-full flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center"
            >
              <Lock className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">ThreatXAI</h1>
            <p className="text-sm text-dark-text/60">Explainable AI Threat Detection Engine</p>
          </div>

          {/* Login Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 mb-6"
          >
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-dark-text mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white placeholder:text-dark-text/40 focus:outline-none focus:border-red-500/50 disabled:opacity-50 transition-colors"
              />
              <p className="text-xs text-dark-text/40 mt-1">Demo: admin, analyst, or viewer</p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-text mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white placeholder:text-dark-text/40 focus:outline-none focus:border-red-500/50 disabled:opacity-50 transition-colors"
              />
              <p className="text-xs text-dark-text/40 mt-1">Demo passwords: admin123, analyst123, viewer123</p>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-4 h-4 border-2 border-transparent border-t-white rounded-full"
                  />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Demo Credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-dark-surface/40 border border-dark-border rounded-lg"
          >
            <h3 className="text-sm font-semibold text-white mb-3">Demo Accounts:</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-dark-text">Admin</span>
                <code className="text-red-400">admin / admin123</code>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text">Analyst</span>
                <code className="text-red-400">analyst / analyst123</code>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text">Viewer</span>
                <code className="text-red-400">viewer / viewer123</code>
              </div>
            </div>
          </motion.div>

          {/* Info */}
          <p className="text-center text-xs text-dark-text/40 mt-6">
            Role-Based Access Control (RBAC) enabled
          </p>
        </motion.div>
      </div>
    </div>
  );
}
