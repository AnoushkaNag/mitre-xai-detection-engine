'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Feature {
  name: string;
  value: number;
  direction: 'up' | 'down';
}

interface SHAPBarsProps {
  features: Feature[];
  maxFeatures?: number;
}

export default function SHAPBars({ features, maxFeatures = 5 }: SHAPBarsProps) {
  const topFeatures = features.slice(0, maxFeatures);
  const maxValue = Math.max(...topFeatures.map(f => f.value), 0.3);

  return (
    <div className="space-y-2.5">
      {topFeatures.map((feature, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="group"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 w-20">
              {feature.direction === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              )}
              <span className="text-xs font-mono text-dark-text/80 truncate group-hover:text-dark-text/100 transition-colors">
                {feature.name}
              </span>
            </div>
            <span className="text-xs font-bold text-dark-text/70 ml-auto">
              {(feature.value * 100).toFixed(0)}%
            </span>
          </div>

          {/* Animated bar */}
          <div className="h-2 bg-dark-background/60 rounded-full overflow-hidden border border-dark-border/30 group-hover:border-dark-border/50 transition-colors">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((feature.value / maxValue) * 100, 100)}%` }}
              transition={{ delay: i * 0.08 + 0.1, duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full transition-all ${
                feature.direction === 'up'
                  ? 'bg-gradient-to-r from-red-600/90 to-red-500 shadow-lg shadow-red-500/30'
                  : 'bg-gradient-to-r from-green-600/90 to-green-500 shadow-lg shadow-green-500/30'
              }`}
            />
          </div>
        </motion.div>
      ))}

      <div className="mt-3 pt-2 border-t border-dark-border/30 text-xs text-dark-text/60 space-y-1">
        <div>🔴 Red = increases threat likelihood</div>
        <div>🟢 Green = decreases threat likelihood</div>
      </div>
    </div>
  );
}
