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
    const inputText = input; // Save for later use
    setInput('');
    setIsLoading(true);

    try {
      console.log('🟡 [ChatBox] Sending message via api.sendMessage()');
      console.log('🟡 [ChatBox] Payload:', { message: inputText, alert });

      const data = await api.sendMessage(inputText, alert || undefined);

      console.log('🟡 [ChatBox] Response data:', data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
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
        <div className="px-4 py-2 border-t border-dark-border flex flex-wrap gap-2 bg-dark-surface/20">
          <button
            onClick={() => { setInput('What features triggered this?'); setTimeout(() => handleSendMessage(), 100); }}
            className="px-2 py-1 text-xs bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded transition-colors"
          >
            What features triggered it?
          </button>
          <button
            onClick={() => { setInput('How do I mitigate this?'); setTimeout(() => handleSendMessage(), 100); }}
            className="px-2 py-1 text-xs bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded transition-colors"
          >
            How to mitigate?
          </button>
          <button
            onClick={() => { setInput('Why is confidence ' + (alert.confidence * 100).toFixed(0) + '%?'); setTimeout(() => handleSendMessage(), 100); }}
            className="px-2 py-1 text-xs bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded transition-colors"
          >
            Why this confidence?
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
