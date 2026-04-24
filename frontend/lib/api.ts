/**
 * API utilities with authentication support
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_role: string;
  expires_in: number;
}

export interface AnalyzeResponse {
  status: string;
  total: number;
  file: string;
  detected_format: string;
  alerts: any[];
  warnings: string[];
}

class ThreatDetectionAPI {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private getAuthHeader() {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`,
      };
    }
    return {};
  }

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    console.log('🔐 [API] Attempting login...');
    
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [API] Login failed:', error);
      throw new Error(`Login failed: ${response.status}`);
    }

    const data: LoginResponse = await response.json();
    this.setToken(data.access_token);
    console.log('✅ [API] Login successful');
    return data;
  }

  /**
   * Logout
   */
  logout() {
    console.log('🔐 [API] Logging out');
    this.clearToken();
  }

  /**
   * Upload file for analysis
   */
  async analyzeFile(file: File): Promise<AnalyzeResponse> {
    console.log('🔵 [API] Uploading file:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getAuthHeader();

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [API] Analysis failed:', error);
      throw new Error(`Analysis failed: ${response.status} - ${error}`);
    }

    const data: AnalyzeResponse = await response.json();
    console.log('✅ [API] Analysis complete:', data.total, 'alerts');
    return data;
  }

  /**
   * Send chat message
   */
  async sendMessage(message: string, alert?: any): Promise<{ response: string }> {
    console.log('🟡 [API] Sending chat message');
    
    const headers = this.getHeaders();

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, alert }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [API] Chat failed:', error);
      throw new Error(`Chat failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [API] Chat response received');
    return data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; model_loaded: boolean; explainer_loaded: boolean }> {
    console.log('🟢 [API] Health check');
    
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [API] Health check OK');
    return data;
  }
}

// Create singleton instance
export const api = new ThreatDetectionAPI();
