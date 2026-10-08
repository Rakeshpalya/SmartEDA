import io
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import Response, StreamingResponse

from app.state import state
from app.models import (
    MissingTreatmentRequest, DuplicateTreatmentRequest, InconsistentTreatmentRequest,
    DataTypeUpdateRequest, OutlierTreatmentRequest, ColumnCleanRequest, MLTrainRequest
)
from app.services.eda_service import EDAService
from app.services.cleaning_service import CleaningService
from app.services.ml_service import MLService
from app.services.report_service import ReportService

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename
    contents = await file.read()
    
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a CSV or Excel file.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")

    if df.empty or len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file contains an empty dataset.")

    state.load_dataset(df, filename)
    
    overview = EDAService.get_overview(state.current_df, state.raw_df, state.filename, len(state.audit_log))
    return {
        "message": f"Successfully loaded '{filename}' ({len(df)} rows, {len(df.columns)} columns).",
        "overview": overview
    }

@router.post("/demo/load")
async def load_demo_dataset():
    state._init_demo()
    if state.current_df is None:
        raise HTTPException(status_code=500, detail="Demo dataset could not be initialized.")
    overview = EDAService.get_overview(state.current_df, state.raw_df, state.filename, len(state.audit_log))
    return {
        "message": "Demo Student Performance dataset successfully loaded.",
        "overview": overview
    }

@router.post("/reset")
async def reset_dataset():
    state.reset_dataset()
    overview = EDAService.get_overview(state.current_df, state.raw_df, state.filename, len(state.audit_log))
    return {
        "message": "Dataset successfully reset to raw original upload.",
        "overview": overview
    }

@router.get("/overview")
async def get_overview():
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    return EDAService.get_overview(state.current_df, state.raw_df, state.filename, len(state.audit_log))

@router.get("/raw-table")
async def get_raw_table(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=5, le=100),
    search: str = Query(""),
    sort_by: str = Query(""),
    sort_asc: bool = Query(True),
    use_raw: bool = Query(False)
):
    df_to_use = state.raw_df if use_raw and state.raw_df is not None else state.current_df
    if df_to_use is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    return EDAService.get_raw_table(df_to_use, page, page_size, search, sort_by, sort_asc)

@router.get("/inspection")
async def get_inspection():
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    return EDAService.get_inspection(state.current_df)

@router.get("/missing")
async def get_missing_analysis():
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    return EDAService.get_missing_analysis(state.current_df, state.raw_df)

