'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, ArrowRight, TrendingUp, TrendingDown, Zap, BookOpen, Shield } from 'lucide-react';
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
  isExpanded?: boolean;
  onExpand?: (alertId: string) => void;
  onSelectAlert?: (alert: Alert) => void;
}

const riskColors = {
  high: { 
    bg: 'bg-red-950/30', 
    border: 'border-red-500/40', 
    badge: 'bg-red-500/30 text-red-300',
    text: 'text-red-400',
    hover: 'hover:bg-red-950/50 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/20',
    buttonBg: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40'
  },
  medium: { 
    bg: 'bg-amber-950/30', 
    border: 'border-amber-500/40', 
    badge: 'bg-amber-500/30 text-amber-300',
    text: 'text-amber-400',
    hover: 'hover:bg-amber-950/50 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/20',
    buttonBg: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40'
  },
  low: { 
    bg: 'bg-green-950/30', 
    border: 'border-green-500/40', 
    badge: 'bg-green-500/30 text-green-300',
    text: 'text-green-400',
    hover: 'hover:bg-green-950/50 hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/20',
    buttonBg: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/40'
  },
};

const riskIcons = {
  high: AlertTriangle,
  medium: AlertTriangle,
  low: CheckCircle,
};

// Helper: Generate plain English explanation
const generateExplanation = (alert: Alert): string => {
  const riskLabel = alert.riskLevel.toUpperCase();
  let explanation = `This alert is classified as ${riskLabel} risk with ${(alert.confidence * 100).toFixed(0)}% model confidence. `;
  
  const factors: string[] = [];
  
  if (alert.service === 'INT') {
    factors.push('INT service traffic is unusual and often associated with system exploitation');
  }
  
  if (alert.state === 'CON') {
    factors.push('abnormal connection state indicates suspicious handshake behavior');
  }
  
  if (alert.sourceBytes > 50000) {
    factors.push(`unusually high outbound traffic (${(alert.sourceBytes / 1024).toFixed(1)}KB) may indicate data exfiltration`);
  }
  
  if (alert.destBytes > 100000) {
    factors.push(`high inbound traffic (${(alert.destBytes / 1024).toFixed(1)}KB) suggests malware download or C&C communication`);
  }
  
  if (alert.duration < 0.1) {
    factors.push('very short connection duration indicates reconnaissance scanning');
  }
  
  if (factors.length > 0) {
    explanation += `Key indicators: ${factors.join('; ')}.`;
  } else {
    explanation += 'Multiple anomalies detected in traffic pattern match known attack signatures.';
  }
  
  return explanation;
};

// Helper: Generate mitigation steps
const generateMitigation = (alert: Alert): string[] => {
  const steps: string[] = [];
  
  if (alert.riskLevel === 'high') {
    steps.push('🚨 Block source IP at firewall level');
    steps.push('🔍 Perform deep packet inspection on all traffic from source');
    steps.push('🔗 Investigate potential C&C communications');
    steps.push('🛡️ Isolate affected endpoint from production network');
    steps.push('📊 Archive all traffic logs for incident analysis');
  } else if (alert.riskLevel === 'medium') {
    steps.push('⚠️ Monitor source IP for escalation patterns');
    steps.push('🔔 Enable alerting for all traffic from this source');
    steps.push('📋 Review firewall rules for tightening');
    steps.push('🔍 Analyze endpoint logs for suspicious activity');
    steps.push('📝 Document alert for future correlation');
  } else {
    steps.push('✓ Continue routine monitoring');
    steps.push('📊 Log alert for statistical analysis');
    steps.push('🔄 Re-evaluate if pattern repeats');
  }
  
  return steps;
};

