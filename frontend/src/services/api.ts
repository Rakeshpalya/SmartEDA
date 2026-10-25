import {
  DatasetSummary, RawTableResponse, InspectionResponse, MissingAnalysisResponse,
  DuplicateAnalysisResponse, InconsistentAnalysisResponse, CategoricalAnalysisResponse,
  NumericalAnalysisResponse, OutlierAnalysisResponse, CorrelationResponse,
  TargetAnalysisResponse, MLTrainResponse, InsightItem,
  PresentationSlide, BeforeAfterResponse
} from '../types';
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('smarteda_api_url');
    if (saved && saved.trim()) return saved.trim();
  }
  return import.meta.env.VITE_API_BASE_URL || "https://smarteda-2.onrender.com";
};

export let API_BASE_URL: string = getApiBaseUrl();

export const setApiBaseUrl = (url: string) => {
  API_BASE_URL = url.trim();
  if (typeof window !== 'undefined') {
    localStorage.setItem('smarteda_api_url', url.trim());
  }
};

// Normalize base URL to ensure clean path joining
const cleanBaseUrl = (baseUrl: string): string => {
  return baseUrl.replace(/\/+$/, '');
};

// Builds full API route URL, guaranteeing '/api' prefix without duplicate slashes
export const buildApiUrl = (endpoint: string): string => {
  const base = cleanBaseUrl(getApiBaseUrl());
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (base.endsWith('/api')) {
    return cleanEndpoint.startsWith('/api/')
      ? `${base}${cleanEndpoint.substring(4)}`
      : `${base}${cleanEndpoint}`;
  }
  return cleanEndpoint.startsWith('/api/')
    ? `${base}${cleanEndpoint}`
    : `${base}/api${cleanEndpoint}`;
};


async function fetchWithHandling<T>(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. The backend server took too long to respond.`);
    }
    // Failed to fetch covers: Connection Refused, Offline, DNS failure, or CORS blocked
    throw new Error(
      `Backend Connection Error: Failed to reach '${API_BASE_URL}'. Please ensure the FastAPI backend is online and CORS allows this domain.`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let errMsg = `Server returned HTTP ${res.status}: ${res.statusText || 'Error'}`;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const errJson = await res.json();
        if (errJson.detail) {
          errMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // ignore
      }
    } else {
      try {
        const text = await res.text();
        if (text && text.length < 200 && !text.includes('<!DOCTYPE') && !text.includes('<html')) {
          errMsg = text;
        }
      } catch {
        // ignore
      }
    }
    throw new Error(errMsg);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Invalid response format: Expected JSON but received ${contentType || 'HTML'}. If deployed on Netlify, please verify VITE_API_BASE_URL points to the public backend.`
    );
  }

  try {
    return (await res.json()) as T;
  } catch (err: any) {
    throw new Error(`Failed to decode server response JSON: ${err.message}`);
  }
}

