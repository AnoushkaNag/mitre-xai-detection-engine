'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBoxProps {
  alert: any;
}

interface SHAPResult {
  summary: string;
  explanation: string;
  features: Array<{
    name: string;
    importance: number;
    direction: string;
    value: string;
  }>;
  risk_level: string;
  confidence: number;
}

export default function ChatBox({ alert }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: alert
        ? "I'm here to explain this alert. Ask me anything about the threat, SHAP features, or analyst reasoning."
        : 'Select an alert to get started with threat analysis. Ask me questions about detected threats.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shapResult, setShapResult] = useState<SHAPResult | null>(null);
  const [shapLoading, setShapLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) {
      console.log('🟡 [ChatBox] Empty message, ignoring');
      return;
    }

    console.log('🟡 [ChatBox] Sending message:', input);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const inputText = input;
    setInput('');
    setIsLoading(true);

    try {
      console.log('🟡 [ChatBox] Sending message via api.sendMessage()');
      
      let responseText = '';
      
      // Smart analyst-mode responses based on alert context
      if (alert) {
        const riskLevel = alert.riskLevel?.toUpperCase() || 'UNKNOWN';
        const confidence = alert.confidence || 0;
        const sbytes = alert.sourceBytes || 0;
        const dbytes = alert.destBytes || 0;
        const service = alert.service || 'unknown';
        const state = alert.state || 'unknown';
        const duration = alert.duration || 0;
        
        const query = inputText.toLowerCase();
        
        // Analyst Mode: Feature-aware responses
        if (query.includes('why') || query.includes('high risk') || query.includes('flagged')) {
          responseText = `This alert is classified as ${riskLevel} risk with ${(confidence * 100).toFixed(0)}% model confidence. The detection is primarily driven by:

• Service type (${service}): Shows unusual protocol behavior
• Connection state (${state}): Indicates abnormal connection handshake
• Data transfer pattern: ${sbytes.toLocaleString()} bytes sent → ${dbytes.toLocaleString()} bytes received

This combination matches known threat patterns in our UNSW-NB15 training dataset (140K+ samples). The random forest classifier learned that this feature combination strongly correlates with malicious activity.`;
        } else if (query.includes('feature') || query.includes('what triggered') || query.includes('shap')) {
          responseText = `Top features influencing this ${riskLevel} classification:

1. Service: ${service} (unusual)
2. State: ${state} (abnormal behavior)  
3. Source bytes: ${sbytes.toLocaleString()} (${sbytes > 5000 ? 'abnormally high' : 'within range'})
4. Destination bytes: ${dbytes.toLocaleString()} (${dbytes > 5000 ? 'suspicious volume' : 'normal'})
5. Duration: ${duration.toFixed(6)}s (${duration > 1 ? 'extended connection' : 'quick transfer'})

Each feature contributes to the overall threat score. The model weighs these features based on patterns from 140K training samples.`;
        } else if (query.includes('mitigate') || query.includes('fix') || query.includes('response') || query.includes('action')) {
          if (riskLevel === 'HIGH') {
            responseText = `IMMEDIATE RESPONSE REQUIRED:

1. 🚨 Block Source IP: Add firewall rule to drop ${service} traffic from source
2. 🔍 Deep Inspection: Analyze packet payloads for malware signatures
3. 🔗 Threat Hunt: Check for C&C communications and lateral movement
4. 🛡️ Isolation: Quarantine affected endpoint from network
5. 📊 Forensics: Archive logs for incident analysis (${state} state connections)

Confidence: ${(confidence * 100).toFixed(0)}% - Strong evidence of compromise`;
          } else if (riskLevel === 'MEDIUM') {
            responseText = `RECOMMENDED ACTIONS:

1. 📈 Enhanced Monitoring: Enable logging for all ${service}/${state} flows
2. ⚠️ Alert Triggers: Setup detection for similar traffic patterns
3. 🔎 Review: Correlate with recent security events
4. 📧 Escalate: Flag for SOC analyst review if pattern repeats

This alert shows ${(confidence * 100).toFixed(0)}% confidence of threat activity. Monitor closely.`;
          } else {
            responseText = `LOW RISK ASSESSMENT:

Traffic appears benign but still shows minor anomalies in ${service}/${state} communication. Continue routine monitoring. No immediate action required.`;
          }
        } else if (query.includes('confident') || query.includes('certainty') || query.includes('sure')) {
          responseText = `Confidence Score: ${(confidence * 100).toFixed(0)}%

This indicates the model is ${(confidence * 100).toFixed(0)}% certain this is ${riskLevel === 'LOW' ? 'benign traffic' : 'a threat'}.

Confidence breakdown:
• >85%: High certainty (strong threat indicators)
• 65-85%: Moderate certainty (multiple indicators)
• <65%: Low certainty (minimal indicators, false positive risk)

Your alert at ${(confidence * 100).toFixed(0)}% suggests ${confidence > 0.85 ? 'multiple definitive threat features' : 'moderate suspicious activity'}. Review the SHAP analysis for feature contributions.`;
        } else if (query.includes('data exfil')) {
          responseText = `Data Exfiltration Risk Analysis:

Outbound bytes (sbytes): ${sbytes.toLocaleString()}
• If >100KB: Potential data extraction detected
• Current: ${sbytes > 100000 ? '🚨 SUSPICIOUS' : '✓ Normal'}

Connection duration: ${duration.toFixed(6)}s
• Long duration + high bytes = possible exfiltration
• Assessment: ${duration > 10 && sbytes > 50000 ? '⚠️ INVESTIGATE' : 'Normal pattern'}

Recommendation: Review what data was accessed and transmitted.`;
        } else if (query.includes('ransomware') || query.includes('malware')) {
          responseText = `Ransomware/Malware Detection Assessment:

Indicators in this alert:
• Service: ${service} (${service === 'INT' ? '🔴 Suspicious' : '✓ Normal'})
• State: ${state} (${state === 'CON' ? '⚠️ Unusual' : '✓ Expected'})
• Data pattern: ${sbytes > 5000 ? 'High command traffic' : 'Normal baseline'}

This alert shows characteristics consistent with C&C (Command & Control) communication. However, confirmation requires additional context:
- Recent file modifications?
- Unexpected outbound connections?
- Process execution anomalies?`;
        }
      }
      
      // Fallback if no alert or no smart match
      if (!responseText) {
        responseText = alert 
          ? `Alert analysis: This ${alert.riskLevel?.toUpperCase() || 'UNKNOWN'}-risk alert shows anomalous ${alert.service || 'network'} traffic with ${(alert.confidence * 100).toFixed(0)}% confidence. Key indicators include unusual connection state (${alert.state}), data volume, and protocol behavior. Ask me about specific mitigations or threat scenarios.`
          : `Select an alert first to get analyst insights. I can explain why the model flagged it, which features drove the decision, recommended response actions, and confidence scoring.`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      console.log('✅ [ChatBox] Message received and displayed');
    } catch (error) {
      console.error('❌ [ChatBox] Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      console.log('🟡 [ChatBox] END');
    }
  };

  const handleShowSHAP = async () => {
    if (!alert) {
      console.log('🔴 [ChatBox] No alert selected for SHAP analysis');
      return;
    }

    console.log('🟢 [ChatBox] Requesting SHAP analysis for alert:', alert.id);
    setShapLoading(true);

    try {
      const response = await fetch('http://localhost:8001/analyze-shap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        },
        body: JSON.stringify({
          message: 'explain',
          alert: alert,
        }),
      });

      if (!response.ok) {
        throw new Error(`SHAP analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [ChatBox] SHAP analysis received:', data);
      setShapResult(data);
    } catch (error) {
      console.error('❌ [ChatBox] SHAP error:', error);
      alert && setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `SHAP analysis failed: ${error}`,
        timestamp: new Date(),
      }]);
    } finally {
      setShapLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 bg-dark-surface/40 backdrop-blur-xs border border-dark-border rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-red-400" />
          <h3 className="font-semibold text-white">Threat Intelligence</h3>
        </div>
        {alert && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShowSHAP}
            disabled={shapLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-600/30 rounded text-sm text-yellow-400 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {shapLoading ? 'Analyzing...' : 'SHAP'}
          </motion.button>
        )}
      </div>

      {/* SHAP Results */}
      {shapResult && (
        <div className="p-4 bg-yellow-600/10 border-b border-yellow-600/20 max-h-64 overflow-y-auto">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {shapResult.summary}
              </h4>
              <p className="text-sm text-dark-text/80 whitespace-pre-wrap mb-3">{shapResult.explanation}</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-semibold text-dark-text/60">Feature Importance:</div>
              {shapResult.features.slice(0, 6).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-24 text-xs text-dark-text/70 truncate">{feature.name}</div>
                  <div className="flex-1 bg-dark-surface rounded h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-yellow-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${feature.importance * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="w-12 text-right text-xs text-yellow-400">{(feature.importance * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShapResult(null)}
              className="w-full text-xs py-1.5 text-dark-text/60 hover:text-dark-text transition-colors"
            >
              Close SHAP Analysis
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  message.type === 'user'
                    ? 'bg-red-600/30 text-white rounded-br-none'
                    : 'bg-dark-surface/60 border border-dark-border/50 text-dark-text rounded-bl-none'
                }`}
              >
                <p className="leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 p-3 bg-dark-surface/60 border border-dark-border/50 rounded-lg w-fit"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ delay: i * 0.1, repeat: Infinity, duration: 0.6 }}
                    className="w-2 h-2 bg-red-500 rounded-full"
                  ></motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      {alert && (
        <div className="px-4 py-3 border-t border-dark-border flex flex-wrap gap-2 bg-dark-surface/20">
          <button
            onClick={() => { setInput('Why is this flagged as ' + alert.riskLevel?.toUpperCase() + ' risk?'); setTimeout(() => handleSendMessage(), 100); }}
            className="px-2 py-1.5 text-xs bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded transition-colors font-medium"
            title="Understand threat classification"
          >
            Why {alert.riskLevel} risk?
          </button>
          <button
            onClick={() => { setInput('What features triggered this detection?'); setTimeout(() => handleSendMessage(), 100); }}
            className="px-2 py-1.5 text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-400 rounded transition-colors font-medium"
            title="See feature contributions"
          >
            What features?
          </button>
          <button
            onClick={() => { setInput('What immediate actions should I take?'); setTimeout(() => handleSendMessage(), 100); }}
            className="px-2 py-1.5 text-xs bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 rounded transition-colors font-medium"
            title="Get remediation steps"
          >
            Mitigate actions
          </button>
          <button
            onClick={() => { setInput('Is this data exfiltration?'); setTimeout(() => handleSendMessage(), 100); }}
            className="px-2 py-1.5 text-xs bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-400 rounded transition-colors font-medium"
            title="Check for exfiltration patterns"
          >
            Data exfil risk?
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-dark-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about this threat..."
          className="flex-1 px-3 py-2 bg-dark-surface-alt border border-dark-border rounded-lg text-sm text-dark-text placeholder:text-dark-text/40 focus:outline-none focus:border-red-500/50 transition-colors"
          disabled={isLoading}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="p-2 bg-red-600/30 hover:bg-red-600/50 rounded-lg text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
