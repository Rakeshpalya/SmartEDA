import {
  DatasetSummary, RawTableResponse, InspectionResponse, MissingAnalysisResponse,
  DuplicateAnalysisResponse, InconsistentAnalysisResponse, CategoricalAnalysisResponse,
  NumericalAnalysisResponse, OutlierAnalysisResponse, CorrelationResponse,
  TargetAnalysisResponse, MLTrainResponse, InsightItem,
  PresentationSlide, BeforeAfterResponse
} from '../types';
const getApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  return '/api';
};

const API_BASE = getApiBase();

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    try {
      const errData = await res.json();
      if (errData.detail) {
        errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  uploadFile: async (file: File): Promise<{ message: string; overview: DatasetSummary }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  loadDemoDataset: async (): Promise<{ message: string; overview: DatasetSummary }> => {
    const res = await fetch(`${API_BASE}/demo/load`, { method: 'POST' });
    return handleResponse(res);
  },

  resetDataset: async (): Promise<{ message: string; overview: DatasetSummary }> => {
    const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
    return handleResponse(res);
  },

  getOverview: async (): Promise<DatasetSummary> => {
    const res = await fetch(`${API_BASE}/overview`);
    return handleResponse(res);
  },

  getRawTable: async (params?: { page?: number; pageSize?: number; search?: string; sortBy?: string; sortAsc?: boolean; useRaw?: boolean }): Promise<RawTableResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('page_size', params.pageSize.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sort_by', params.sortBy);
    if (params?.sortAsc !== undefined) query.append('sort_asc', params.sortAsc.toString());
    if (params?.useRaw !== undefined) query.append('use_raw', params.useRaw.toString());
    const res = await fetch(`${API_BASE}/raw-table?${query.toString()}`);
    return handleResponse(res);
  },

  getInspection: async (): Promise<InspectionResponse> => {
    const res = await fetch(`${API_BASE}/inspection`);
    return handleResponse(res);
  },

  getMissingAnalysis: async (): Promise<MissingAnalysisResponse> => {
    const res = await fetch(`${API_BASE}/missing`);
    return handleResponse(res);
  },

  treatMissing: async (column: string, strategy: string, fillValue?: string | number): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    const res = await fetch(`${API_BASE}/missing/treat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, strategy, fill_value: fillValue }),
    });
    return handleResponse(res);
  },

  getDuplicatesAnalysis: async (): Promise<DuplicateAnalysisResponse> => {
    const res = await fetch(`${API_BASE}/duplicates`);
    return handleResponse(res);
  },

  removeDuplicates: async (subset?: string[], keep: string = 'first'): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    const res = await fetch(`${API_BASE}/duplicates/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subset, keep }),
    });
    return handleResponse(res);
  },

  getInconsistencies: async (): Promise<InconsistentAnalysisResponse> => {
    const res = await fetch(`${API_BASE}/inconsistencies`);
    return handleResponse(res);
  },

  treatInconsistencies: async (column: string, action: string, replaceMap?: Record<string, string>): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    const res = await fetch(`${API_BASE}/inconsistencies/treat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, action, replace_map: replaceMap }),
    });
    return handleResponse(res);
  },

  updateDatatype: async (column: string, targetType: string): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    const res = await fetch(`${API_BASE}/datatypes/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, target_type: targetType }),
    });
    return handleResponse(res);
  },

  cleanColumns: async (action: string, column?: string, newName?: string): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    const res = await fetch(`${API_BASE}/columns/clean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, column, new_name: newName }),
    });
    return handleResponse(res);
  },

  getCategoricalAnalysis: async (column: string, useRaw: boolean = false): Promise<CategoricalAnalysisResponse> => {
    const res = await fetch(`${API_BASE}/categorical/${encodeURIComponent(column)}?use_raw=${useRaw}`);
    return handleResponse(res);
  },

  getNumericalAnalysis: async (column: string): Promise<NumericalAnalysisResponse> => {
    const res = await fetch(`${API_BASE}/numerical/${encodeURIComponent(column)}`);
    return handleResponse(res);
  },

  getOutlierAnalysis: async (column: string, method: string = 'iqr', threshold: number = 1.5): Promise<OutlierAnalysisResponse> => {
    const res = await fetch(`${API_BASE}/outliers/${encodeURIComponent(column)}?method=${method}&threshold=${threshold}`);
    return handleResponse(res);
  },

  treatOutliers: async (column: string, method: string = 'iqr', action: string = 'clip', threshold: number = 1.5): Promise<{ success: boolean; explanation: any; overview: DatasetSummary }> => {
    const res = await fetch(`${API_BASE}/outliers/treat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column, method, action, threshold }),
    });
    return handleResponse(res);
  },

  getCorrelation: async (method: string = 'pearson'): Promise<CorrelationResponse> => {
    const res = await fetch(`${API_BASE}/correlation?method=${method}`);
    return handleResponse(res);
  },

  getTargetAnalysis: async (targetCol: string, problemType: string = 'classification'): Promise<TargetAnalysisResponse> => {
    const res = await fetch(`${API_BASE}/target-analysis?target_col=${encodeURIComponent(targetCol)}&problem_type=${problemType}`);
    return handleResponse(res);
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
    const res = await fetch(`${API_BASE}/ml/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  getCandidateModels: async (problemType: string = 'classification') => {
    const res = await fetch(`${API_BASE}/ml/candidate-models?problem_type=${problemType}`);
    return handleResponse(res);
  },

  getInsights: async (): Promise<InsightItem[]> => {
    const res = await fetch(`${API_BASE}/insights`);
    return handleResponse(res);
  },

  getBeforeAfter: async (): Promise<BeforeAfterResponse> => {
    const res = await fetch(`${API_BASE}/before-after`);
    return handleResponse(res);
  },

  getPresentationSlides: async (): Promise<PresentationSlide[]> => {
    const res = await fetch(`${API_BASE}/presentation-slides`);
    return handleResponse(res);
  },

  getExportCleanCsvUrl: () => `${API_BASE}/export/clean-csv`,
};
