'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, BarChart3, Shield, MessageSquare, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import SHAPBars from './SHAPBars';
import AIResponseBlock from './AIResponseBlock';

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

interface ThreatIntelligenceInlineProps {
  alert: Alert;
  colors: any;
}

// Generate AI insights based on alert features
const generateAutoInsight = (alert: Alert): string => {
  let insight = `This alert is classified as ${alert.riskLevel.toUpperCase()} risk with ${(alert.confidence * 100).toFixed(0)}% confidence. `;

  const factors: string[] = [];

  if (alert.sourceBytes > 50000) {
    factors.push(`high source bytes (${(alert.sourceBytes / 1024).toFixed(0)}KB) indicating potential data exfiltration`);
  }

  if (alert.destBytes > 100000) {
    factors.push(`high destination bytes (${(alert.destBytes / 1024).toFixed(0)}KB) suggesting malware download or C&C activity`);
  }

  if (alert.state === 'INT') {
    factors.push('unusual connection state (INT) often linked to protocol exploitation');
  }

  if (alert.service === 'INT' || alert.service === '-') {
    factors.push(`non-standard service (${alert.service}) may indicate port scanning or tunneling`);
  }

  if (alert.duration < 0.1) {
    factors.push('very short duration suggests reconnaissance scanning');
  } else if (alert.duration > 10) {
    factors.push('extended connection duration indicates potential data transfer or persistence');
  }

  if (factors.length > 0) {
    insight += `Key indicators: ${factors.join(', ')}.`;
  } else {
    insight += 'Multiple anomalies detected in traffic patterns match known attack signatures.';
  }

  return insight;
};

// Generate response for specific queries
const generateAIResponse = (alert: Alert, query: string): string => {
  const q = query.toLowerCase();

  if (q.includes('explain') || q.includes('why')) {
    return generateAutoInsight(alert);
  }

  if (q.includes('sbytes') || q.includes('source')) {
    return `Source bytes: ${alert.sourceBytes.toLocaleString()} bytes (${(alert.sourceBytes / 1024).toFixed(1)}KB). ${alert.sourceBytes > 50000 ? 'Unusually high values may indicate data exfiltration or large file transfers.' : 'Within normal range for legitimate traffic.'}`;
  }

  if (q.includes('dbytes') || q.includes('dest')) {
    return `Destination bytes: ${alert.destBytes.toLocaleString()} bytes (${(alert.destBytes / 1024).toFixed(1)}KB). ${alert.destBytes > 100000 ? 'High inbound traffic suggests malware downloads or command payloads.' : 'Typical for normal responses.'}`;
  }

  if (q.includes('duration') || q.includes('time')) {
    return `Connection duration: ${alert.duration.toFixed(4)} seconds. ${alert.duration < 0.1 ? 'Short duration typical of scanning activity.' : alert.duration > 10 ? 'Extended connection suggests data transfer or persistence.' : 'Normal transaction time.'}`;
  }

  if (q.includes('service')) {
    return `Service: ${alert.service || 'unknown'}. ${alert.service === 'INT' ? 'INT service is suspicious and unusual, often associated with exploitation.' : alert.service === '-' ? 'Unknown or non-standard service may indicate tunneling or obfuscation.' : 'Standard service type.'}`;
  }

  if (q.includes('state') || q.includes('conn')) {
    return `Connection state: ${alert.state}. ${alert.state === 'INT' ? 'Abnormal state indicates unusual handshake or protocol violation.' : alert.state === 'CON' ? 'Established connection being actively used.' : 'Connection in transition state.'}`;
  }

  if (q.includes('confidence') || q.includes('certain')) {
    return `Model confidence: ${(alert.confidence * 100).toFixed(0)}%. ${alert.confidence > 0.9 ? 'Very high confidence - strong indicators of threat activity.' : alert.confidence > 0.7 ? 'High confidence - multiple suspicious patterns detected.' : 'Moderate confidence - warrants further investigation.'}`;
  }

  if (q.includes('mitigate') || q.includes('action') || q.includes('fix') || q.includes('block')) {
    if (alert.riskLevel === 'high') {
      return 'RECOMMENDED ACTIONS (HIGH RISK): 1) Block source IP immediately; 2) Enable deep packet inspection; 3) Check for C&C beacons; 4) Isolate affected endpoint; 5) Preserve logs for forensics.';
    } else if (alert.riskLevel === 'medium') {
      return 'RECOMMENDED ACTIONS (MEDIUM RISK): 1) Monitor source for escalation; 2) Enable targeted alerts; 3) Review firewall rules; 4) Check endpoint logs; 5) Document for correlation.';
    } else {
      return 'RECOMMENDED ACTIONS (LOW RISK): 1) Continue routine monitoring; 2) Log for statistical analysis; 3) Re-evaluate if pattern repeats; 4) Update security baselines if needed.';
    }
  }

  if (q.includes('threat') || q.includes('risk')) {
    return generateAutoInsight(alert);
  }

  return `Alert shows ${alert.riskLevel} risk activity with ${(alert.confidence * 100).toFixed(0)}% confidence. Based on source bytes (${(alert.sourceBytes / 1024).toFixed(0)}KB), destination bytes (${(alert.destBytes / 1024).toFixed(0)}KB), and connection state (${alert.state}). Ask specific questions about sbytes, dbytes, duration, service, or mitigation steps.`;
};

