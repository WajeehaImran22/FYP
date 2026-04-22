//api
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { router } from 'expo-router';

/**
 * AXIOM TERMINAL // MOBILE API ARCHITECTURE
 * Unified interface for backend communication and native token management.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://wajeehaaa-digitalbillboard.hf.space";
const TOKEN_KEY = 'access_token';

// --- MULTI-LAYER TOKEN UTILITIES ---

// Layer 1: Runtime Memory (Instant, survives routing, never fails)
let memoryToken: string | null = null;

export const setToken = async (token: string) => {
  memoryToken = token; // Save to memory instantly
  
  try {
    // Layer 2: Persistent Storage
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (e) {
    console.error("AXIOM_LOG: Persistent Storage Save Error:", e);
  }
};

export const getToken = async () => {
  // 1. Try memory first (Fastest and prevents race conditions)
  if (memoryToken) return memoryToken;

  // 2. Try persistent storage
  try {
    let storedToken = null;
    if (Platform.OS === 'web') {
      storedToken = localStorage.getItem(TOKEN_KEY);
    } else {
      storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    }

    if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
      memoryToken = storedToken; // Sync memory
      return storedToken;
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Protocol: Deep Link Token Capture
 * Used to grab the token passed back from Google Auth redirects.
 */
export const captureTokenFromDeepLink = async (url: string) => {
  const parsed = Linking.parse(url);
  const token = parsed.queryParams?.access_token as string;
  
  if (token) {
    await setToken(token);
    return token;
  }
  return null;
};

/**
 * Wipes local session and returns user to the gate
 */
export const logout = async () => {
  memoryToken = null; // Clear memory
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    router.replace('/auth');
  } catch (e) {
    console.warn("AXIOM_LOG: Router not mounted yet for logout redirect.");
  }
};

/**
 * Enhanced fetch wrapper with automatic Authorization injection.
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  
  const cleanBase = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});

  // SAFER FORM DATA CHECK FOR REACT NATIVE
  // React Native FormData sometimes fails 'instanceof FormData'
  const isFormData = 
    options.body instanceof FormData || 
    (options.body && options.body.constructor && options.body.constructor.name === 'FormData');

  // On Native, do NOT set Content-Type for FormData; the engine does it automatically
  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject Bearer Token if available
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { 
    ...options, 
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    
    // Auto-logout if unauthorized (Session Expired)
    if (response.status === 401) {
      console.warn("AXIOM_PROTOCOL: Session Expired or Invalid Token.");
      await logout(); 
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

// --- Interfaces ---

export interface ProfileResponse {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  role?: 'user' | 'admin';
  avatar_url?: string;
}

export interface AdRecord {
  id: string;
  url: string;
  media_type: 'image' | 'video';
  prompt: string;
  time_of_day: string;
  weather_condition: string;
  created_at: string;
}

export interface VideoGenerateResponse {
  message: string;
  video_url: string;
  url?: string;
}

export interface ImageGenerateResponse {
  message?: string;
  image_url?: string;
  url?: string; 
}

// --- API Modules ---

export const authAPI = {
  login: (credentials: Record<string, string>): Promise<any> => 
    fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    
  signup: (credentials: Record<string, string>): Promise<any> => 
    fetchWithAuth('/auth/signup', { method: 'POST', body: JSON.stringify(credentials) }),

  forgotPassword: (email: string): Promise<any> => 
    fetchWithAuth('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  getGoogleAuthUrl: (): Promise<{ url: string }> => 
    fetchWithAuth('/auth/google', { method: 'GET' }),
};

export const profileAPI = {
  getMe: (): Promise<ProfileResponse> => 
    fetchWithAuth('/profile/me', { method: 'GET' }),
    
  updateProfile: (data: { full_name?: string; company_name?: string }): Promise<ProfileResponse> => 
    fetchWithAuth('/profile/me', { method: 'PUT', body: JSON.stringify(data) }),
    
  getHistory: (): Promise<AdRecord[]> => 
    fetchWithAuth('/profile/history', { method: 'GET' }),
};

export const scheduleAPI = {
  deploy: (data: {
    ad_id: string;
    media_url: string;   
    media_type: string;  
    date: string;
    time: string;
    duration_hours: number;
    tier: string;
    total_price: number;
  }): Promise<any> => 
    fetchWithAuth('/videos/schedules/deploy', { method: 'POST', body: JSON.stringify(data) }),
};

export const adminAPI = {
  getLogs: (): Promise<any[]> => 
    fetchWithAuth('/admin/logs', { method: 'GET' }),
};

export const adAPI = {
  enhanceVideoPrompt: (prompt: string): Promise<any> => 
    fetchWithAuth('/ads/enhance-prompt', { method: 'POST', body: JSON.stringify({ prompt }) }),
    
  enhanceImagePrompt: (prompt: string): Promise<any> => 
    fetchWithAuth('/ads/enhance-image-prompt', { method: 'POST', body: JSON.stringify({ prompt }) }),
};

export const mediaAPI = {
  // Configured to expect a standard JSON response containing the URL
  generateImage: (data: { prompt: string, time_of_day?: string, weather_condition?: string }): Promise<ImageGenerateResponse> => 
    fetchWithAuth('/images/generate', { method: 'POST', body: JSON.stringify(data) }),

  generateVideoSequence: (data: { prompts: string[], time_of_day?: string, weather_condition?: string }): Promise<VideoGenerateResponse> => 
    fetchWithAuth('/videos/generate', { method: 'POST', body: JSON.stringify(data) }),
};

export const videoAPI = {
  /**
   * fileUri: The local path from expo-image-picker or expo-document-picker
   */
  upload: async (fileUri: string, fileName: string, fileType: string): Promise<any> => {
    const formData = new FormData();
    
    // React Native specific FormData file object mapping
    const fileToUpload = {
      uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
      name: fileName,
      type: fileType, 
    };

    formData.append('file', fileToUpload as any);

    return fetchWithAuth('/videos/upload', { 
      method: 'POST', 
      body: formData 
    });
  }
};

export const billboardAPI = {
  getActiveAd: (): Promise<any> => 
    fetchWithAuth('/billboard/active', { method: 'GET' }),
};
