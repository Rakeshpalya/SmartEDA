export interface OperationExplanation {
  problem: string;
  why_it_matters: string;
  technique: string;
  what_changed: string;
  improvement_reason: string;
  before_count?: number;
  after_count?: number;
  before_type?: string;
  after_type?: string;
  before_range?: [number, number];
  after_range?: [number, number];
  samples_before?: string[];
  samples_after?: string[];
}

export interface QualityBreakdownItem {
  factor: string;
  deduction: number;
  detail: string;
}

export interface DatasetSummary {
  filename: string;
  rows: number;
  columns: number;
  raw_rows: number;
  raw_columns: number;
  memory_usage_mb: number;
  numeric_columns_count: number;
  categorical_columns_count: number;
  date_columns_count: number;
  boolean_columns_count: number;
  id_columns_count: number;
  missing_values_count: number;
  missing_percentage: number;
  duplicate_rows_count: number;
  duplicate_percentage: number;
  data_quality_score: number;
  data_quality_grade: string;
  data_quality_breakdown: QualityBreakdownItem[];
  column_types: Record<string, string>;
  column_names: string[];
  is_cleaned: boolean;
  audit_steps_count: number;
  constant_columns: string[];
  total_outliers_detected: number;
  inconsistent_columns_count: number;
}

export interface TableRecord {
  _index: number;
  [key: string]: any;
}

export interface RawTableResponse {
  columns: string[];
  records: TableRecord[];
  head_records: TableRecord[];
  tail_records: TableRecord[];
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  educational_note: {
    why_head_tail: string;
  };
}

export interface ColumnInspection {
  column: string;
  dtype: string;
  role: string;
  non_null_count: number;
  missing_count: number;
  missing_pct: number;
  unique_count: number;
  memory_bytes: number;
  recommended_action: string;
  samples: string[];
}

export interface NumericSummary {
  column: string;
  count: number;
  mean: number;
  median: number;
  std: number;
  variance: number;
  min: number;
  q1: number;
  q2: number;
  q3: number;
  max: number;
  iqr: number;
  skewness: number;
  skewness_type: string;
}

export interface InspectionResponse {
  shape: { rows: number; columns: number };
  columns: ColumnInspection[];
  numeric_summary: NumericSummary[];
}

export interface MissingColumnItem {
  column: string;
  missing_current: number;
  missing_raw: number;
  percentage: number;
  role: string;
  dtype?: string;
  skewness?: number | null;
  recommended_strategy: string;
  why_recommendation?: string;
  resolved: boolean;
}

export interface MissingStrategyInfo {
  strategy: string;
  label: string;
  description: string;
  for_types?: string[];
}

export interface MissingAnalysisResponse {
  total_missing_current: number;
  total_missing_raw: number;
  total_resolved: number;
  affected_columns_count: number;
  treatment_candidates?: MissingColumnItem[];
  columns: MissingColumnItem[];
  strategies_available: MissingStrategyInfo[];
}

export interface DuplicateAnalysisResponse {
  duplicates_current: number;
  duplicates_raw: number;
  duplicates_removed: number;
  duplicates_percentage: number;
  sample_duplicates: TableRecord[];
  educational_explanation: {
    why_problem: string;
    solution: string;
  };
}

export interface InconsistentColumnItem {
  column: string;
  raw_unique_count: number;
  clean_unique_count: number;
  difference: number;
  variations: Record<string, string[]>;
  recommended_action: string;
  raw_counts?: Record<string, number>;
  clean_counts?: Record<string, number>;
  is_cleaned?: boolean;
  operation_name?: string;
}

export interface InconsistentAnalysisResponse {
  inconsistent_columns: InconsistentColumnItem[];
  total_found: number;
  educational_explanation: {
    what_is_it: string;
    why_it_matters: string;
  };
}

export interface CategoricalDistributionItem {
  category: string;
  count: number;
  percentage: number;
}

export interface CategoricalAnalysisResponse {
  column: string;
  total_valid_count: number;
  unique_categories: number;
  top_category: string;
  top_count: number;
  top_percentage: number;
  least_category: string;
  least_count: number;
  distribution: CategoricalDistributionItem[];
  interpretation: string;
}

export interface NumericalAnalysisResponse {
  column: string;
  count: number;
  mean: number;
  median: number;
  mode: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  skewness_explanation: string;
  box_plot: {
    min: number;
    lower_whisker: number;
    q1: number;
    median: number;
    q3: number;
    upper_whisker: number;
    max: number;
    lower_bound: number;
    upper_bound: number;
    outliers_count: number;
    outliers_samples: number[];
  };
  histogram: Array<{
    bin_label: string;
    count: number;
    start: number;
    end: number;
  }>;
}

export interface OutlierAnalysisResponse {
  column: string;
  method: string;
  threshold: number;
  q1: number;
  q3: number;
  iqr: number;
  lower_bound: number;
  upper_bound: number;
  outliers_count: number;
  outliers_percentage: number;
  sample_outlier_values: number[];
  box_data: any;
  educational_explanation: {
    why_care: string;
    validity_note: string;
  };
}

export interface CorrelationPair {
  col1: string;
  col2: string;
  correlation: number;
  abs_val: number;
}

export interface CorrelationResponse {
  columns: string[];
  method: string;
  matrix: Array<{ column: string; [key: string]: any }>;
  pairs: CorrelationPair[];
  strong_positive_count: number;
  strong_negative_count: number;
  weak_count: number;
  top_pair_insight: string;
  educational_note: string;
}

export interface TargetAnalysisResponse {
  target_column: string;
  problem_type: string;
  classes_count?: number;
  total_records: number;
  distribution?: Array<{ class: string; count: number; percentage: number }>;
  is_imbalanced?: boolean;
  warning?: string | null;
  stats?: NumericalAnalysisResponse;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface EvaluatedModel {
  algorithm: string;
  model_name: string;
  training_time_ms: number;
  train_size: number;
  test_size: number;
  train_score: number;
  test_score: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  confusion_matrix?: number[][];
  classes?: string[];
  r2_score?: number;
  mae?: number;
  mse?: number;
  rmse?: number;
  feature_importances?: FeatureImportanceItem[];
}

export interface MLTrainResponse {
  problem_type: string;
  target_column: string;
  feature_columns: string[];
  split_info: {
    train_samples: number;
    test_samples: number;
    split_ratio: string;
    random_state: number;
    scaling: string;
    encoding: string;
  };
  models_evaluated: EvaluatedModel[];
  recommended_model: string;
  recommended_algorithm: string;
  recommendation_reason: string;
  data_leakage_safeguard: string;
}

export interface InsightItem {
  category: string;
  title: string;
  text: string;
}


export interface PresentationSlide {
  slide_number: number;
  title: string;
  subtitle: string;
  bullet_points: string[];
  metrics: Array<{ label: string; value: string }>;
  presenter_notes: string;
}

export interface BeforeAfterMetric {
  rows: number;
  columns: number;
  missing_values: number;
  duplicates: number;
  outliers: number;
  inconsistencies: number;
  quality_score: number;
  grade: string;
}

export interface BeforeAfterResponse {
  raw: BeforeAfterMetric;
  cleaned: BeforeAfterMetric;
  audit_steps: Array<{
    step: number;
    operation: string;
    column?: string;
    explanation: OperationExplanation;
  }>;
}
