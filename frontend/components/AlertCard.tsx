'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';

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

interface AlertCardProps {
  alert: Alert;
  isSelected: boolean;
}

const riskColors = {
  high: { bg: 'bg-red-950/20', border: 'border-red-500/30', badge: 'bg-red-500/20 text-red-400' },
  medium: { bg: 'bg-amber-950/20', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-400' },
  low: { bg: 'bg-green-950/20', border: 'border-green-500/30', badge: 'bg-green-500/20 text-green-400' },
};

const riskIcons = {
  high: AlertTriangle,
  medium: AlertTriangle,
  low: CheckCircle,
};

export default function AlertCard({ alert, isSelected }: AlertCardProps) {
  const colors = riskColors[alert.riskLevel];
  const RiskIcon = riskIcons[alert.riskLevel];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${colors.bg} ${colors.border} ${
        isSelected ? 'ring-2 ring-red-500/50 shadow-lg shadow-red-500/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <RiskIcon
            className={`w-5 h-5 ${
              alert.riskLevel === 'high'
                ? 'text-red-400'
                : alert.riskLevel === 'medium'
                ? 'text-amber-400'
                : 'text-green-400'
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white truncate">{alert.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
              {alert.riskLevel.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-dark-text/60 mb-2">
            {alert.service && `Service: ${alert.service}`} • State: {alert.state}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-dark-text/70">Confidence</span>
                <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${alert.confidence * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`h-full rounded-full ${
                      alert.riskLevel === 'high'
                        ? 'bg-gradient-to-r from-red-600 to-red-500'
                        : alert.riskLevel === 'medium'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500'
                        : 'bg-gradient-to-r from-green-600 to-green-500'
                    }`}
                  ></motion.div>
                </div>
              </div>
              <p className="text-xs text-dark-text/50">{(alert.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