export const api = {
  checkHealth: async (): Promise<{ status: string }> => {
    return fetchWithHandling<{ status: string }>(buildApiUrl('/health'), { method: 'GET' }, 5000);
  },

  uploadFile: async (file: File): Promise<{ message: string; overview: DatasetSummary }> => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchWithHandling<{ message: string; overview: DatasetSummary }>(buildApiUrl('/upload'), {
      method: 'POST',
      body: formData,
    });
  },

  loadDemoDataset: async (): Promise<{ message: string; overview: DatasetSummary }> => {
    return fetchWithHandling<{ message: string; overview: DatasetSummary }>(buildApiUrl('/demo/load'), {
      method: 'POST',
    });
  },

  resetDataset: async (): Promise<{ message: string; overview: DatasetSummary }> => {
    return fetchWithHandling<{ message: string; overview: DatasetSummary }>(buildApiUrl('/reset'), {
      method: 'POST',
    });
  },

  getOverview: async (): Promise<DatasetSummary> => {
    return fetchWithHandling<DatasetSummary>(buildApiUrl('/overview'));
  },

  getRawTable: async (params?: { page?: number; pageSize?: number; search?: string; sortBy?: string; sortAsc?: boolean; useRaw?: boolean }): Promise<RawTableResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('page_size', params.pageSize.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sort_by', params.sortBy);
    if (params?.sortAsc !== undefined) query.append('sort_asc', params.sortAsc.toString());
    if (params?.useRaw !== undefined) query.append('use_raw', params.useRaw.toString());
    return fetchWithHandling<RawTableResponse>(buildApiUrl(`/raw-table?${query.toString()}`));
  },

  getInspection: async (): Promise<InspectionResponse> => {
    return fetchWithHandling<InspectionResponse>(buildApiUrl('/inspection'));
  },

  getMissingAnalysis: async (): Promise<MissingAnalysisResponse> => {
    return fetchWithHandling<MissingAnalysisResponse>(buildApiUrl('/missing'));
  },

  treatMissing: async (column: string, strategy: string, fillValue?: string | number): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    return fetchWithHandling<{ success: boolean; explanation: any; overview: DatasetSummary }>(buildApiUrl('/missing/treat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, strategy, fill_value: fillValue }),
    });
  },

  getDuplicatesAnalysis: async (): Promise<DuplicateAnalysisResponse> => {
    return fetchWithHandling<DuplicateAnalysisResponse>(buildApiUrl('/duplicates'));
  },

  removeDuplicates: async (subset?: string[], keep: string = 'first'): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    return fetchWithHandling<{ success: boolean; explanation: any; overview: DatasetSummary }>(buildApiUrl('/duplicates/remove'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subset, keep }),
    });
  },

  getInconsistencies: async (): Promise<InconsistentAnalysisResponse> => {
    return fetchWithHandling<InconsistentAnalysisResponse>(buildApiUrl('/inconsistencies'));
  },

  treatInconsistencies: async (column: string, action: string, replaceMap?: Record<string, string>): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    return fetchWithHandling<{ success: boolean; explanation: any; overview: DatasetSummary }>(buildApiUrl('/inconsistencies/treat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, action, replace_map: replaceMap }),
    });
  },

  updateDatatype: async (column: string, targetType: string): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    return fetchWithHandling<{ success: boolean; explanation: any; overview: DatasetSummary }>(buildApiUrl('/datatypes/update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, target_type: targetType }),
    });
  },

  cleanColumns: async (action: string, column?: string, newName?: string): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    return fetchWithHandling<{ success: boolean; explanation: any; overview: DatasetSummary }>(buildApiUrl('/columns/clean'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, column, new_name: newName }),
    });
  },

  getCategoricalAnalysis: async (column: string, useRaw: boolean = false): Promise<CategoricalAnalysisResponse> => {
    return fetchWithHandling<CategoricalAnalysisResponse>(buildApiUrl(`/categorical/${encodeURIComponent(column)}?use_raw=${useRaw}`));
  },

  getNumericalAnalysis: async (column: string): Promise<NumericalAnalysisResponse> => {
    return fetchWithHandling<NumericalAnalysisResponse>(buildApiUrl(`/numerical/${encodeURIComponent(column)}`));
  },

  getOutlierAnalysis: async (column: string, method: string = 'iqr', threshold: number = 1.5): Promise<OutlierAnalysisResponse> => {
    return fetchWithHandling<OutlierAnalysisResponse>(buildApiUrl(`/outliers/${encodeURIComponent(column)}?method=${method}&threshold=${threshold}`));
  },

  treatOutliers: async (column: string, method: string = 'iqr', action: string = 'clip', threshold: number = 1.5): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    return fetchWithHandling<{ success: boolean; explanation: any; overview: DatasetSummary }>(buildApiUrl('/outliers/treat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, method, action, threshold }),
    });
  },

  getCorrelation: async (method: string = 'pearson'): Promise<CorrelationResponse> => {
    return fetchWithHandling<CorrelationResponse>(buildApiUrl(`/correlation?method=${method}`));
  },

  getTargetAnalysis: async (targetCol: string, problemType: string = 'classification'): Promise<TargetAnalysisResponse> => {
    return fetchWithHandling<TargetAnalysisResponse>(buildApiUrl(`/target-analysis?target_col=${encodeURIComponent(targetCol)}&problem_type=${problemType}`));
  },

  trainModels: async (payload: {
    target_column: string;
    problem_type: string;
    feature_columns?: string[];
    algorithms: string[];
    test_size?: number;
    scaling_method?: string;
    encoding_method?: string;
    random_state?: number;
  }): Promise<MLTrainResponse> => {
    return fetchWithHandling<MLTrainResponse>(buildApiUrl('/ml/train'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  getCandidateModels: async (problemType: string = 'classification') => {
    return fetchWithHandling<any>(buildApiUrl(`/ml/candidate-models?problem_type=${problemType}`));
  },

  getInsights: async (): Promise<InsightItem[]> => {
    return fetchWithHandling<InsightItem[]>(buildApiUrl('/insights'));
  },

  getBeforeAfter: async (): Promise<BeforeAfterResponse> => {
    return fetchWithHandling<BeforeAfterResponse>(buildApiUrl('/before-after'));
  },

  getPresentationSlides: async (): Promise<PresentationSlide[]> => {
    return fetchWithHandling<PresentationSlide[]>(buildApiUrl('/presentation-slides'));
  },

  getExportCleanCsvUrl: () => buildApiUrl('/export/clean-csv'),
};
