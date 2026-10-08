from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

class OperationExplanation(BaseModel):
    problem: str
    why_it_matters: str
    technique: str
    what_changed: str
    improvement_reason: str

class DatasetSummary(BaseModel):
    filename: str
    rows: int
    columns: int
    size_bytes: int
    memory_usage_mb: float
    numeric_columns_count: int
    categorical_columns_count: int
    date_columns_count: int
    missing_values_count: int
    missing_percentage: float
    duplicate_rows_count: int
    duplicate_percentage: float
    data_quality_score: int
    data_quality_grade: str
    data_quality_breakdown: Dict[str, Any]
    column_names: List[str]
    is_cleaned: bool
    audit_steps_count: int

class MissingTreatmentRequest(BaseModel):
    column: str
    strategy: str # 'drop_rows', 'drop_column', 'mean', 'median', 'mode', 'ffill', 'bfill', 'constant'
    fill_value: Optional[Union[str, float, int]] = None

class DuplicateTreatmentRequest(BaseModel):
    subset: Optional[List[str]] = None
    keep: str = "first" # 'first', 'last'

class InconsistentTreatmentRequest(BaseModel):
    column: str
    action: str # 'strip_whitespace', 'lowercase', 'uppercase', 'titlecase', 'replace_map'
    replace_map: Optional[Dict[str, str]] = None

class DataTypeUpdateRequest(BaseModel):
    column: str
    target_type: str # 'numeric', 'datetime', 'string', 'category', 'boolean'

class OutlierTreatmentRequest(BaseModel):
    column: str
    method: str = "iqr" # 'iqr', 'zscore'
    action: str = "clip" # 'clip', 'remove'
    threshold: float = 1.5

class ColumnCleanRequest(BaseModel):
    action: str # 'rename', 'drop', 'standardize_names'
    column: Optional[str] = None
    new_name: Optional[str] = None

class MLTrainRequest(BaseModel):
    target_column: str
    problem_type: str # 'classification', 'regression'
    feature_columns: Optional[List[str]] = None
    algorithms: List[str] # ['random_forest', 'logistic_regression', ...]
    test_size: float = 0.20 # 0.20, 0.30, 0.10
    scaling_method: str = "standard" # 'standard', 'minmax', 'none'
    encoding_method: str = "onehot" # 'onehot', 'label'
    random_state: int = 42

class MLPredictionRequest(BaseModel):
    model_name: str
    feature_values: Dict[str, Any]
