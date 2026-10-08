import time
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    mean_absolute_error, mean_squared_error, r2_score
)

# Models
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC

class MLService:
    @staticmethod
    def get_candidate_models(problem_type: str) -> List[Dict[str, str]]:
        if problem_type == "classification":
            return [
                {"id": "random_forest", "name": "Random Forest Classifier", "category": "Ensemble", "description": "Robust ensemble of decision trees with bagging. High accuracy and feature importance."},
                {"id": "logistic_regression", "name": "Logistic Regression", "category": "Linear", "description": "Linear probabilistic classifier using the sigmoid function. Fast and interpretable."},
                {"id": "decision_tree", "name": "Decision Tree Classifier", "category": "Tree", "description": "Rule-based partition model using Gini impurity or entropy. Highly interpretable."},
                {"id": "gradient_boosting", "name": "Gradient Boosting Classifier", "category": "Ensemble", "description": "Sequential boosting model focusing on minimizing residual errors iteratively."},
                {"id": "knn", "name": "K-Nearest Neighbors (KNN)", "category": "Distance", "description": "Non-parametric instance-based classifier. Classifies based on feature space proximity."},
                {"id": "svm", "name": "Support Vector Machine (SVC)", "category": "Kernel", "description": "Finds the optimal separating hyperplane with maximum margin between classes."}
            ]
        else:
            return [
                {"id": "random_forest", "name": "Random Forest Regressor", "category": "Ensemble", "description": "Ensemble of regression trees that averages predictions to minimize variance."},
                {"id": "linear_regression", "name": "Linear Regression (OLS)", "category": "Linear", "description": "Classical Ordinary Least Squares finding the optimal linear hyperplane."},
                {"id": "decision_tree", "name": "Decision Tree Regressor", "category": "Tree", "description": "Splits feature space into homogeneous response regions."},
                {"id": "gradient_boosting", "name": "Gradient Boosting Regressor", "category": "Ensemble", "description": "Gradient boosted trees optimizing squared error loss."}
            ]

    @classmethod
    def train_models(
        cls,
        df: pd.DataFrame,
        target_col: str,
        problem_type: str,
        feature_cols: Optional[List[str]] = None,
        algorithms: Optional[List[str]] = None,
        test_size: float = 0.20,
        scaling_method: str = "standard",
        encoding_method: str = "onehot",
        random_state: int = 42
    ) -> Dict[str, Any]:
        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found.")

        # Drop rows where target is null
        valid_df = df.dropna(subset=[target_col]).copy()
        if len(valid_df) < 15:
            raise ValueError("Dataset has too few records (< 15) to train machine learning models reliably.")

        # Select features
        if not feature_cols:
            feature_cols = [c for c in valid_df.columns if c != target_col]
        else:
            feature_cols = [c for c in feature_cols if c in valid_df.columns and c != target_col]

        if not feature_cols:
            raise ValueError("No valid feature columns selected for training.")

        X = valid_df[feature_cols].copy()
        y = valid_df[target_col].copy()

        # Separate numeric and categorical features
        numeric_features = list(X.select_dtypes(include=[np.number]).columns)
        categorical_features = [c for c in feature_cols if c not in numeric_features]

        # Target preprocessing
        target_encoder = None
        target_classes = None
        if problem_type == "classification":
            if not pd.api.types.is_numeric_dtype(y) or y.dtype == 'object':
                target_encoder = LabelEncoder()
                y = target_encoder.fit_transform(y.astype(str))
                target_classes = [str(c) for c in target_encoder.classes_]
            else:
                target_classes = [str(c) for c in sorted(y.unique())]

        # Train/Test Split FIRST (Strictly prevents Data Leakage)
        stratify_val = y if problem_type == "classification" and len(np.unique(y)) > 1 and (pd.Series(y).value_counts().min() > 1) else None
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state, stratify=stratify_val
            )
        except Exception:
            # Fallback without stratification if class distribution is tiny
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state
            )

        # Build Preprocessing Transformers (Fit on train only)
        transformers = []

        if numeric_features:
            num_steps = [("imputer", SimpleImputer(strategy="median"))]
            if scaling_method == "standard":
                num_steps.append(("scaler", StandardScaler()))
            elif scaling_method == "minmax":
                num_steps.append(("scaler", MinMaxScaler()))
            num_pipeline = Pipeline(steps=num_steps)
            transformers.append(("num", num_pipeline, numeric_features))

        if categorical_features:
            cat_steps = [("imputer", SimpleImputer(strategy="most_frequent"))]
            if encoding_method == "onehot":
                cat_steps.append(("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)))
            else:
                cat_steps.append(("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)))
            cat_pipeline = Pipeline(steps=cat_steps)
            transformers.append(("cat", cat_pipeline, categorical_features))

        preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")
        
        # Fit ONLY on train
        X_train_trans = preprocessor.fit_transform(X_train)
        X_test_trans = preprocessor.transform(X_test)

        # Retrieve transformed feature names
        try:
            feature_names_out = list(preprocessor.get_feature_names_out())
            feature_names_clean = [f.replace("num__", "").replace("cat__", "") for f in feature_names_out]
        except Exception:
            feature_names_clean = [f"feat_{i}" for i in range(X_train_trans.shape[1])]

        if not algorithms:
            if problem_type == "classification":
                algorithms = ["random_forest", "logistic_regression", "decision_tree"]
            else:
                algorithms = ["random_forest", "linear_regression", "gradient_boosting"]

        results = []
        best_model_id = None
        best_metric_val = -1.0

        for algo in algorithms:
            model = None
            model_display_name = algo.replace("_", " ").title()

            if problem_type == "classification":
                if algo == "random_forest":
                    model = RandomForestClassifier(n_estimators=100, random_state=random_state)
                    model_display_name = "Random Forest Classifier"
                elif algo == "logistic_regression":
                    model = LogisticRegression(max_iter=500, random_state=random_state)
                    model_display_name = "Logistic Regression"
                elif algo == "decision_tree":
                    model = DecisionTreeClassifier(random_state=random_state)
                    model_display_name = "Decision Tree Classifier"
                elif algo == "gradient_boosting":
                    model = GradientBoostingClassifier(random_state=random_state)
                    model_display_name = "Gradient Boosting Classifier"
                elif algo == "knn":
                    model = KNeighborsClassifier(n_neighbors=min(5, len(X_train_trans)))
                    model_display_name = "K-Nearest Neighbors"
                elif algo == "svm":
                    model = SVC(probability=True, random_state=random_state)
                    model_display_name = "Support Vector Machine (SVC)"
            else:
                if algo == "random_forest":
                    model = RandomForestRegressor(n_estimators=100, random_state=random_state)
                    model_display_name = "Random Forest Regressor"
                elif algo == "linear_regression":
                    model = LinearRegression()
                    model_display_name = "Linear Regression"
                elif algo == "decision_tree":
                    model = DecisionTreeRegressor(random_state=random_state)
                    model_display_name = "Decision Tree Regressor"
                elif algo == "gradient_boosting":
                    model = GradientBoostingRegressor(random_state=random_state)
                    model_display_name = "Gradient Boosting Regressor"

            if model is None:
                continue

            # Train and measure time
            start_t = time.time()
            model.fit(X_train_trans, y_train)
            train_duration = round((time.time() - start_t) * 1000, 1) # ms

            y_pred_train = model.predict(X_train_trans)
            y_pred_test = model.predict(X_test_trans)

            model_metrics = {
                "algorithm": algo,
                "model_name": model_display_name,
                "training_time_ms": train_duration,
                "train_size": len(X_train),
                "test_size": len(X_test)
            }

            if problem_type == "classification":
                acc_train = round(float(accuracy_score(y_train, y_pred_train)), 4)
                acc_test = round(float(accuracy_score(y_test, y_pred_test)), 4)
                prec_test = round(float(precision_score(y_test, y_pred_test, average='weighted', zero_division=0)), 4)
                rec_test = round(float(recall_score(y_test, y_pred_test, average='weighted', zero_division=0)), 4)
                f1_val = round(float(f1_score(y_test, y_pred_test, average='weighted', zero_division=0)), 4)

                cm = confusion_matrix(y_test, y_pred_test)
                cm_matrix = cm.tolist()

                model_metrics.update({
                    "train_score": acc_train,
                    "test_score": acc_test,
                    "accuracy": acc_test,
                    "precision": prec_test,
                    "recall": rec_test,
                    "f1_score": f1_val,
                    "confusion_matrix": cm_matrix,
                    "classes": target_classes
                })

                comparison_metric = f1_val
            else:
                r2_train = round(float(r2_score(y_train, y_pred_train)), 4)
                r2_test = round(float(r2_score(y_test, y_pred_test)), 4)
                mae_test = round(float(mean_absolute_error(y_test, y_pred_test)), 4)
                mse_test = round(float(mean_squared_error(y_test, y_pred_test)), 4)
                rmse_test = round(float(np.sqrt(mse_test)), 4)

                model_metrics.update({
                    "train_score": r2_train,
                    "test_score": r2_test,
                    "r2_score": r2_test,
                    "mae": mae_test,
                    "mse": mse_test,
                    "rmse": rmse_test
                })

                comparison_metric = r2_test

            # Feature Importance extraction
            feature_importances = []
            if hasattr(model, "feature_importances_"):
                importances = model.feature_importances_
                for f_name, imp_val in zip(feature_names_clean, importances):
                    feature_importances.append({
                        "feature": f_name,
                        "importance": round(float(imp_val), 4)
                    })
                feature_importances.sort(key=lambda x: x["importance"], reverse=True)
            elif hasattr(model, "coef_"):
                coefs = model.coef_
                if coefs.ndim > 1:
                    coefs = np.mean(np.abs(coefs), axis=0)
                else:
                    coefs = np.abs(coefs)
                total_coef = max(float(np.sum(coefs)), 1e-6)
                for f_name, c_val in zip(feature_names_clean, coefs):
                    feature_importances.append({
                        "feature": f_name,
                        "importance": round(float(c_val / total_coef), 4)
                    })
                feature_importances.sort(key=lambda x: x["importance"], reverse=True)

            model_metrics["feature_importances"] = feature_importances[:10]
            results.append(model_metrics)

            if comparison_metric > best_metric_val:
                best_metric_val = comparison_metric
                best_model_id = algo

        # Select recommended model
        recommended = next((r for r in results if r["algorithm"] == best_model_id), results[0] if results else None)
        
        recommendation_reason = ""
        if recommended:
            if problem_type == "classification":
                recommendation_reason = (
                    f"'{recommended['model_name']}' is recommended as it achieved the highest balanced test F1-score ({recommended['f1_score'] * 100:.1f}%) "
                    f"with {recommended['accuracy'] * 100:.1f}% test accuracy, demonstrating superior generalization over competing models."
                )
            else:
                recommendation_reason = (
                    f"'{recommended['model_name']}' is recommended because it produced the highest R² score ({recommended['r2_score']:.3f}) "
                    f"and lowest Root Mean Squared Error (RMSE = {recommended['rmse']:.2f}) on the unseen test set."
                )

        return {
            "problem_type": problem_type,
            "target_column": target_col,
            "feature_columns": feature_cols,
            "split_info": {
                "train_samples": len(X_train),
                "test_samples": len(X_test),
                "split_ratio": f"{int((1 - test_size) * 100)}/{int(test_size * 100)}",
                "random_state": random_state,
                "scaling": scaling_method,
                "encoding": encoding_method
            },
            "models_evaluated": results,
            "recommended_model": recommended["model_name"] if recommended else "None",
            "recommended_algorithm": best_model_id,
            "recommendation_reason": recommendation_reason,
            "data_leakage_safeguard": "Strict Pipeline Enforcement: Imputation, scaling, and categorical encoding were fitted strictly on X_train. X_test was only transformed using the pre-fit training pipeline."
        }