export default function ThreatIntelligenceInline({ alert, colors }: ThreatIntelligenceInlineProps) {
  const [expandedView, setExpandedView] = useState<'explain' | 'why' | 'mitigate' | 'chat' | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseType, setResponseType] = useState<'auto' | 'explain' | 'why' | 'mitigate' | 'chat'>('auto');

  const autoInsight = generateAutoInsight(alert);

  const handleQuickAction = (action: 'explain' | 'why' | 'mitigate') => {
    setIsLoading(true);
    setResponseType(action);
    
    // Simulate async response
    setTimeout(() => {
      let query = '';
      if (action === 'explain') query = 'explain this threat';
      else if (action === 'why') query = 'why flagged as ' + alert.riskLevel;
      else query = 'mitigation actions';

      const response = generateAIResponse(alert, query);
      setAiResponse(response);
      setIsLoading(false);
      setExpandedView(action);
    }, 300);
  };

  const handleChatSubmit = () => {
    if (!chatMessage.trim()) return;

    setIsLoading(true);
    setResponseType('chat');
    setExpandedView('chat');

    setTimeout(() => {
      const response = generateAIResponse(alert, chatMessage);
      setAiResponse(response);
      setChatMessage('');
      setIsLoading(false);
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-3 pt-3 border-t border-dark-border/30 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className={`w-4 h-4 ${colors.text}`} />
        <span className="text-xs font-bold text-dark-text/90 uppercase tracking-wider">Threat Intelligence</span>
      </div>

      {/* Auto-generated Insight */}
      {!expandedView && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-dark-text/80 leading-relaxed p-2.5 rounded-lg bg-dark-background/50 border border-dark-border/20"
        >
          {autoInsight}
        </motion.div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex gap-2">
        <motion.button
          onClick={() => handleQuickAction('explain')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded border transition-all ${
            expandedView === 'explain'
              ? `${colors.buttonBg} text-white shadow-lg`
              : `${colors.buttonBg} text-dark-text/80 hover:text-white`
          }`}
        >
          <Zap className="w-3 h-3 inline mr-1" />
          Explain
        </motion.button>

        <motion.button
          onClick={() => handleQuickAction('why')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded border transition-all ${
            expandedView === 'why'
              ? `${colors.buttonBg} text-white shadow-lg`
              : `${colors.buttonBg} text-dark-text/80 hover:text-white`
          }`}
        >
          <BarChart3 className="w-3 h-3 inline mr-1" />
          Why Flagged?
        </motion.button>

        <motion.button
          onClick={() => handleQuickAction('mitigate')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded border transition-all ${
            expandedView === 'mitigate'
              ? `${colors.buttonBg} text-white shadow-lg`
              : `${colors.buttonBg} text-dark-text/80 hover:text-white`
          }`}
        >
          <Shield className="w-3 h-3 inline mr-1" />
          Mitigation
        </motion.button>

        <motion.button
          onClick={() => setExpandedView(expandedView === 'chat' ? null : 'chat')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded border transition-all ${
            expandedView === 'chat'
              ? `${colors.buttonBg} text-white shadow-lg`
              : `${colors.buttonBg} text-dark-text/80 hover:text-white`
          }`}
        >
          <MessageSquare className="w-3 h-3 inline mr-1" />
          Ask AI
        </motion.button>
      </div>

      {/* Expandable Response Sections */}
      <AnimatePresence>
        {expandedView === 'explain' && !isLoading && (
          <>
            <AIResponseBlock
              response={aiResponse}
              isLoading={isLoading}
              title="⚡ Smart Explanation"
            />
            {alert.topFeatures && alert.topFeatures.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 p-3 rounded-lg bg-dark-background/40 border border-dark-border/30"
              >
                <div className="text-xs font-semibold text-dark-text/90 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Feature Importance (SHAP)
                </div>
                <SHAPBars features={alert.topFeatures} maxFeatures={5} />
              </motion.div>
            )}
          </>
        )}

        {expandedView === 'why' && !isLoading && (
          <AIResponseBlock
            response={aiResponse}
            isLoading={isLoading}
            title="📊 Why This Alert Triggered"
          />
        )}

        {expandedView === 'mitigate' && !isLoading && (
          <AIResponseBlock
            response={aiResponse}
            isLoading={isLoading}
            title="🛡️ Recommended Actions"
          />
        )}

        {expandedView === 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 p-2.5 rounded-lg bg-dark-background/40 border border-dark-border/30"
          >
            {aiResponse && !isLoading && (
              <AIResponseBlock
                response={aiResponse}
                isLoading={isLoading}
                title="💬 AI Response"
              />
            )}

            {isLoading && (
              <AIResponseBlock
                response=""
                isLoading={true}
                title="💬 AI Thinking"
              />
            )}

            {/* Chat Input */}
            <div className="flex gap-1.5 mt-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder="Ask about this alert..."
                className="flex-1 px-2 py-1.5 text-xs bg-dark-surface/50 border border-dark-border/40 rounded text-dark-text placeholder-dark-text/40 focus:outline-none focus:border-dark-border/80 transition-colors"
              />
              <motion.button
                onClick={handleChatSubmit}
                disabled={isLoading || !chatMessage.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-2 py-1.5 rounded border border-dark-border/40 hover:border-dark-border/80 bg-dark-surface/50 hover:bg-dark-surface text-dark-text/60 hover:text-dark-text transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
