'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { useState } from 'react';

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
  high: { 
    bg: 'bg-red-950/30', 
    border: 'border-red-500/40', 
    badge: 'bg-red-500/30 text-red-300',
    text: 'text-red-400',
    hover: 'hover:bg-red-950/50 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/20'
  },
  medium: { 
    bg: 'bg-amber-950/30', 
    border: 'border-amber-500/40', 
    badge: 'bg-amber-500/30 text-amber-300',
    text: 'text-amber-400',
    hover: 'hover:bg-amber-950/50 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/20'
  },
  low: { 
    bg: 'bg-green-950/30', 
    border: 'border-green-500/40', 
    badge: 'bg-green-500/30 text-green-300',
    text: 'text-green-400',
    hover: 'hover:bg-green-950/50 hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/20'
  },
};

const riskIcons = {
  high: AlertTriangle,
  medium: AlertTriangle,
  low: CheckCircle,
};

export default function AlertCard({ alert, isSelected }: AlertCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = riskColors[alert.riskLevel];
  const RiskIcon = riskIcons[alert.riskLevel];
  
  const topFeature = alert.topFeatures?.[0];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${colors.bg} ${colors.border} ${colors.hover} ${
        isSelected ? `ring-2 ring-offset-1 ring-offset-dark-background ring-${alert.riskLevel === 'high' ? 'red' : alert.riskLevel === 'medium' ? 'amber' : 'green'}-500/60 shadow-2xl shadow-${alert.riskLevel === 'high' ? 'red' : alert.riskLevel === 'medium' ? 'amber' : 'green'}-500/30` : ''
      }`}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          layoutId="selectedBorder"
          className="absolute inset-0 rounded-lg border-2 border-transparent pointer-events-none"
          style={{
            borderImage: alert.riskLevel === 'high' 
              ? 'linear-gradient(135deg, #f87171, #dc2626) 1'
              : alert.riskLevel === 'medium'
              ? 'linear-gradient(135deg, #fbbf24, #d97706) 1'
              : 'linear-gradient(135deg, #4ade80, #22c55e) 1'
          }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Risk Icon with Pulse Animation */}
        <motion.div 
          className="flex-shrink-0 mt-1"
          animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
          transition={isSelected ? { duration: 2, repeat: Infinity } : {}}
        >
          <RiskIcon className={`w-5 h-5 ${colors.text}`} />
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* Title and Risk Badge */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-white truncate">{alert.title}</h4>
            <motion.span 
              className={`text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${colors.badge}`}
              animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
              transition={isSelected ? { duration: 2, repeat: Infinity } : {}}
            >
              {alert.riskLevel.toUpperCase()}
            </motion.span>
          </div>

          {/* Network Details */}
          <p className="text-xs text-dark-text/70 mb-2.5 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
            {alert.service} • {alert.state} • {alert.duration.toFixed(4)}s
          </p>

          {/* Confidence Bar */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-dark-text/80">Confidence</span>
            <div className="flex-1 h-2 bg-dark-surface/50 rounded-full overflow-hidden border border-dark-border/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${alert.confidence * 100}%` }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  alert.riskLevel === 'high'
                    ? 'bg-gradient-to-r from-red-600/80 to-red-500'
                    : alert.riskLevel === 'medium'
                    ? 'bg-gradient-to-r from-amber-600/80 to-amber-500'
                    : 'bg-gradient-to-r from-green-600/80 to-green-500'
                } shadow-lg`}
              />
            </div>
            <span className={`text-xs font-bold min-w-fit ${colors.text}`}>{(alert.confidence * 100).toFixed(0)}%</span>
          </div>

          {/* Top Feature Preview - Show on hover/selected */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={isHovered || isSelected ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-dark-text/70 flex items-center gap-1 mb-1 overflow-hidden"
          >
            {topFeature && (
              <>
                <TrendingUp className="w-3 h-3 text-yellow-400" />
                <span>Top: <span className="font-mono font-semibold text-yellow-400">{topFeature.name}</span></span>
              </>
            )}
          </motion.div>

          {/* Data Transfer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isHovered || isSelected ? { opacity: 1 } : { opacity: 0 }}
            className="text-xs text-dark-text/60 pt-1.5 border-t border-dark-border/20"
          >
            <div className="flex justify-between gap-2 mt-1">
              <span>📤 {(alert.sourceBytes / 1024).toFixed(1)}KB</span>
              <span>📥 {(alert.destBytes / 1024).toFixed(1)}KB</span>
            </div>
          </motion.div>
        </div>

        {/* Clickable Indicator Arrow */}
        <motion.div
          animate={isHovered ? { x: 4 } : { x: 0 }}
          className={`flex-shrink-0 ${colors.text} opacity-0 ${isHovered ? 'opacity-100' : ''} transition-opacity`}
        >
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </div>
    </motion.div>
  );
}
