'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface AIResponseBlockProps {
  response: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
  title?: string;
}

export default function AIResponseBlock({ 
  response, 
  isLoading = false, 
  icon,
  title = '🤖 AI Analysis'
}: AIResponseBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mt-2 p-3 rounded-lg bg-gradient-to-br from-blue-950/40 to-blue-950/20 border border-blue-500/30 backdrop-blur-sm"
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        {icon || <Sparkles className="w-4 h-4 text-blue-400" />}
        <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
          {title}
        </span>
      </div>

      {/* Response text with typing effect */}
      {isLoading ? (
        <div className="flex gap-1.5 items-center">
          <div className="text-xs text-dark-text/70">Analyzing...</div>
          <motion.div
            className="flex gap-1"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="w-1 h-1 rounded-full bg-blue-400"></span>
            <span className="w-1 h-1 rounded-full bg-blue-400"></span>
            <span className="w-1 h-1 rounded-full bg-blue-400"></span>
          </motion.div>
        </div>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-xs text-dark-text/85 leading-relaxed"
        >
          {response}
        </motion.p>
      )}
    </motion.div>
  );
}