@router.post("/missing/treat")
async def treat_missing_values(req: MissingTreatmentRequest):
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    try:
        new_df, explanation = CleaningService.treat_missing(
            state.current_df, req.column, req.strategy, req.fill_value
        )
        state.current_df = new_df
        state.log_operation(
            operation="Missing Value Treatment",
            column=req.column,
            details={"strategy": req.strategy, "fill_value": req.fill_value},
            explanation=explanation
        )
        return {
            "success": True,
            "explanation": explanation,
            "overview": EDAService.get_overview(state.current_df, state.raw_df, state.filename, len(state.audit_log))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/duplicates")
async def get_duplicates_analysis():
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    return EDAService.get_duplicate_analysis(state.current_df, state.raw_df)

@router.post("/duplicates/remove")
async def remove_duplicates(req: DuplicateTreatmentRequest):
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    try:
        new_df, explanation = CleaningService.remove_duplicates(state.current_df, req.subset, req.keep)
        state.current_df = new_df
        state.log_operation(
            operation="Duplicate Row Removal",
            column=None,
            details={"subset": req.subset, "keep": req.keep},
            explanation=explanation
        )
        return {
            "success": True,
            "explanation": explanation,
            "overview": EDAService.get_overview(state.current_df, state.raw_df, state.filename, len(state.audit_log))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/inconsistencies")
async def get_inconsistencies():
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    return EDAService.get_inconsistent_analysis(state.current_df, state.raw_df)

@router.post("/inconsistencies/treat")
async def treat_inconsistencies(req: InconsistentTreatmentRequest):
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    try:
        new_df, explanation = CleaningService.treat_inconsistent(
            state.current_df, req.column, req.action, req.replace_map
        )
        state.current_df = new_df
        state.log_operation(
            operation="Inconsistent Category Normalization",
            column=req.column,
            details={"action": req.action, "replace_map": req.replace_map},
            explanation=explanation
        )
        return {
            "success": True,
            "explanation": explanation,
            "overview": EDAService.get_overview(state.current_df, state.raw_df, state.filename, len(state.audit_log))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/datatypes/update")
async def update_datatype(req: DataTypeUpdateRequest):
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    try:
        new_df, explanation = CleaningService.update_datatype(state.current_df, req.column, req.target_type)
        state.current_df = new_df
        state.log_operation(
            operation="Data Type Conversion",
            column=req.column,
            details={"target_type": req.target_type},
            explanation=explanation
        )
        return {
            "success": True,
            "explanation": explanation,
            "overview": EDAService.get_overview(state.current_df, state.raw_df, state.filename, len(state.audit_log))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/columns/clean")
async def clean_columns(req: ColumnCleanRequest):
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    try:
        new_df, explanation = CleaningService.clean_columns(state.current_df, req.action, req.column, req.new_name)
        state.current_df = new_df
        state.log_operation(
            operation="Column Management",
            column=req.column,
            details={"action": req.action, "new_name": req.new_name},
            explanation=explanation
        )
        return {
            "success": True,
            "explanation": explanation,
            "overview": EDAService.get_overview(state.current_df, state.raw_df, state.filename, len(state.audit_log))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/categorical/{column}")
async def get_categorical_analysis(column: str, use_raw: bool = Query(False)):
    df_to_use = state.raw_df if use_raw and state.raw_df is not None else state.current_df
    if df_to_use is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    res = EDAService.get_categorical_analysis(df_to_use, column)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@router.get("/numerical/{column}")
async def get_numerical_analysis(column: str):
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    res = EDAService.get_numerical_analysis(state.current_df, column)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@router.get("/outliers/{column}")
async def get_outlier_analysis(
    column: str,
    method: str = Query("iqr", pattern="^(iqr|zscore)$"),
    threshold: float = Query(1.5, ge=0.5, le=5.0)
):
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    res = EDAService.get_outlier_analysis(state.current_df, column, method, threshold)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@router.post("/outliers/treat")
async def treat_outliers(req: OutlierTreatmentRequest):
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    try:
        new_df, explanation = CleaningService.treat_outliers(
            state.current_df, req.column, req.method, req.action, req.threshold
        )
        state.current_df = new_df
        state.log_operation(
            operation="Outlier Remediation",
            column=req.column,
            details={"method": req.method, "action": req.action, "threshold": req.threshold},
            explanation=explanation
        )
        return {
            "success": True,
            "explanation": explanation,
            "overview": EDAService.get_overview(state.current_df, state.raw_df, state.filename, len(state.audit_log))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/correlation")
async def get_correlation(method: str = Query("pearson", pattern="^(pearson|spearman)$")):
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    return EDAService.get_correlation_matrix(state.current_df, method)

@router.get("/target-analysis")
async def get_target_analysis(
    target_col: str = Query(...),
    problem_type: str = Query("classification", pattern="^(classification|regression)$")
):
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    return EDAService.get_target_analysis(state.current_df, target_col, problem_type)

@router.post("/ml/train")
async def train_models(req: MLTrainRequest):
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    try:
        results = MLService.train_models(
            df=state.current_df,
            target_col=req.target_column,
            problem_type=req.problem_type,
            feature_cols=req.feature_columns,
            algorithms=req.algorithms,
            test_size=req.test_size,
            scaling_method=req.scaling_method,
            encoding_method=req.encoding_method,
            random_state=req.random_state
        )
        state.ml_results = results
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/ml/candidate-models")
async def get_candidate_models(problem_type: str = Query("classification")):
    return MLService.get_candidate_models(problem_type)

@router.get("/insights")
async def get_insights():
    if state.current_df is None or state.raw_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    return ReportService.generate_automated_insights(
        state.raw_df, state.current_df, state.audit_log, state.ml_results
    )

@router.get("/before-after")
async def get_before_after():
    if state.current_df is None or state.raw_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    
    raw_overview = EDAService.get_overview(state.raw_df, state.raw_df, state.filename, 0)
    current_overview = EDAService.get_overview(state.current_df, state.raw_df, state.filename, len(state.audit_log))

    return {
        "raw": {
            "rows": raw_overview["rows"],
            "columns": raw_overview["columns"],
            "missing_values": raw_overview["missing_values_count"],
            "duplicates": raw_overview["duplicate_rows_count"],
            "outliers": raw_overview["total_outliers_detected"],
            "inconsistencies": raw_overview["inconsistent_columns_count"],
            "quality_score": raw_overview["data_quality_score"],
            "grade": raw_overview["data_quality_grade"]
        },
        "cleaned": {
            "rows": current_overview["rows"],
            "columns": current_overview["columns"],
            "missing_values": current_overview["missing_values_count"],
            "duplicates": current_overview["duplicate_rows_count"],
            "outliers": current_overview["total_outliers_detected"],
            "inconsistencies": current_overview["inconsistent_columns_count"],
            "quality_score": current_overview["data_quality_score"],
            "grade": current_overview["data_quality_grade"]
        },
        "audit_steps": state.audit_log
    }

@router.get("/teacher-checklist")
async def get_teacher_checklist():
    if state.current_df is None or state.raw_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    return ReportService.get_teacher_checklist(
        state.raw_df, state.current_df, state.audit_log, bool(state.ml_results)
    )

@router.get("/presentation-slides")
async def get_presentation_slides():
    if state.current_df is None or state.raw_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    return ReportService.get_presentation_slides(
        state.raw_df, state.current_df, state.audit_log, state.ml_results
    )

@router.get("/audit-log")
async def get_audit_log():
    return state.audit_log

@router.get("/export/clean-csv")
async def export_clean_csv():
    if state.current_df is None:
        raise HTTPException(status_code=404, detail="No active dataset.")
    
    stream = io.StringIO()
    state.current_df.to_csv(stream, index=False)
    csv_bytes = stream.getvalue().encode("utf-8")
    
    clean_filename = f"cleaned_{state.filename}"
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={clean_filename}"}
    )
