from typing import Dict, Any, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

class CleaningService:
    @staticmethod
    def treat_missing(df: pd.DataFrame, column: str, strategy: str, fill_value: Optional[Union[str, float, int]] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        new_df = df.copy()
        if column not in new_df.columns:
            raise ValueError(f"Column '{column}' does not exist in dataset.")

        before_missing = int(new_df[column].isna().sum())
        total_rows_before = len(new_df)

        if before_missing == 0:
            raise ValueError(f"Column '{column}' contains 0 missing values. Missing-value treatment can only be performed on features with missing entries.")

        # Data type validation
        is_numeric = pd.api.types.is_numeric_dtype(new_df[column])
        if not is_numeric and strategy in ["mean", "median"]:
            raise ValueError(f"Strategy '{strategy}' is mathematically invalid for categorical/text column '{column}'. Mean and Median require numeric values. Please select Mode Imputation or Custom Value instead.")

        if strategy == "drop_rows":
            new_df = new_df.dropna(subset=[column]).reset_index(drop=True)
            after_missing = 0
            what_changed = f"Removed {before_missing} rows that had missing values in '{column}'. Dataset reduced from {total_rows_before} to {len(new_df)} rows."
            technique_name = "Listwise Row Deletion (dropna)"
            why_matter = "Missing values disrupt algorithmic execution and cause calculation errors in downstream statistical modules."
            improvement = "Leaves only complete observations, preventing missing-value propagation without injecting artificial imputed numbers."

        elif strategy == "drop_column":
            new_df = new_df.drop(columns=[column])
            after_missing = 0
            what_changed = f"Dropped entire column '{column}'. Columns reduced from {len(df.columns)} to {len(new_df.columns)}."
            technique_name = "Feature Elimination (drop)"
            why_matter = "Columns with excessive missingness or low informational value dilute machine learning predictive signals."
            improvement = "Eliminates high-sparsity features and avoids guessing unobserved attributes."

        elif strategy == "mean":
            col_mean = float(new_df[column].dropna().mean())
            new_df[column] = new_df[column].fillna(col_mean)
            after_missing = int(new_df[column].isna().sum())
            what_changed = f"Imputed {before_missing} missing cells in '{column}' using arithmetic mean ({round(col_mean, 2)})."
            technique_name = "Mean Imputation (fillna)"
            why_matter = "Missing cells restrict sample size and cause algorithmic exceptions in models requiring complete numerical matrices."
            improvement = "Preserves sample size and total sum without changing the overall sample mean."

        elif strategy == "median":
            col_median = float(new_df[column].dropna().median())
            new_df[column] = new_df[column].fillna(col_median)
            after_missing = int(new_df[column].isna().sum())
            what_changed = f"Imputed {before_missing} missing cells in '{column}' using median ({round(col_median, 2)})."
            technique_name = "Median Imputation (fillna)"
            why_matter = "Numerical columns with skewness or outliers are severely distorted by mean imputation."
            improvement = "The median is robust against extreme values, preserving central tendency without skewing the distribution."

        elif strategy == "mode":
            mode_series = new_df[column].dropna().mode()
            col_mode = mode_series.iloc[0] if len(mode_series) > 0 else "Unknown"
            new_df[column] = new_df[column].fillna(col_mode)
            after_missing = int(new_df[column].isna().sum())
            what_changed = f"Imputed {before_missing} missing cells in '{column}' with the most frequent value ('{col_mode}')."
            technique_name = "Mode Imputation (fillna)"
            why_matter = "Categorical columns lack mathematical means, requiring frequency-based estimation."
            improvement = "Maintains categorical validity and retains all records without injecting out-of-vocabulary labels."

        elif strategy == "ffill":
            new_df[column] = new_df[column].ffill()
            after_missing = int(new_df[column].isna().sum())
            what_changed = f"Forward-filled {before_missing - after_missing} missing values in '{column}' using adjacent prior values."
            technique_name = "Forward Fill (ffill)"
            why_matter = "Sequential or time-indexed data relies on chronological continuity."
            improvement = "Carries recent known states forward naturally."

        elif strategy == "bfill":
            new_df[column] = new_df[column].bfill()
            after_missing = int(new_df[column].isna().sum())
            what_changed = f"Backward-filled {before_missing - after_missing} missing values in '{column}' using subsequent values."
            technique_name = "Backward Fill (bfill)"
            why_matter = "Sequential gaps can be inferred from upcoming observations."
            improvement = "Ensures continuity without introducing external synthetic distributions."

        elif strategy == "constant":
            val = fill_value if (fill_value is not None and str(fill_value).strip() != "") else ("Missing" if not is_numeric else 0)
            if is_numeric:
                try:
                    val = float(val)
                except ValueError:
                    pass
            new_df[column] = new_df[column].fillna(val)
            after_missing = int(new_df[column].isna().sum())
            what_changed = f"Replaced {before_missing} missing values in '{column}' with constant indicator '{val}'."
            technique_name = "Constant Value Imputation (fillna)"
            why_matter = "In many domain contexts, missingness itself carries informative meaning (e.g., 'Unknown' or 0)."
            improvement = "Explicitly models missingness without confounding existing valid categories."

        else:
            raise ValueError(f"Unknown missing treatment strategy: {strategy}")

        explanation = {
            "problem": f"Found {before_missing} missing values in column '{column}' ({round(before_missing/max(total_rows_before, 1)*100, 1)}% of rows).",
            "why_it_matters": why_matter if 'why_matter' in locals() else "Missing data disrupts ML algorithms and distorts summary statistics.",
            "technique": technique_name,
            "what_changed": what_changed,
            "improvement_reason": improvement,
            "before_count": before_missing,
            "after_count": after_missing,
            "strategy": strategy
        }

        return new_df, explanation

    @staticmethod
    def remove_duplicates(df: pd.DataFrame, subset: Optional[List[str]] = None, keep: str = "first") -> Tuple[pd.DataFrame, Dict[str, Any]]:
        new_df = df.copy()
        before_dups = int(new_df.duplicated(subset=subset).sum())
        before_rows = len(new_df)

        new_df = new_df.drop_duplicates(subset=subset, keep=keep).reset_index(drop=True)
        after_rows = len(new_df)
        after_dups = int(new_df.duplicated(subset=subset).sum())

        explanation = {
            "problem": f"Detected {before_dups} duplicate records ({round(before_dups/max(before_rows, 1)*100, 1)}% of dataset).",
            "why_it_matters": "Duplicate rows artificially inflate statistical weights, deflate standard errors, and cause data leakage between training and testing folds.",
            "technique": f"drop_duplicates(keep='{keep}')",
            "what_changed": f"Purged {before_dups} identical rows. Dataset size adjusted from {before_rows} to {after_rows} unique records.",
            "improvement_reason": "Ensures every sample represents an independent observation, preventing overfitting on repeated records.",
            "before_count": before_dups,
            "after_count": after_dups,
            "rows_removed": before_rows - after_rows
        }

        return new_df, explanation

    @staticmethod
    def treat_inconsistent(df: pd.DataFrame, column: str, action: str, replace_map: Optional[Dict[str, str]] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        new_df = df.copy()
        if column not in new_df.columns:
            raise ValueError(f"Column '{column}' does not exist.")

        s = new_df[column].dropna().astype(str)
        before_unique = int(s.nunique())
        samples_before = s.unique()[:8].tolist()

        is_gender = column.lower() == "gender"

        if is_gender or action in ["canonical", "canonical_mapping"]:
            if is_gender:
                def map_gender(val):
                    if pd.isna(val):
                        return np.nan
                    clean = str(val).strip().lower()
                    if clean in ["male", "m", "man"]:
                        return "Male"
                    elif clean in ["female", "f", "woman"]:
                        return "Female"
                    # Preserve other categories like Other, Non-binary, Unknown
                    return str(val).strip().title()

                new_df[column] = new_df[column].map(map_gender)
                technique = "Whitespace stripping and case normalization with canonical category mapping."
                what_changed = "Standardized multiple representations into two consistent categories: Male and Female."
                problem_text = "The gender column contains multiple representations of the same category (e.g. Male, male, MALE, Female, female, FEMALE)."
                why_matter = "Treating different text representations as separate categories produces incorrect frequency counts and misleading visualizations."
                improvement = "Multiple representations were standardized into two consistent categories: Male and Female."
            else:
                # General canonical normalization: strip whitespace and title-case
                new_df[column] = new_df[column].astype(str).str.strip().str.title()
                technique = "Whitespace stripping and Title-Case canonical normalization"
                what_changed = f"Normalized whitespace and converted text to Title Case across all entries in '{column}'."
                problem_text = f"Variations in text casing and whitespace created {before_unique} splintered unique categories in '{column}'."
                why_matter = "Inconsistent formatting fragments frequency counts and leads to redundant dummy variables in one-hot encoding."
                improvement = f"Standardized representations to canonical categories, unifiying splintered variations."

        elif action == "strip_whitespace":
            new_df[column] = new_df[column].astype(str).str.strip()
            technique = "str.strip()"
            what_changed = f"Stripped accidental leading and trailing whitespace characters across all records in '{column}'."
            problem_text = f"Accidental whitespace created {before_unique} splintered entries in '{column}'."
            why_matter = "Whitespace variations prevent string matching and aggregate counts from grouping properly."
            improvement = "Unified entries differing only by invisible whitespace."

        elif action == "lowercase":
            new_df[column] = new_df[column].astype(str).str.strip().str.lower()
            technique = "str.strip().str.lower()"
            what_changed = f"Normalized all entries in '{column}' to lowercase and trimmed spaces."
            problem_text = f"Casing variations created {before_unique} splintered unique categories in '{column}'."
            why_matter = "Inconsistent formatting fragments frequency counts."
            improvement = "Standardized all values into uniform lowercase representation."

        elif action == "uppercase":
            new_df[column] = new_df[column].astype(str).str.strip().str.upper()
            technique = "str.strip().str.upper()"
            what_changed = f"Normalized all entries in '{column}' to uppercase and trimmed spaces."
            problem_text = f"Casing variations created {before_unique} splintered unique categories in '{column}'."
            why_matter = "Inconsistent formatting fragments frequency counts."
            improvement = "Standardized all values into uniform uppercase representation."

        elif action == "titlecase":
            new_df[column] = new_df[column].astype(str).str.strip().str.title()
            technique = "str.strip().str.title()"
            what_changed = f"Capitalized first letter of words in '{column}' and trimmed spaces."
            problem_text = f"Casing variations created {before_unique} splintered unique categories in '{column}'."
            why_matter = "Inconsistent formatting fragments frequency counts."
            improvement = "Standardized all values into uniform Title Case representation."

        elif action == "replace_map" and replace_map:
            new_df[column] = new_df[column].replace(replace_map)
            technique = "replace(mapping_dictionary)"
            what_changed = f"Replaced explicit value variants using canonical dictionary ({len(replace_map)} mapping rules applied)."
            problem_text = f"Categorical variants created {before_unique} distinct labels in '{column}'."
            why_matter = "Semantic duplicates disrupt category frequencies."
            improvement = "Explicit mapping merged synonyms into target canonical values."

        else:
            raise ValueError(f"Unsupported inconsistency action: {action}")

        after_unique = int(new_df[column].dropna().astype(str).nunique())
        samples_after = new_df[column].dropna().unique()[:8].tolist()

        explanation = {
            "problem": problem_text,
            "why_it_matters": why_matter,
            "technique": technique,
            "what_changed": what_changed,
            "improvement_reason": improvement,
            "before_count": before_unique,
            "after_count": after_unique,
            "samples_before": [str(x) for x in samples_before],
            "samples_after": [str(x) for x in samples_after]
        }

        return new_df, explanation

    @staticmethod
    def update_datatype(df: pd.DataFrame, column: str, target_type: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        new_df = df.copy()
        if column not in new_df.columns:
            raise ValueError(f"Column '{column}' does not exist.")

        before_type = str(new_df[column].dtype)

        if target_type == "numeric":
            new_df[column] = pd.to_numeric(new_df[column], errors='coerce')
            technique = "pd.to_numeric(errors='coerce')"
        elif target_type == "datetime":
            new_df[column] = pd.to_datetime(new_df[column], errors='coerce')
            technique = "pd.to_datetime(errors='coerce')"
        elif target_type == "string":
            new_df[column] = new_df[column].astype(str)
            technique = "astype(str)"
        elif target_type == "category":
            new_df[column] = new_df[column].astype("category")
            technique = "astype('category')"
        elif target_type == "boolean":
            new_df[column] = new_df[column].astype(bool)
            technique = "astype(bool)"
        else:
            raise ValueError(f"Unknown target data type: {target_type}")

        after_type = str(new_df[column].dtype)

        explanation = {
            "problem": f"Column '{column}' was currently stored as '{before_type}', which prevented proper mathematical/categorical operations.",
            "why_it_matters": "Incorrect data types block numerical aggregations (mean, std), increase memory usage, and cause ML pipeline errors.",
            "technique": technique,
            "what_changed": f"Cast column '{column}' from '{before_type}' to '{after_type}'.",
            "improvement_reason": "Unlocks type-specific mathematical, analytical, and plotting operations while optimizing memory footprint.",
            "before_type": before_type,
            "after_type": after_type
        }

        return new_df, explanation

    @staticmethod
    def treat_outliers(df: pd.DataFrame, column: str, method: str = "iqr", action: str = "clip", threshold: float = 1.5) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        new_df = df.copy()
        if column not in new_df.columns or not pd.api.types.is_numeric_dtype(new_df[column]):
            raise ValueError(f"Column '{column}' is not a numeric column.")

        s = new_df[column].dropna()
        q1 = float(s.quantile(0.25))
        q3 = float(s.quantile(0.75))
        iqr = q3 - q1

        if method == "iqr":
            lower_bound = q1 - threshold * iqr
            upper_bound = q3 + threshold * iqr
        else: # zscore
            mean_v = float(s.mean())
            std_v = float(s.std()) if len(s) > 1 else 1.0
            lower_bound = mean_v - threshold * std_v
            upper_bound = mean_v + threshold * std_v

        outlier_mask = (new_df[column] < lower_bound) | (new_df[column] > upper_bound)
        outlier_count = int(outlier_mask.sum())

        before_min = round(float(s.min()), 2)
        before_max = round(float(s.max()), 2)

        if action == "clip":
            new_df[column] = new_df[column].clip(lower=lower_bound, upper=upper_bound)
            technique = f"Winsorization / Clipping (clip(lower={round(lower_bound, 2)}, upper={round(upper_bound, 2)}))"
            what_changed = f"Capped {outlier_count} values outside boundaries [{round(lower_bound, 2)}, {round(upper_bound, 2)}] to the threshold boundaries without losing records."
            improvement = "Stabilizes extreme variances and prevents model distortion while preserving every sample in the dataset."
        elif action == "remove":
            new_df = new_df[~outlier_mask].reset_index(drop=True)
            technique = f"Outlier Trimming (boolean indexing filtering)"
            what_changed = f"Eliminated {outlier_count} rows containing extreme outlier values beyond [{round(lower_bound, 2)}, {round(upper_bound, 2)}]."
            improvement = "Completely removes corrupted measurements or unrepresentative anomalous instances."
        else:
            raise ValueError(f"Unknown outlier treatment action: {action}")

        after_s = new_df[column].dropna()
        after_min = round(float(after_s.min()), 2) if len(after_s) > 0 else 0
        after_max = round(float(after_s.max()), 2) if len(after_s) > 0 else 0

        explanation = {
            "problem": f"Identified {outlier_count} extreme outlier observations in '{column}' exceeding the {method.upper()} fences [{round(lower_bound, 2)}, {round(upper_bound, 2)}].",
            "why_it_matters": "Severe outliers pull regression lines, inflate variance, and distort distance-based and gradient-based estimators.",
            "technique": technique,
            "what_changed": what_changed,
            "improvement_reason": improvement,
            "before_range": [before_min, before_max],
            "after_range": [after_min, after_max],
            "outliers_treated": outlier_count
        }

        return new_df, explanation

    @staticmethod
    def clean_columns(df: pd.DataFrame, action: str, column: Optional[str] = None, new_name: Optional[str] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        new_df = df.copy()

        if action == "rename" and column and new_name:
            new_df = new_df.rename(columns={column: new_name})
            technique = f"rename(columns={{'{column}': '{new_name}'}})"
            what_changed = f"Renamed column '{column}' to '{new_name}'."
            improvement = "Improves code readability and adheres to standardized naming conventions."
        elif action == "drop" and column:
            new_df = new_df.drop(columns=[column])
            technique = f"drop(columns=['{column}'])"
            what_changed = f"Dropped column '{column}'."
            improvement = "Removes irrelevant, high-cardinality, or non-predictive attributes."
        elif action == "standardize_names":
            clean_names = {col: col.strip().lower().replace(" ", "_").replace("-", "_").replace(".", "_") for col in new_df.columns}
            new_df = new_df.rename(columns=clean_names)
            technique = "snake_case column normalization"
            what_changed = "Converted all column headers to snake_case, removing spaces and special characters."
            improvement = "Prevents syntax bugs and enables dot-notation column access across data science workflows."
        else:
            raise ValueError(f"Invalid column cleaning action: {action}")

        explanation = {
            "problem": "Raw dataset column headers contained non-standard characters, inconsistent spaces, or irrelevant attributes.",
            "why_it_matters": "Messy column naming causes runtime errors in querying and creates cumbersome code.",
            "technique": technique,
            "what_changed": what_changed,
            "improvement_reason": improvement
        }

        return new_df, explanation