export default function AlertCard({ 
  alert, 
  isSelected, 
  isExpanded = false,
  onExpand,
  onSelectAlert
}: AlertCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeSection, setActiveSection] = useState<'explain' | 'why' | 'mitigate' | null>(null);
  const colors = riskColors[alert.riskLevel];
  const RiskIcon = riskIcons[alert.riskLevel];
  
  const topFeature = alert.topFeatures?.[0];

  const handleExpand = (section: 'explain' | 'why' | 'mitigate') => {
    if (isExpanded && activeSection === section) {
      // Collapse if clicking same section
      setActiveSection(null);
    } else {
      // Expand new section
      setActiveSection(section);
      if (onExpand) onExpand(alert.id);
      if (onSelectAlert) onSelectAlert(alert);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${colors.bg} ${colors.border} ${colors.hover} ${
        isSelected ? `ring-2 ring-offset-1 ring-offset-dark-background ring-${alert.riskLevel === 'high' ? 'red' : alert.riskLevel === 'medium' ? 'amber' : 'green'}-500/60 shadow-2xl shadow-${alert.riskLevel === 'high' ? 'red' : alert.riskLevel === 'medium' ? 'amber' : 'green'}-500/30` : ''
      }`}
    >
      {/* Main Card Content */}
      <motion.div className="p-4">
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
            <div className="flex items-center gap-2 mb-3">
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

            {/* Action Buttons */}
            <div className="flex gap-2 mb-2">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpand('explain');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded border transition-colors ${
                  activeSection === 'explain'
                    ? `${colors.buttonBg} text-white`
                    : `${colors.buttonBg} text-dark-text/80`
                }`}
              >
                <Zap className="w-3 h-3 inline mr-1" />
                Explain
              </motion.button>
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpand('why');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded border transition-colors ${
                  activeSection === 'why'
                    ? `${colors.buttonBg} text-white`
                    : `${colors.buttonBg} text-dark-text/80`
                }`}
              >
                <BookOpen className="w-3 h-3 inline mr-1" />
                Why Flagged?
              </motion.button>
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpand('mitigate');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded border transition-colors ${
                  activeSection === 'mitigate'
                    ? `${colors.buttonBg} text-white`
                    : `${colors.buttonBg} text-dark-text/80`
                }`}
              >
                <Shield className="w-3 h-3 inline mr-1" />
                Mitigation
              </motion.button>
            </div>

            {/* Top Feature Preview - Show on hover/selected */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={isHovered && !activeSection ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
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
              animate={isHovered && !activeSection ? { opacity: 1 } : { opacity: 0 }}
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

      {/* Expandable Intelligence Panel */}
      <AnimatePresence>
        {activeSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="border-t border-dark-border/40 bg-dark-surface/50 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Section 1: SHAP Feature Importance */}
              {activeSection === 'explain' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.05 }}
                >
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">SHAP Feature Importance</h5>
                  <div className="space-y-2">
                    {alert.topFeatures.slice(0, 5).map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2"
                      >
                        {feature.direction === 'up' ? (
                          <TrendingUp className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        )}
                        <span className="text-xs font-mono text-dark-text/80 w-24 truncate">{feature.name}</span>
                        <div className="flex-1 h-1.5 bg-dark-background/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(feature.value * 100, 100)}%` }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                            className={`h-full rounded-full ${
                              feature.direction === 'up'
                                ? 'bg-gradient-to-r from-red-600 to-red-500'
                                : 'bg-gradient-to-r from-green-600 to-green-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-bold text-dark-text/70 min-w-fit">{(feature.value * 100).toFixed(0)}%</span>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xs text-dark-text/60 mt-2 italic">
                    {alert.riskLevel === 'high' 
                      ? '🔴 Red features increase threat risk'
                      : alert.riskLevel === 'medium'
                      ? '🟡 Features showing mixed threat patterns'
                      : '🟢 Green features indicate lower threat'}
                  </p>
                </motion.div>
              )}

              {/* Section 2: Plain English Explanation */}
              {activeSection === 'why' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.05 }}
                >
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Why This Is Suspicious</h5>
                  <p className="text-xs text-dark-text/80 leading-relaxed">
                    {generateExplanation(alert)}
                  </p>
                </motion.div>
              )}

              {/* Section 3: Mitigation Steps */}
              {activeSection === 'mitigate' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.05 }}
                >
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Recommended Actions</h5>
                  <div className="space-y-1">
                    {generateMitigation(alert).map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-xs text-dark-text/80 flex gap-2"
                      >
                        <span className="flex-shrink-0">{step.charAt(0)}</span>
                        <span>{step.slice(2)}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
