import os
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

class AppState:
    def __init__(self):
        self.filename: str = "student_performance_raw.csv"
        self.raw_df: Optional[pd.DataFrame] = None
        self.current_df: Optional[pd.DataFrame] = None
        self.audit_log: List[Dict[str, Any]] = []
        self.trained_models: Dict[str, Any] = {}
        self.ml_results: Dict[str, Any] = {}
        self._init_demo()

    def _init_demo(self):
        demo_paths = [
            "c:/Users/rakes/OneDrive/New folder/MLpro/backend/data/student_performance_raw.csv",
            "c:/Users/rakes/OneDrive/New folder/MLpro/data/student_performance_raw.csv",
            os.path.join(os.path.dirname(__file__), "..", "data", "student_performance_raw.csv")
        ]
        for p in demo_paths:
            if os.path.exists(p):
                try:
                    df = pd.read_csv(p)
                    self.load_dataset(df, "student_performance_raw.csv")
                    break
                except Exception as e:
                    print(f"Error loading demo dataset from {p}: {e}")

    def load_dataset(self, df: pd.DataFrame, filename: str):
        self.filename = filename
        self.raw_df = df.copy(deep=True)
        self.current_df = df.copy(deep=True)
        self.audit_log = []
        self.trained_models = {}
        self.ml_results = {}

    def reset_dataset(self):
        if self.raw_df is not None:
            self.current_df = self.raw_df.copy(deep=True)
            self.audit_log = []
            self.trained_models = {}
            self.ml_results = {}

    def log_operation(self, operation: str, column: Optional[str], details: Dict[str, Any], explanation: Dict[str, Any]):
        step_num = len(self.audit_log) + 1
        entry = {
            "step": step_num,
            "operation": operation,
            "column": column,
            "details": details,
            "explanation": explanation,
            "rows_after": len(self.current_df) if self.current_df is not None else 0,
            "cols_after": len(self.current_df.columns) if self.current_df is not None else 0,
            "missing_after": int(self.current_df.isna().sum().sum()) if self.current_df is not None else 0,
            "duplicates_after": int(self.current_df.duplicated().sum()) if self.current_df is not None else 0
        }
        self.audit_log.append(entry)

state = AppState()
