'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useState, memo } from 'react';
import ThreatIntelligenceInline from './ThreatIntelligenceInline';

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
  expandedAlertId?: string | null;
  onSelectAlert?: (alert: Alert) => void;
}

const riskColors = {
  high: { 
    bg: 'bg-gradient-to-br from-red-950/40 to-red-950/20',
    bgHover: 'hover:from-red-950/50 hover:to-red-950/30',
    border: 'border-red-500/40 hover:border-red-500/60',
    badge: 'bg-red-500/30 text-red-300',
    text: 'text-red-400',
    glow: 'shadow-lg shadow-red-500/20 hover:shadow-red-500/30',
    buttonBg: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40',
    ringColor: 'ring-red-500/60'
  },
  medium: { 
    bg: 'bg-gradient-to-br from-amber-950/40 to-amber-950/20',
    bgHover: 'hover:from-amber-950/50 hover:to-amber-950/30',
    border: 'border-amber-500/40 hover:border-amber-500/60',
    badge: 'bg-amber-500/30 text-amber-300',
    text: 'text-amber-400',
    glow: 'shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30',
    buttonBg: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40',
    ringColor: 'ring-amber-500/60'
  },
  low: { 
    bg: 'bg-gradient-to-br from-green-950/40 to-green-950/20',
    bgHover: 'hover:from-green-950/50 hover:to-green-950/30',
    border: 'border-green-500/40 hover:border-green-500/60',
    badge: 'bg-green-500/30 text-green-300',
    text: 'text-green-400',
    glow: 'shadow-lg shadow-green-500/20 hover:shadow-green-500/30',
    buttonBg: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/40',
    ringColor: 'ring-green-500/60'
  },
};

const riskIcons = {
  high: AlertTriangle,
  medium: AlertTriangle,
  low: CheckCircle,
};

function AlertCardComponent({ 
  alert,
  isSelected,
  expandedAlertId,
  onSelectAlert
}: AlertCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = expandedAlertId === alert.id;
  const colors = riskColors[alert.riskLevel];
  const RiskIcon = riskIcons[alert.riskLevel];
  const topFeature = alert.topFeatures?.[0];

  const handleCardClick = () => {
    if (onSelectAlert) onSelectAlert(alert);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -6 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleCardClick}
      className={`relative rounded-xl border-2 cursor-pointer transition-all backdrop-blur-sm overflow-hidden ${colors.bg} ${colors.bgHover} ${colors.border} ${colors.glow} ${
        isSelected 
          ? `ring-2 ring-offset-1 ring-offset-dark-background ${colors.ringColor}` 
          : ''
      }`}
    >
      {/* Premium glassmorphic card content */}
      <motion.div className="p-4">
        <div className="flex items-start gap-3">
          {/* Risk Icon with Glow */}
          <motion.div 
            className="flex-shrink-0 mt-0.5"
            animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
            transition={isSelected ? { duration: 2, repeat: Infinity } : {}}
          >
            <div className={`relative ${colors.text}`}>
              <RiskIcon className="w-5 h-5" />
              {isSelected && (
                <motion.div
                  className={`absolute inset-0 ${colors.text} opacity-30 blur-sm`}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <RiskIcon className="w-5 h-5" />
                </motion.div>
              )}
            </div>
          </motion.div>

          <div className="flex-1 min-w-0">
            {/* Title and Badge */}
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-bold text-white truncate">{alert.title}</h4>
              <motion.span 
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap backdrop-blur-sm ${colors.badge}`}
                animate={isSelected ? { scale: [1, 1.08, 1] } : {}}
                transition={isSelected ? { duration: 2, repeat: Infinity } : {}}
              >
                {alert.riskLevel.toUpperCase()}
              </motion.span>
            </div>

            {/* Network Metadata */}
            <p className="text-xs text-dark-text/70 mb-2 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
              <span className="font-mono">{alert.service}</span>
              <span>•</span>
              <span className="font-mono">{alert.state}</span>
              <span>•</span>
              <span>{alert.duration.toFixed(4)}s</span>
            </p>

            {/* Confidence Bar with Glow */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xs font-semibold text-dark-text/80">Confidence</span>
              <div className="flex-1 h-2 bg-dark-surface/40 rounded-full overflow-hidden border border-dark-border/40 backdrop-blur-xs">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${alert.confidence * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    alert.riskLevel === 'high'
                      ? 'bg-gradient-to-r from-red-600/90 to-red-500 shadow-lg shadow-red-500/40'
                      : alert.riskLevel === 'medium'
                      ? 'bg-gradient-to-r from-amber-600/90 to-amber-500 shadow-lg shadow-amber-500/40'
                      : 'bg-gradient-to-r from-green-600/90 to-green-500 shadow-lg shadow-green-500/40'
                  }`}
                />
              </div>
              <span className={`text-xs font-bold min-w-fit ${colors.text}`}>{(alert.confidence * 100).toFixed(0)}%</span>
            </div>

            {/* Top Feature Hint on hover */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={isHovered && !isExpanded ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-dark-text/70 flex items-center gap-1.5 mb-2 overflow-hidden"
            >
              {topFeature && (
                <>
                  <TrendingUp className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                  <span>Top signal: <span className="font-mono font-semibold text-yellow-400">{topFeature.name}</span></span>
                </>
              )}
            </motion.div>

            {/* Data Transfer Preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isHovered && !isExpanded ? { opacity: 1 } : { opacity: 0 }}
              className="text-xs text-dark-text/60 flex gap-3 pt-2 border-t border-dark-border/20"
            >
              <span>📤 {(alert.sourceBytes / 1024).toFixed(1)}KB sent</span>
              <span>📥 {(alert.destBytes / 1024).toFixed(1)}KB received</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Expandable Inline Threat Intelligence Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-dark-border/40 overflow-hidden"
          >
            <div className="p-4">
              <ThreatIntelligenceInline alert={alert} colors={colors} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders when parent updates
export default memo(AlertCardComponent);
