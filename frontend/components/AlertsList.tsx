'use client';

import { motion, AnimatePresence } from 'framer-motion';
import AlertCard from './AlertCard';

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

interface AlertsListProps {
  alerts: Alert[];
  selectedAlert: Alert | null;
  onSelectAlert: (alert: Alert) => void;
  expandedAlertId?: string | null;
  onExpandAlert?: (alertId: string) => void;
}

export default function AlertsList({ 
  alerts, 
  selectedAlert, 
  onSelectAlert,
  expandedAlertId,
  onExpandAlert
}: AlertsListProps) {
  const handleSelectAlert = (alert: Alert) => {
    console.log('🔷 [AlertsList] Alert clicked:', alert.id, alert.title);
    console.log('🔷 [AlertsList] Alert details:', {
      risk: alert.riskLevel,
      confidence: alert.confidence,
      service: alert.service,
      state: alert.state,
    });
    onSelectAlert(alert);
  };

  return (
    <div className="h-full flex flex-col bg-dark-surface/30 backdrop-blur-xs border border-dark-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-dark-border">
        <h3 className="text-lg font-semibold text-white">Detected Alerts</h3>
        <p className="text-sm text-dark-text/60 mt-1">{alerts.length} total alerts</p>
      </div>

      {/* Alerts Scroll Area */}
      <div className="flex-1 overflow-y-auto">
        {alerts.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3 p-4">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectAlert(alert)}
                >
                  <AlertCard
                    alert={alert}
                    isSelected={selectedAlert?.id === alert.id}
                    expandedAlertId={expandedAlertId}
                    onSelectAlert={onSelectAlert}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-dark-text/60">No alerts detected</p>
              <p className="text-sm text-dark-text/40 mt-1">Upload data to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
