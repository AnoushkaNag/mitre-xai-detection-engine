'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import AlertsList from '@/components/AlertsList';
import AlertPanel from '@/components/AlertPanel';
import ChatBox from '@/components/ChatBox';
import UploadBox from '@/components/UploadBox';
import LoginComponent from '@/components/Login';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';

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

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  
  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginComponent />;
  }

  return <Dashboard />;
}

function Dashboard() {
  const { logout } = useAuth();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    console.log('🔵 [handleUpload] START - File selected:', file.name, 'Size:', file.size);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔵 [handleUpload] Calling api.analyzeFile()...');
      
      const data = await api.analyzeFile(file);
      
      console.log('🔵 [handleUpload] Response data:', data);
      console.log('🔵 [handleUpload] Alerts received:', data.alerts?.length || 0);
      
      // Verify alerts array exists and is an array
      if (!data.alerts || !Array.isArray(data.alerts)) {
        const errorMsg = 'Invalid response format: alerts should be an array';
        console.error('❌ [handleUpload]', errorMsg);
        setError(errorMsg);
        setAlerts([]);  // Clear any previous alerts
        setIsLoading(false);
        return;
      }

      // Convert backend format to frontend Alert format
      const convertedAlerts = data.alerts.map((alert: any) => ({
        id: alert.id,
        title: `Threat Detected: ${alert.risk} Risk`,
        riskLevel: alert.risk.toLowerCase() as 'high' | 'medium' | 'low',
        confidence: alert.confidence,
        duration: alert.behavior.dur,
        sourceBytes: alert.behavior.sbytes,
        destBytes: alert.behavior.dbytes,
        service: alert.behavior.service,
        state: alert.behavior.state,
        topFeatures: alert.explanation.map((exp: any) => ({
          name: exp.feature,
          value: exp.impact,
          direction: exp.impact > 0 ? 'up' as const : 'down' as const,
        })),
        reasoning: alert.reasoning,
        timestamp: new Date().toISOString(),
      }));
      
      console.log('🔵 [handleUpload] Converted alerts:', convertedAlerts.length);
      setAlerts(convertedAlerts);
      setShowUpload(false);
      setSelectedAlert(null);
      setError(null);  // Ensure error is cleared
      console.log('✅ [handleUpload] SUCCESS - Alerts updated, UI ready for interaction');
    } catch (error) {
      console.error('❌ [handleUpload] FAILED:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Upload failed: ${errorMessage}`);
      setAlerts([]);  // Clear alerts on error
      setSelectedAlert(null);  // Clear selection on error
      console.log('🔵 [handleUpload] UI state reset after error, buttons ready for interaction');
    } finally {
      setIsLoading(false);
      console.log('🔵 [handleUpload] END - isLoading reset to false');
    }
  };

  // Demo alerts for development
  const demoAlerts: Alert[] = [
    {
      id: '1',
      title: 'Suspicious Network Activity Detected',
      riskLevel: 'high',
      confidence: 0.98,
      duration: 0.000009,
      sourceBytes: 114,
      destBytes: 0,
      service: '-',
      state: 'INT',
      topFeatures: [
        { name: 'dbytes', value: 0.0909, direction: 'up' },
        { name: 'sbytes', value: 0.0818, direction: 'up' },
        { name: 'state_INT', value: 0.0719, direction: 'up' },
      ],
      reasoning: [
        'High destination byte transfer detected - Possible malware download',
        'Abnormal connection state - Connection state indicates suspicious behavior',
        'Unusual service pattern - Service type contributes to anomaly detection',
      ],
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Benign Network Activity',
      riskLevel: 'low',
      confidence: 0.02,
      duration: 2.736664,
      sourceBytes: 13350,
      destBytes: 548216,
      service: 'http',
      state: 'CON',
      topFeatures: [
        { name: 'dbytes', value: -0.2769, direction: 'down' },
        { name: 'sbytes', value: -0.1655, direction: 'down' },
        { name: 'state_CON', value: -0.092, direction: 'down' },
      ],
      reasoning: [
        'Traffic profile consistent with benign baseline',
        'Normal connection duration',
        'Expected service pattern',
      ],
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const handleLogout = () => {
    console.log('🔴 [handleLogout] Starting logout');
    console.log('🔴 [handleLogout] Clearing local state');
    setAlerts([]);
    setSelectedAlert(null);
    setError(null);
    setShowUpload(false);
    console.log('🔴 [handleLogout] Calling auth.logout()');
    logout();
    console.log('✅ [handleLogout] Logout complete');
  };

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Top Bar */}
        <TopBar onUploadClick={() => setShowUpload(!showUpload)} onLogout={handleLogout} />

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-6 py-3 flex justify-between items-center">
            <span>❌ {error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-200 hover:text-red-100 text-xl"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Dashboard */}
        <div className="flex flex-1 overflow-hidden gap-4 p-4">
          {/* Left: Alerts List */}
          <div className="flex-1 min-w-0">
            {showUpload ? (
              <UploadBox 
                onUpload={handleUpload} 
                isLoading={isLoading}
                onClose={() => setShowUpload(false)}
              />
            ) : (
              <AlertsList
                alerts={alerts}
                selectedAlert={selectedAlert}
                onSelectAlert={setSelectedAlert}
              />
            )}
          </div>

          {/* Right: Alert Detail Panel & Chat */}
          <div className="w-96 flex flex-col gap-4 min-w-0">
            {/* Alert Details Panel */}
            {selectedAlert && (
              <AlertPanel
                alert={selectedAlert}
                onClose={() => setSelectedAlert(null)}
              />
            )}

            {/* Chat Box */}
            <ChatBox alert={selectedAlert} />
          </div>
        </div>
      </div>
    </div>
  );
}
