import math
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from scipy import stats

def safe_val(v):
    if v is None:
        return None
    if isinstance(v, (np.integer, int)):
        return int(v)
    if isinstance(v, (np.floating, float)):
        if np.isnan(v) or np.isinf(v):
            return None
        return round(float(v), 4)
    if pd.isna(v):
        return None
    return str(v)

class EDAService:
    @staticmethod
    def classify_column(series: pd.Series, col_name: str) -> str:
        # Check ID
        lower_name = col_name.lower()
        if "id" in lower_name and (series.nunique() / max(len(series), 1)) > 0.8:
            return "ID"
        
        # Check datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            return "Datetime"
        
        # Check boolean
        if pd.api.types.is_bool_dtype(series) or (series.dropna().isin([True, False, 0, 1, 'True', 'False', 'true', 'false']).all() and series.nunique() <= 2):
            return "Boolean"

        # Check numerical
        if pd.api.types.is_numeric_dtype(series):
            if series.nunique() <= 4 and len(series) > 50:
                return "Categorical"
            return "Numerical"
        
        # Categorical vs Text
        if series.nunique() <= 30 or (series.nunique() / max(len(series), 1)) < 0.2:
            return "Categorical"
        
        return "Text"

    @classmethod
    def get_overview(cls, current_df: pd.DataFrame, raw_df: pd.DataFrame, filename: str, audit_count: int) -> Dict[str, Any]:
        rows, cols = current_df.shape
        raw_rows, raw_cols = raw_df.shape
        mem_bytes = current_df.memory_usage(deep=True).sum()
        mem_mb = round(mem_bytes / (1024 * 1024), 2)
        
        col_types = {col: cls.classify_column(current_df[col], col) for col in current_df.columns}
        num_cols = sum(1 for t in col_types.values() if t == "Numerical")
        cat_cols = sum(1 for t in col_types.values() if t in ["Categorical", "Text"])
        date_cols = sum(1 for t in col_types.values() if t == "Datetime")
        bool_cols = sum(1 for t in col_types.values() if t == "Boolean")
        id_cols = sum(1 for t in col_types.values() if t == "ID")
        
        total_missing = int(current_df.isna().sum().sum())
        total_cells = max(rows * cols, 1)
        missing_pct = round((total_missing / total_cells) * 100, 2)
        
        duplicates_count = int(current_df.duplicated().sum())
        duplicates_pct = round((duplicates_count / max(rows, 1)) * 100, 2)

        # Health score calculation
        score = 100
        breakdown = []

        # 1. Missing values penalty (up to 30)
        missing_penalty = min(30, int(missing_pct * 3.0))
        if missing_penalty > 0:
            score -= missing_penalty
            breakdown.append({
                "factor": "Missing Values",
                "deduction": missing_penalty,
                "detail": f"{total_missing} missing cells ({missing_pct}% of dataset)"
            })
        else:
            breakdown.append({
                "factor": "Missing Values",
                "deduction": 0,
                "detail": "No missing values present (0%)"
            })

        # 2. Duplicate rows penalty (up to 25)
        dup_penalty = min(25, int(duplicates_pct * 4.0))
        if dup_penalty > 0:
            score -= dup_penalty
            breakdown.append({
                "factor": "Duplicate Rows",
                "deduction": dup_penalty,
                "detail": f"{duplicates_count} duplicate rows ({duplicates_pct}%)"
            })
        else:
            breakdown.append({
                "factor": "Duplicate Rows",
                "deduction": 0,
                "detail": "No duplicate rows detected"
            })

        # 3. Constant columns penalty (up to 15)
        constant_cols = [c for c in current_df.columns if current_df[c].nunique(dropna=False) <= 1]
        if constant_cols:
            c_penalty = min(15, len(constant_cols) * 5)
            score -= c_penalty
            breakdown.append({
                "factor": "Constant Columns",
                "deduction": c_penalty,
                "detail": f"{len(constant_cols)} columns have zero variance ({', '.join(constant_cols)})"
            })

        # 4. Outliers penalty (up to 15)
        outlier_total = 0
        for col in current_df.select_dtypes(include=[np.number]).columns:
            s = current_df[col].dropna()
            if len(s) > 10:
                q1 = s.quantile(0.25)
                q3 = s.quantile(0.75)
                iqr = q3 - q1
                if iqr > 0:
                    outs = ((s < (q1 - 1.5 * iqr)) | (s > (q3 + 1.5 * iqr))).sum()
                    outlier_total += int(outs)
        
        if outlier_total > 0:
            out_penalty = min(15, int(math.ceil(outlier_total / 2)))
            score -= out_penalty
            breakdown.append({
                "factor": "Outliers Detected",
                "deduction": out_penalty,
                "detail": f"{outlier_total} potential outlier observations in numeric features"
            })

        # 5. Inconsistent casing / leading whitespace check (up to 15)
        inconsistency_count = 0
        for col in current_df.select_dtypes(include=['object']).columns:
            vals = current_df[col].dropna().astype(str).tolist()
            stripped = [v.strip().lower() for v in vals]
            if len(set(vals)) > len(set(stripped)):
                inconsistency_count += 1
        
        if inconsistency_count > 0:
            inc_penalty = min(15, inconsistency_count * 5)
            score -= inc_penalty
            breakdown.append({
                "factor": "Inconsistent Categoricals",
                "deduction": inc_penalty,
                "detail": f"{inconsistency_count} text columns have casing or whitespace discrepancies"
            })

        final_score = max(0, min(100, score))
        if final_score >= 90:
            grade = "Excellent"
        elif final_score >= 75:
            grade = "Good"
        elif final_score >= 50:
            grade = "Needs Cleaning"
        else:
            grade = "Poor / High Risk"

        return {
            "filename": filename,
            "rows": rows,
            "columns": cols,
            "raw_rows": raw_rows,
            "raw_columns": raw_cols,
            "memory_usage_mb": mem_mb,
            "numeric_columns_count": num_cols,
            "categorical_columns_count": cat_cols,
            "date_columns_count": date_cols,
            "boolean_columns_count": bool_cols,
            "id_columns_count": id_cols,
            "missing_values_count": total_missing,
            "missing_percentage": missing_pct,
            "duplicate_rows_count": duplicates_count,
            "duplicate_percentage": duplicates_pct,
            "data_quality_score": final_score,
            "data_quality_grade": grade,
            "data_quality_breakdown": breakdown,
            "column_types": col_types,
            "column_names": list(current_df.columns),
            "is_cleaned": audit_count > 0,
            "audit_steps_count": audit_count,
            "constant_columns": constant_cols,
            "total_outliers_detected": outlier_total,
            "inconsistent_columns_count": inconsistency_count
        }

    @classmethod
    def get_raw_table(cls, df: pd.DataFrame, page: int = 1, page_size: int = 15, search: str = "", sort_by: str = "", sort_asc: bool = True) -> Dict[str, Any]:
        temp_df = df.copy()
        
        # Apply search if specified
        if search.strip():
            s = search.strip().lower()
            mask = temp_df.astype(str).apply(lambda row: row.str.lower().str.contains(s).any(), axis=1)
            temp_df = temp_df[mask]

        # Apply sorting if specified
        if sort_by and sort_by in temp_df.columns:
            temp_df = temp_df.sort_values(by=sort_by, ascending=sort_asc)

        total_records = len(temp_df)
        total_pages = max(1, math.ceil(total_records / page_size))
        page = max(1, min(page, total_pages))
        
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        page_slice = temp_df.iloc[start_idx:end_idx]
        
        records = []
        for idx, row in page_slice.iterrows():
            row_dict = {"_index": int(idx)}
            for col in temp_df.columns:
                row_dict[col] = safe_val(row[col])
            records.append(row_dict)

        # Head 10 & Tail 10
        head_records = []
        for idx, row in df.head(10).iterrows():
            row_dict = {"_index": int(idx)}
            for col in df.columns:
                row_dict[col] = safe_val(row[col])
            head_records.append(row_dict)

        tail_records = []
        for idx, row in df.tail(10).iterrows():
            row_dict = {"_index": int(idx)}
            for col in df.columns:
                row_dict[col] = safe_val(row[col])
            tail_records.append(row_dict)

        return {
            "columns": list(df.columns),
            "records": records,
            "head_records": head_records,
            "tail_records": tail_records,
            "page": page,
            "page_size": page_size,
            "total_records": total_records,
            "total_pages": total_pages,
            "educational_note": {
                "why_head_tail": "Inspecting head() and tail() allows data scientists to quickly verify column alignment, check for header corruptions, preview diverse records, and catch trailing summary rows or truncation issues."
            }
        }

    @classmethod
    def get_inspection(cls, df: pd.DataFrame) -> Dict[str, Any]:
        rows, cols = df.shape
        col_info = []

        for col in df.columns:
            s = df[col]
            missing_cnt = int(s.isna().sum())
            missing_pct = round((missing_cnt / max(rows, 1)) * 100, 2)
            non_null_cnt = rows - missing_cnt
            unique_cnt = int(s.nunique(dropna=True))
            mem = int(s.memory_usage(deep=True))
            role = cls.classify_column(s, col)
            
            # Recommendation
            rec = "Keep as is"
            if role == "Categorical" and s.dtype == 'object':
                rec = "Convert to 'category' or clean casing"
            elif role == "Numerical" and not pd.api.types.is_numeric_dtype(s):
                rec = "Cast to numeric (pd.to_numeric)"
            elif role == "Datetime" and not pd.api.types.is_datetime64_any_dtype(s):
                rec = "Convert to datetime"
            elif missing_pct > 60:
                rec = "Consider dropping (too many missing values)"
            elif missing_cnt > 0:
                rec = f"Impute missing ({'median' if role == 'Numerical' else 'mode'})"

            # Sample values (up to 3 non-null)
            samples = [str(v) for v in s.dropna().head(3).tolist()]

            col_info.append({
                "column": col,
                "dtype": str(s.dtype),
                "role": role,
                "non_null_count": non_null_cnt,
                "missing_count": missing_cnt,
                "missing_pct": missing_pct,
                "unique_count": unique_cnt,
                "memory_bytes": mem,
                "recommended_action": rec,
                "samples": samples
            })

        # Numeric describe summary
        num_summary = []
        for col in df.select_dtypes(include=[np.number]).columns:
            s = df[col].dropna()
            if len(s) > 0:
                mean_v = float(s.mean())
                med_v = float(s.median())
                std_v = float(s.std()) if len(s) > 1 else 0.0
                var_v = float(s.var()) if len(s) > 1 else 0.0
                min_v = float(s.min())
                q1_v = float(s.quantile(0.25))
                q2_v = float(s.quantile(0.50))
                q3_v = float(s.quantile(0.75))
                max_v = float(s.max())
                iqr_v = q3_v - q1_v
                skew_v = float(s.skew()) if len(s) > 2 else 0.0

                num_summary.append({
                    "column": col,
                    "count": len(s),
                    "mean": round(mean_v, 2),
                    "median": round(med_v, 2),
                    "std": round(std_v, 2),
                    "variance": round(var_v, 2),
                    "min": round(min_v, 2),
                    "q1": round(q1_v, 2),
                    "q2": round(q2_v, 2),
                    "q3": round(q3_v, 2),
                    "max": round(max_v, 2),
                    "iqr": round(iqr_v, 2),
                    "skewness": round(skew_v, 2),
                    "skewness_type": "Right-skewed" if skew_v > 0.5 else ("Left-skewed" if skew_v < -0.5 else "Symmetric")
                })

        return {
            "shape": {"rows": rows, "columns": cols},
            "columns": col_info,
            "numeric_summary": num_summary
        }

    @classmethod
    def get_missing_analysis(cls, current_df: pd.DataFrame, raw_df: pd.DataFrame) -> Dict[str, Any]:
        rows = len(current_df)
        total_missing_current = int(current_df.isna().sum().sum())
        total_missing_raw = int(raw_df.isna().sum().sum())
        
        column_breakdown = []
        treatment_candidates = []
        for col in current_df.columns:
            m_curr = int(current_df[col].isna().sum())
            m_raw = int(raw_df[col].isna().sum()) if col in raw_df.columns else 0
            pct_curr = round((m_curr / max(rows, 1)) * 100, 2)
            role = cls.classify_column(current_df[col], col)
            dtype_str = str(current_df[col].dtype)
            
            skew_val = None
            if pd.api.types.is_numeric_dtype(current_df[col]):
                s_valid = current_df[col].dropna()
                if len(s_valid) > 2:
                    skew_val = round(float(s_valid.skew()), 2)

            # Recommendation logic
            if m_curr > 0:
                if role == "Numerical" or pd.api.types.is_numeric_dtype(current_df[col]):
                    if skew_val is not None and abs(skew_val) > 0.5:
                        rec_strat = "median"
                        rec_why = f"The distribution has noticeable skewness ({skew_val}). Median imputation is resistant to extreme values and preserves central tendency."
                    else:
                        rec_strat = "mean"
                        rec_why = f"The distribution is reasonably symmetric (skewness = {skew_val or 0.0}). Arithmetic mean imputation preserves the distribution center."
                else:
                    rec_strat = "mode"
                    rec_why = "Categorical features lack mathematical averages. Mode imputation replaces missing entries with the most frequent category."
            else:
                rec_strat = "none"
                rec_why = "No missing values detected in this feature. Imputation is unnecessary."

            item = {
                "column": col,
                "missing_current": m_curr,
                "missing_raw": m_raw,
                "percentage": pct_curr,
                "role": role,
                "dtype": dtype_str,
                "skewness": skew_val,
                "recommended_strategy": rec_strat,
                "why_recommendation": rec_why,
                "resolved": (m_raw > 0 and m_curr == 0)
            }
            column_breakdown.append(item)
            if m_curr > 0:
                treatment_candidates.append(item)

        # Sort columns with missing values first
        column_breakdown.sort(key=lambda x: x["missing_current"], reverse=True)
        treatment_candidates.sort(key=lambda x: x["missing_current"], reverse=True)

        return {
            "total_missing_current": total_missing_current,
            "total_missing_raw": total_missing_raw,
            "total_resolved": max(0, total_missing_raw - total_missing_current),
            "affected_columns_count": len(treatment_candidates),
            "treatment_candidates": treatment_candidates,
            "columns": column_breakdown,
            "strategies_available": [
                {"strategy": "median", "label": "Median Imputation", "for_types": ["Numerical"], "description": "Fills with 50th percentile. Highly recommended for skewed numerical data; robust to outliers."},
                {"strategy": "mean", "label": "Mean Imputation", "for_types": ["Numerical"], "description": "Fills with arithmetic average. Best for symmetric, bell-curved numerical data without heavy skewness."},
                {"strategy": "mode", "label": "Mode Imputation", "for_types": ["Categorical", "Text", "Boolean"], "description": "Fills with most frequent value. Essential for categorical/discrete attributes."},
                {"strategy": "constant", "label": "Custom Constant Value", "for_types": ["Numerical", "Categorical", "Text"], "description": "Fills with an explicit indicator value (e.g., 'Unknown' or 0)."},
                {"strategy": "drop_rows", "label": "Drop Rows", "for_types": ["Numerical", "Categorical", "Text"], "description": "Removes any record containing missing values in this column. Best when missing rate is very low (< 3%)."},
                {"strategy": "drop_column", "label": "Drop Column", "for_types": ["Numerical", "Categorical", "Text"], "description": "Removes the column completely. Best when > 50% values are missing and column offers little predictive power."},
                {"strategy": "ffill", "label": "Forward Fill", "for_types": ["Numerical", "Categorical", "Text"], "description": "Propagates last valid observation forward. Ideal for sequential observations."},
                {"strategy": "bfill", "label": "Backward Fill", "for_types": ["Numerical", "Categorical", "Text"], "description": "Propagates next valid observation backward."}
            ]
        }

    @classmethod
    def get_duplicate_analysis(cls, current_df: pd.DataFrame, raw_df: pd.DataFrame) -> Dict[str, Any]:
        curr_dups = int(current_df.duplicated().sum())
        raw_dups = int(raw_df.duplicated().sum())
        removed_count = max(0, raw_dups - curr_dups)

        # Sample duplicated rows
        dup_rows_slice = current_df[current_df.duplicated(keep=False)].head(10)
        dup_samples = []
        for idx, row in dup_rows_slice.iterrows():
            row_dict = {"_index": int(idx)}
            for col in current_df.columns:
                row_dict[col] = safe_val(row[col])
            dup_samples.append(row_dict)

        return {
            "duplicates_current": curr_dups,
            "duplicates_raw": raw_dups,
            "duplicates_removed": removed_count,
            "duplicates_percentage": round((curr_dups / max(len(current_df), 1)) * 100, 2),
            "sample_duplicates": dup_samples,
            "educational_explanation": {
                "why_problem": "Duplicate rows inflate statistical metrics, artificially shrink standard error, and cause data leakage or overfitting when duplicates appear across both train and test splits.",
                "solution": "pandas drop_duplicates() removes redundant rows while preserving the first valid occurrence."
            }
        }

    @classmethod
    def get_inconsistent_analysis(cls, current_df: pd.DataFrame, raw_df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        inconsistencies = []
        source_df = raw_df if raw_df is not None else current_df

        for col in source_df.select_dtypes(include=['object']).columns:
            series = source_df[col].dropna().astype(str)
            raw_unique = series.unique().tolist()
            normalized_unique = list(set([v.strip().lower() for v in raw_unique]))
            
            # Check if trimming/lowercasing reduces unique count
            if len(raw_unique) > len(normalized_unique):
                # Group variations
                groups = {}
                for val in raw_unique:
                    key = val.strip().lower()
                    if key not in groups:
                        groups[key] = []
                    groups[key].append(val)
                
                flagged_groups = {k: v for k, v in groups.items() if len(v) > 1}
                if flagged_groups:
                    # Dynamic raw counts
                    vc_raw = series.value_counts()
                    raw_counts = {str(k): int(v) for k, v in vc_raw.items()}

                    # Dynamic clean counts (projected or actual)
                    is_gender = col.lower() == "gender"
                    if is_gender:
                        def _map_g(v):
                            c = str(v).strip().lower()
                            if c in ["male", "m", "man"]:
                                return "Male"
                            if c in ["female", "f", "woman"]:
                                return "Female"
                            return str(v).strip().title()
                        mapped_s = series.map(_map_g)
                    else:
                        mapped_s = series.map(lambda v: str(v).strip().title())

                    clean_counts = {str(k): int(v) for k, v in mapped_s.value_counts().items()}

                    # Check if current_df is already cleaned
                    is_cleaned = False
                    if col in current_df.columns:
                        curr_s = current_df[col].dropna().astype(str)
                        curr_u = curr_s.unique()
                        if len(curr_u) == len(set([v.strip().lower() for v in curr_u])) and len(curr_u) < len(raw_unique):
                            is_cleaned = True
                            clean_counts = {str(k): int(v) for k, v in curr_s.value_counts().items()}

                    inconsistencies.append({
                        "column": col,
                        "raw_unique_count": len(raw_unique),
                        "clean_unique_count": len(clean_counts),
                        "difference": len(raw_unique) - len(clean_counts),
                        "variations": flagged_groups,
                        "recommended_action": "canonical",
                        "raw_counts": raw_counts,
                        "clean_counts": clean_counts,
                        "is_cleaned": is_cleaned,
                        "operation_name": "Gender Category Normalization" if is_gender else f"{col.replace('_', ' ').title()} Normalization"
                    })

        return {
            "inconsistent_columns": inconsistencies,
            "total_found": len(inconsistencies),
            "educational_explanation": {
                "what_is_it": "Inconsistent casing ('Male' vs 'male') and accidental whitespace (' Bangalore' vs 'Bangalore') cause algorithms and pandas value_counts() to treat the same entity as distinct categories.",
                "why_it_matters": "Creates spurious categories, fragments statistical power, and inflates one-hot encoded matrix dimensions needlessly."
            }
        }

    @classmethod
    def get_categorical_analysis(cls, df: pd.DataFrame, column: str) -> Dict[str, Any]:
        if column not in df.columns:
            return {"error": f"Column {column} not found"}

        s = df[column].dropna().astype(str)
        total = len(s)
        vc = s.value_counts()
        
        distribution = []
        for val, count in vc.items():
            pct = round((count / max(total, 1)) * 100, 2)
            distribution.append({
                "category": str(val),
                "count": int(count),
                "percentage": pct
            })

        top_cat = str(vc.index[0]) if len(vc) > 0 else "N/A"
        top_count = int(vc.iloc[0]) if len(vc) > 0 else 0
        top_pct = round((top_count / max(total, 1)) * 100, 1)

        least_cat = str(vc.index[-1]) if len(vc) > 0 else "N/A"
        least_count = int(vc.iloc[-1]) if len(vc) > 0 else 0

        interpretation = f"'{top_cat}' is the dominant category, representing {top_pct}% ({top_count} observations) of the data."
        if len(vc) > 1 and (top_count / max(least_count, 1)) > 3:
            interpretation += f" Noticeable disparity compared to '{least_cat}' ({least_count} observations)."

        return {
            "column": column,
            "total_valid_count": total,
            "unique_categories": int(s.nunique()),
            "top_category": top_cat,
            "top_count": top_count,
            "top_percentage": top_pct,
            "least_category": least_cat,
            "least_count": least_count,
            "distribution": distribution,
            "interpretation": interpretation
        }

    @classmethod
    def get_numerical_analysis(cls, df: pd.DataFrame, column: str) -> Dict[str, Any]:
        if column not in df.columns or not pd.api.types.is_numeric_dtype(df[column]):
            return {"error": f"Column {column} is not a valid numerical column"}

        s = df[column].dropna()
        n = len(s)
        if n == 0:
            return {"error": f"Column {column} has no non-null values"}

        mean_v = float(s.mean())
        median_v = float(s.median())
        mode_series = s.mode()
        mode_v = float(mode_series.iloc[0]) if len(mode_series) > 0 else mean_v
        std_v = float(s.std()) if n > 1 else 0.0
        var_v = float(s.var()) if n > 1 else 0.0
        min_v = float(s.min())
        max_v = float(s.max())
        q1_v = float(s.quantile(0.25))
        q2_v = float(s.quantile(0.50))
        q3_v = float(s.quantile(0.75))
        iqr_v = q3_v - q1_v
        skew_v = float(s.skew()) if n > 2 else 0.0
        kurt_v = float(s.kurtosis()) if n > 3 else 0.0

        # Skewness explanation
        if skew_v > 0.5:
            skew_desc = f"Positively skewed (right-skewed, skewness = {round(skew_v, 2)}). The tail on the right is longer, and the mean ({round(mean_v, 2)}) is noticeably higher than the median ({round(median_v, 2)})."
        elif skew_v < -0.5:
            skew_desc = f"Negatively skewed (left-skewed, skewness = {round(skew_v, 2)}). The tail on the left is longer, and the mean ({round(mean_v, 2)}) is lower than the median ({round(median_v, 2)})."
        else:
            skew_desc = f"Approximately symmetric (skewness = {round(skew_v, 2)}). Mean ({round(mean_v, 2)}) and median ({round(median_v, 2)}) are close, resembling a standard bell distribution."

        # Outliers bounds
        lower_bound = q1_v - 1.5 * iqr_v
        upper_bound = q3_v + 1.5 * iqr_v
        outliers_series = s[(s < lower_bound) | (s > upper_bound)]
        outliers_count = len(outliers_series)

        # Histogram bins (10 equal bins)
        bins_count = 10
        hist_data = []
        if min_v < max_v:
            counts, bin_edges = np.histogram(s, bins=bins_count)
            for i in range(len(counts)):
                b_start = round(float(bin_edges[i]), 1)
                b_end = round(float(bin_edges[i+1]), 1)
                hist_data.append({
                    "bin_label": f"{b_start}-{b_end}",
                    "count": int(counts[i]),
                    "start": b_start,
                    "end": b_end
                })

        return {
            "column": column,
            "count": n,
            "mean": round(mean_v, 2),
            "median": round(median_v, 2),
            "mode": round(mode_v, 2),
            "std": round(std_v, 2),
            "variance": round(var_v, 2),
            "min": round(min_v, 2),
            "max": round(max_v, 2),
            "range": round(max_v - min_v, 2),
            "q1": round(q1_v, 2),
            "q2": round(q2_v, 2),
            "q3": round(q3_v, 2),
            "iqr": round(iqr_v, 2),
            "skewness": round(skew_v, 2),
            "kurtosis": round(kurt_v, 2),
            "skewness_explanation": skew_desc,
            "box_plot": {
                "min": round(min_v, 2),
                "lower_whisker": round(max(min_v, lower_bound), 2),
                "q1": round(q1_v, 2),
                "median": round(median_v, 2),
                "q3": round(q3_v, 2),
                "upper_whisker": round(min(max_v, upper_bound), 2),
                "max": round(max_v, 2),
                "lower_bound": round(lower_bound, 2),
                "upper_bound": round(upper_bound, 2),
                "outliers_count": outliers_count,
                "outliers_samples": [round(float(v), 2) for v in outliers_series.head(5).tolist()]
            },
            "histogram": hist_data
        }

    @classmethod
    def get_outlier_analysis(cls, df: pd.DataFrame, column: str, method: str = "iqr", threshold: float = 1.5) -> Dict[str, Any]:
        if column not in df.columns or not pd.api.types.is_numeric_dtype(df[column]):
            return {"error": f"Column {column} is not numeric"}

        s = df[column].dropna()
        if len(s) == 0:
            return {"error": "Column has no data"}

        q1 = float(s.quantile(0.25))
        q3 = float(s.quantile(0.75))
        iqr = q3 - q1

        if method == "iqr":
            lower_bound = q1 - threshold * iqr
            upper_bound = q3 + threshold * iqr
        else: # z-score
            mean_v = float(s.mean())
            std_v = float(s.std()) if len(s) > 1 else 1.0
            lower_bound = mean_v - threshold * std_v
            upper_bound = mean_v + threshold * std_v

        outlier_mask = (s < lower_bound) | (s > upper_bound)
        outlier_records = s[outlier_mask]
        outlier_count = len(outlier_records)

        # Build boxplot statistics for visualization
        box_data = {
            "column": column,
            "min": round(float(s.min()), 2),
            "q1": round(q1, 2),
            "median": round(float(s.median()), 2),
            "q3": round(q3, 2),
            "max": round(float(s.max()), 2),
            "iqr": round(iqr, 2),
            "lower_bound": round(lower_bound, 2),
            "upper_bound": round(upper_bound, 2),
            "outliers_count": outlier_count
        }

        return {
            "column": column,
            "method": method,
            "threshold": threshold,
            "q1": round(q1, 2),
            "q3": round(q3, 2),
            "iqr": round(iqr, 2),
            "lower_bound": round(lower_bound, 2),
            "upper_bound": round(upper_bound, 2),
            "outliers_count": outlier_count,
            "outliers_percentage": round((outlier_count / max(len(s), 1)) * 100, 2),
            "sample_outlier_values": [round(float(v), 2) for v in outlier_records.head(10).tolist()],
            "box_data": box_data,
            "educational_explanation": {
                "why_care": "Outliers skew statistical estimators (especially mean and variance), distort linear regression slopes, and degrade distance-based models like KNN and SVM.",
                "validity_note": "Crucial distinction: An outlier may be a genuine rare observation (e.g. exceptional student) or a data-entry error (e.g. 150 hours/week). Always evaluate domain context before blindly dropping!"
            }
        }

    @classmethod
    def get_correlation_matrix(cls, df: pd.DataFrame, method: str = "pearson") -> Dict[str, Any]:
        num_cols = list(df.select_dtypes(include=[np.number]).columns)
        if len(num_cols) < 2:
            return {"error": "Need at least 2 numeric columns for correlation analysis", "columns": [], "matrix": []}

        corr_df = df[num_cols].corr(method=method)

        matrix = []
        for r_col in num_cols:
            row_vals = {}
            for c_col in num_cols:
                val = corr_df.loc[r_col, c_col]
                row_vals[c_col] = round(float(val), 3) if not pd.isna(val) else 0.0
            matrix.append({"column": r_col, **row_vals})

        # Identify strong positive and negative correlations
        pairs = []
        for i in range(len(num_cols)):
            for j in range(i + 1, len(num_cols)):
                c1 = num_cols[i]
                c2 = num_cols[j]
                val = corr_df.loc[c1, c2]
                if not pd.isna(val):
                    pairs.append({
                        "col1": c1,
                        "col2": c2,
                        "correlation": round(float(val), 3),
                        "abs_val": abs(float(val))
                    })

        pairs.sort(key=lambda x: x["abs_val"], reverse=True)

        strong_positive = [p for p in pairs if p["correlation"] >= 0.5]
        strong_negative = [p for p in pairs if p["correlation"] <= -0.5]
        weak = [p for p in pairs if abs(p["correlation"]) < 0.2]

        top_pair_desc = ""
        if pairs:
            top = pairs[0]
            direction = "positive" if top["correlation"] > 0 else "negative"
            top_pair_desc = f"Strongest observed correlation is between '{top['col1']}' and '{top['col2']}' (r = {top['correlation']}, {direction})."

        return {
            "columns": num_cols,
            "method": method,
            "matrix": matrix,
            "pairs": pairs[:10],
            "strong_positive_count": len(strong_positive),
            "strong_negative_count": len(strong_negative),
            "weak_count": len(weak),
            "top_pair_insight": top_pair_desc,
            "educational_note": "Golden Rule of Data Science: Correlation does not imply causation. A high r-value indicates co-movement, not necessarily a direct causal mechanism."
        }

    @classmethod
    def get_target_analysis(cls, df: pd.DataFrame, target_col: str, problem_type: str = "classification") -> Dict[str, Any]:
        if target_col not in df.columns:
            return {"error": f"Target column '{target_col}' not found"}

        s = df[target_col].dropna()
        total = len(s)

        if problem_type == "classification" or s.nunique() <= 10:
            vc = s.value_counts()
            distribution = []
            for k, count in vc.items():
                pct = round((count / max(total, 1)) * 100, 2)
                distribution.append({"class": str(k), "count": int(count), "percentage": pct})

            is_imbalanced = False
            warning = None
            if len(vc) >= 2:
                ratio = vc.iloc[0] / max(vc.iloc[-1], 1)
                if ratio > 2.0:
                    is_imbalanced = True
                    warning = f"Target classes are imbalanced (ratio {round(ratio, 1)}:1). Consider stratified train/test split or evaluation metrics like F1-score / Balanced Accuracy instead of raw accuracy."

            return {
                "target_column": target_col,
                "problem_type": "classification",
                "classes_count": len(vc),
                "total_records": total,
                "distribution": distribution,
                "is_imbalanced": is_imbalanced,
                "warning": warning
            }
        else:
            # Numerical regression target
            hist_res = cls.get_numerical_analysis(df, target_col)
            return {
                "target_column": target_col,
                "problem_type": "regression",
                "total_records": total,
                "stats": hist_res
            }
