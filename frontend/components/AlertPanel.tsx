'use client';

import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  riskLevel: 'high' | 'medium' | 'low';
  confidence: number;
  duration: number;
  sourceBytes: number;
  destBytes: number;
  service: string;
  state: string;
  topFeatures: Array<{ name: string; value: number; direction: 'up' | 'down' }>;
  reasoning: string[];
  timestamp: string;
}

interface AlertPanelProps {
  alert: Alert;
  onClose: () => void;
}

const riskColors = {
  high: 'text-red-400 bg-red-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  low: 'text-green-400 bg-green-500/10',
};

export default function AlertPanel({ alert, onClose }: AlertPanelProps) {
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="h-full bg-dark-surface/40 backdrop-blur-xs border border-dark-border rounded-xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-dark-border flex items-center justify-between">
        <h3 className="font-semibold text-white">Alert Details</h3>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-1 hover:bg-dark-surface-alt rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-dark-text/60" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Risk Badge */}
          <div className={`px-3 py-2 rounded-lg font-medium text-sm w-fit ${riskColors[alert.riskLevel]}`}>
            {alert.riskLevel.toUpperCase()} RISK - {(alert.confidence * 100).toFixed(0)}%
          </div>

          {/* Observed Behavior */}
          <div>
            <h4 className="text-xs font-semibold text-dark-text/80 uppercase tracking-wider mb-2">
              Observed Behavior
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-dark-surface/50 rounded border border-dark-border/50">
                <span className="text-dark-text/70">Duration</span>
                <span className="text-white font-mono">{alert.duration.toFixed(6)}s</span>
              </div>
              <div className="flex justify-between p-2 bg-dark-surface/50 rounded border border-dark-border/50">
                <span className="text-dark-text/70">Source Bytes</span>
                <span className="text-white font-mono">{alert.sourceBytes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-dark-surface/50 rounded border border-dark-border/50">
                <span className="text-dark-text/70">Dest Bytes</span>
                <span className="text-white font-mono">{alert.destBytes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-dark-surface/50 rounded border border-dark-border/50">
                <span className="text-dark-text/70">Service</span>
                <span className="text-white font-mono">{alert.service}</span>
              </div>
              <div className="flex justify-between p-2 bg-dark-surface/50 rounded border border-dark-border/50">
                <span className="text-dark-text/70">State</span>
                <span className="text-white font-mono">{alert.state}</span>
              </div>
            </div>
          </div>

          {/* SHAP Features */}
          <div>
            <h4 className="text-xs font-semibold text-dark-text/80 uppercase tracking-wider mb-2">
              Model Explanation (SHAP)
            </h4>
            <div className="space-y-2">
              {alert.topFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2 p-2 bg-dark-surface/50 rounded border border-dark-border/50"
                >
                  {feature.direction === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-mono text-dark-text/70">{feature.name}</p>
                    <p className="text-xs font-semibold text-white">{feature.value.toFixed(4)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Analyst Reasoning */}
          <div>
            <h4 className="text-xs font-semibold text-dark-text/80 uppercase tracking-wider mb-2">
              SOC Analyst Reasoning
            </h4>
            <div className="space-y-2">
              {alert.reasoning.map((reason, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-2 text-xs p-2 bg-dark-surface/50 rounded border border-dark-border/50"
                >
                  <span className="text-red-400 flex-shrink-0">•</span>
                  <span className="text-dark-text/80">{reason}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
