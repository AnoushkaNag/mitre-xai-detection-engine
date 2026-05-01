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
  const [activePage, setActivePage] = useState<'dashboard' | 'threats' | 'analytics' | 'reports' | 'settings'>('dashboard');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const handleGenerateReport = async () => {
    console.log('🟢 [handleGenerateReport] Fetching threat report...');
    setReportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8001/report', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      
      if (!response.ok) throw new Error('Failed to generate report');
      
      const reportData = await response.json();
      console.log('🟢 [handleGenerateReport] Report generated successfully');
      setReport(reportData);
    } catch (err) {
      console.log('🔴 [handleGenerateReport] Error:', err);
      setError('Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

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
    setActivePage('dashboard');
    console.log('🔴 [handleLogout] Calling auth.logout()');
    logout();
    console.log('✅ [handleLogout] Logout complete');
  };

  const handleNavigate = (page: string) => {
    console.log('🟢 [Navigation] Navigating to:', page);
    setActivePage(page as any);
    setSelectedAlert(null);
    console.log('🟢 [Navigation] Page changed, alert selection cleared');
  };

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} onNavigate={handleNavigate} activePage={activePage} />

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Top Bar */}
        <TopBar onUploadClick={() => setShowUpload(!showUpload)} onLogout={handleLogout} isLoading={isLoading} />

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
          {activePage === 'dashboard' ? (
            <>
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
            </>
          ) : activePage === 'threats' ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Threat Dashboard</h2>
                <p className="text-dark-text/60">{alerts.length} total alerts detected</p>
                <div className="mt-6 bg-dark-surface rounded-lg p-6 inline-block">
                  <p className="text-sm text-dark-text/80">High Risk: {alerts.filter(a => a.riskLevel === 'high').length}</p>
                  <p className="text-sm text-dark-text/80">Medium Risk: {alerts.filter(a => a.riskLevel === 'medium').length}</p>
                  <p className="text-sm text-dark-text/80">Low Risk: {alerts.filter(a => a.riskLevel === 'low').length}</p>
                </div>
              </div>
            </div>
          ) : activePage === 'analytics' ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Analytics</h2>
                <p className="text-dark-text/60">Model Performance: 94.46% accuracy</p>
                <div className="mt-6 bg-dark-surface rounded-lg p-6 inline-block text-left text-sm">
                  <p className="text-dark-text/80">Training Samples: 140,272</p>
                  <p className="text-dark-text/80">Test Samples: 35,068</p>
                  <p className="text-dark-text/80">Features Used: 27</p>
                </div>
              </div>
            </div>
          ) : activePage === 'reports' ? (
            <div className="flex-1 overflow-auto">
              {!report ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Threat Report</h2>
                    <p className="text-dark-text/60 mb-6">Generate a comprehensive security report with model statistics and recommendations</p>
                    <button 
                      onClick={handleGenerateReport}
                      disabled={reportLoading}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    >
                      {reportLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Report'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{report.title}</h2>
                    <p className="text-dark-text/60">Generated: {new Date(report.generated_at).toLocaleString()}</p>
                  </div>

                  <div className="bg-dark-surface rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Model Statistics</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><label className="text-dark-text/70">Type:</label> <span className="text-white">{report.model_stats.model_type}</span></div>
                      <div><label className="text-dark-text/70">Accuracy:</label> <span className="text-green-400">{(report.model_stats.accuracy * 100).toFixed(2)}%</span></div>
                      <div><label className="text-dark-text/70">Training Samples:</label> <span className="text-white">{report.model_stats.training_samples.toLocaleString()}</span></div>
                      <div><label className="text-dark-text/70">Test Samples:</label> <span className="text-white">{report.model_stats.test_samples.toLocaleString()}</span></div>
                      <div><label className="text-dark-text/70">Features:</label> <span className="text-white">{report.model_stats.features_used}</span></div>
                      <div><label className="text-dark-text/70">Estimators:</label> <span className="text-white">{report.model_stats.estimators}</span></div>
                    </div>
                  </div>

                  <div className="bg-dark-surface rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Performance Configuration</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <label className="text-dark-text/70">SHAP Enabled:</label>
                        <span className={report.performance_config.SHAP_enabled ? 'text-green-400' : 'text-red-400'}>
                          {report.performance_config.SHAP_enabled ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <label className="text-dark-text/70">Max Rows:</label>
                        <span className="text-white">{report.performance_config.max_rows_per_file.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <label className="text-dark-text/70">Avg Analysis Time:</label>
                        <span className="text-white">{report.performance_config.average_analysis_time}</span>
                      </div>
                      <div className="flex justify-between">
                        <label className="text-dark-text/70">Improvement:</label>
                        <span className="text-yellow-400">{report.performance_config.improvement_over_full_shap}</span>
                      </div>
                      <p className="text-dark-text/60 mt-2 text-xs">{report.performance_config.reason_shap_disabled}</p>
                    </div>
                  </div>

                  <div className="bg-dark-surface rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Key Recommendations</h3>
                    <div className="space-y-3">
                      {report.recommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <div className={`px-3 py-1 rounded text-xs font-semibold ${rec.priority === 'HIGH' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                            {rec.priority}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white text-sm">{rec.title}</div>
                            <div className="text-dark-text/70 text-xs">{rec.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setReport(null)}
                    className="w-full px-4 py-2 bg-dark-surface hover:bg-dark-surface/80 text-white rounded-lg transition-colors"
                  >
                    Back to Report Generation
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
                <p className="text-dark-text/60">Configure threat detection parameters</p>
                <div className="mt-6 bg-dark-surface rounded-lg p-6 inline-block text-left text-sm space-y-3">
                  <div><label className="text-dark-text/80">SHAP Enabled:</label> <span className="text-red-400">False</span></div>
                  <div><label className="text-dark-text/80">Max Rows:</label> <span className="text-red-400">1000</span></div>
                  <div><label className="text-dark-text/80">Model Accuracy:</label> <span className="text-green-400">94.46%</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
