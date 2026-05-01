'use client';

import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, MessageSquare, Zap } from 'lucide-react';

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
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-green-400 bg-green-500/10 border-green-500/20',
};

const investigationSteps = [
  { number: 1, title: 'Alert Detected', icon: AlertTriangle },
  { number: 2, title: 'Analyzing...', icon: Zap },
  { number: 3, title: 'Review Details', icon: CheckCircle2 },
];

// Generate smart threat explanations based on alert features
const getThreatExplanation = (alert: Alert): string[] => {
  const explanations: string[] = [];
  
  if (alert.sourceBytes > 10000) {
    explanations.push(`Unusually high source bytes (${alert.sourceBytes.toLocaleString()}) may indicate data exfiltration or malware communication`);
  }
  if (alert.destBytes > 10000) {
    explanations.push(`High destination bytes (${alert.destBytes.toLocaleString()}) could indicate malware download or command payload delivery`);
  }
  if (alert.state === 'CON' && alert.duration < 0.1) {
    explanations.push('Short-lived connection with CON state suggests reconnaissance scanning');
  }
  if (alert.service === 'INT') {
    explanations.push('INT service traffic is unusual and often associated with system exploitation');
  }
  if (alert.duration > 100) {
    explanations.push(`Extended connection duration (${alert.duration.toFixed(1)}s) may indicate persistence or data exfiltration`);
  }
  if (alert.riskLevel === 'high' && alert.confidence > 0.85) {
    explanations.push(`Model confidence at ${(alert.confidence * 100).toFixed(0)}% indicates strong threat indicators across multiple features`);
  }
  
  return explanations.length > 0 ? explanations : ['Traffic pattern matches known attack signatures in the training dataset'];
};

export default function AlertPanel({ alert, onClose }: AlertPanelProps) {
  const threatExplanations = getThreatExplanation(alert);
  const avgFeatureValue = alert.topFeatures.length > 0 
    ? alert.topFeatures.reduce((sum, f) => sum + f.value, 0) / alert.topFeatures.length 
    : 0;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="h-full bg-gradient-to-b from-dark-surface/60 to-dark-surface/40 backdrop-blur-xs border border-dark-border rounded-xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-dark-border flex items-center justify-between bg-dark-surface/80">
        <div>
          <h3 className="font-semibold text-white">Investigation Panel</h3>
          <p className="text-xs text-dark-text/60 mt-1">Alert ID: {alert.id.slice(0, 8)}...</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-red-400" />
        </motion.button>
      </div>

      {/* Investigation Progress */}
      <div className="px-4 py-3 bg-dark-surface/30 border-b border-dark-border flex justify-between items-center">
        {investigationSteps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === 2;
          return (
            <motion.div
              key={idx}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-red-500/30 border border-red-400' : 'bg-dark-surface/50 border border-dark-border/50'
                }`}
                animate={isActive ? { scale: [1, 1.1, 1], boxShadow: ['0 0 0px rgba(239,68,68,0)', '0 0 15px rgba(239,68,68,0.5)', '0 0 0px rgba(239,68,68,0)'] } : {}}
                transition={isActive ? { duration: 2, repeat: Infinity } : {}}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-dark-text/40'}`} />
              </motion.div>
              <p className={`text-xs font-medium whitespace-nowrap ${isActive ? 'text-white' : 'text-dark-text/60'}`}>
                {step.title}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Risk Assessment */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-3 rounded-lg border-2 ${riskColors[alert.riskLevel]}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">{alert.riskLevel.toUpperCase()} RISK</div>
                <div className="text-xs opacity-80">{alert.title}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xl font-bold">{(alert.confidence * 100).toFixed(0)}%</div>
                <div className="text-xs opacity-80">confidence</div>
              </div>
            </div>
          </motion.div>

          {/* Why This is Suspicious */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Why This Is Suspicious
            </h4>
            <div className="space-y-2">
              {threatExplanations.map((explanation, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="flex gap-3 p-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded text-sm text-dark-text/90"
                >
                  <span className="text-yellow-400 flex-shrink-0 mt-0.5">⚠</span>
                  <span>{explanation}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Network Behavior */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              Network Behavior
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Duration', value: `${alert.duration.toFixed(6)}s`, icon: '⏱' },
                { label: 'Source Bytes', value: alert.sourceBytes.toLocaleString(), icon: '📤' },
                { label: 'Dest Bytes', value: alert.destBytes.toLocaleString(), icon: '📥' },
                { label: 'Service', value: alert.service, icon: '🔌' },
                { label: 'State', value: alert.state, icon: '🔗' },
                { label: 'Timestamp', value: new Date(alert.timestamp).toLocaleTimeString(), icon: '🕐' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.03 }}
                  className="p-2 bg-dark-surface/50 rounded border border-dark-border/30 hover:border-cyan-500/30 transition-all"
                >
                  <p className="text-xs text-dark-text/60 flex items-center gap-1">
                    <span>{item.icon}</span>
                    {item.label}
                  </p>
                  <p className="text-sm font-mono text-cyan-400 font-semibold">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* SHAP Feature Importance - Visual */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Feature Importance (SHAP)
            </h4>
            <div className="space-y-3">
              {alert.topFeatures.slice(0, 5).map((feature, i) => {
                const isIncreasing = feature.direction === 'up';
                const maxValue = Math.max(...alert.topFeatures.map(f => f.value));
                const barWidth = (feature.value / maxValue) * 100;
                
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isIncreasing ? (
                          <TrendingUp className="w-4 h-4 text-red-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-400" />
                        )}
                        <span className="text-sm font-mono font-semibold text-white">{feature.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${isIncreasing ? 'text-red-400' : 'text-green-400'}`}>
                        {(feature.value * 100).toFixed(1)}%
                      </span>
                    </div>
                    <motion.div
                      className="h-2 bg-dark-surface rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 0.38 + i * 0.06, duration: 0.5 }}
                    >
                      <motion.div
                        className={`h-full rounded-full ${
                          isIncreasing
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : 'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ delay: 0.4 + i * 0.06, duration: 0.6 }}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
            <p className="text-xs text-purple-400/70 mt-3 p-2 bg-purple-500/5 rounded border border-purple-500/20">
              {alert.riskLevel === 'high' 
                ? '🔴 Multiple features strongly indicate threat activity'
                : alert.riskLevel === 'medium'
                ? '🟡 Moderate threat indicators detected'
                : '🟢 Minimal threat indicators but warrants review'}
            </p>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-3 bg-blue-500/10 border border-blue-500/20 rounded"
          >
            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Next Step
            </h4>
            <p className="text-sm text-dark-text/80">
              Use the Threat Intelligence chat to ask questions about this alert or request specific remediation steps.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
