import requests
import json

BASE = "http://127.0.0.1:8000/api"

print("==================================================")
print("RUNNING AUTOMATED VERIFICATION SUITE")
print("==================================================")

print("0. Initializing clean demo dataset...")
requests.post(f"{BASE}/demo/load")

print("1. Testing GET /overview on initial demo dataset...")
r = requests.get(f"{BASE}/overview")
assert r.status_code == 200, f"Overview failed: {r.text}"
ov = r.json()
assert ov["rows"] == 1200, f"Expected 1200 rows, got {ov['rows']}"
assert ov["columns"] == 12, f"Expected 12 columns, got {ov['columns']}"
assert ov["missing_values_count"] > 0, "Expected missing values in demo dataset"
assert ov["duplicate_rows_count"] > 0, "Expected duplicate rows in demo dataset"
print(f"   [PASS] 1200 rows, 12 columns, {ov['missing_values_count']} missing cells, {ov['duplicate_rows_count']} duplicates. Health Score: {ov['data_quality_score']}/100")

print("2. Testing Critical Fix: Verifying student_id with 0 missing CANNOT be treated...")
r = requests.post(f"{BASE}/missing/treat", json={"column": "student_id", "strategy": "median"})
assert r.status_code == 400, f"Expected HTTP 400 error for zero-missing column, got {r.status_code}: {r.text}"
print("   [PASS] Backend correctly rejected missing value treatment on 'student_id' (0 missing).")

print("3. Testing Strategy Validation: Verifying invalid categorical strategy (median on gender) is rejected...")
r = requests.post(f"{BASE}/missing/treat", json={"column": "gender", "strategy": "median"})
assert r.status_code == 400, f"Expected HTTP 400 for median on categorical, got {r.status_code}: {r.text}"
print("   [PASS] Backend correctly rejected median imputation on categorical feature 'gender'.")

print("4. Testing Valid Missing Value Treatment on study_hours (numerical median)...")
r = requests.post(f"{BASE}/missing/treat", json={"column": "study_hours", "strategy": "median"})
assert r.status_code == 200, f"Missing treatment failed: {r.text}"
mis_res = r.json()
assert mis_res["explanation"]["before_count"] > 0
assert mis_res["explanation"]["after_count"] == 0
print(f"   [PASS] Successfully treated {mis_res['explanation']['before_count']} missing values in study_hours -> 0.")

print("5. Testing Gender Inconsistency Detection in raw state...")
r = requests.get(f"{BASE}/categorical/gender")
assert r.status_code == 200
cat_raw = r.json()
raw_cats = [d["category"] for d in cat_raw["distribution"]]
assert len(raw_cats) > 2, f"Expected >2 raw gender variants, found: {raw_cats}"
print(f"   [PASS] Raw gender variants identified: {raw_cats}")

print("6. Testing Canonical Gender Normalization (unifying to Male and Female)...")
r = requests.post(f"{BASE}/inconsistencies/treat", json={"column": "gender", "action": "canonical"})
assert r.status_code == 200, f"Gender normalization failed: {r.text}"
inc_res = r.json()
assert inc_res["explanation"]["after_count"] == 2, f"Expected exactly 2 categories after canonical mapping, got {inc_res['explanation']['after_count']}"

r = requests.get(f"{BASE}/categorical/gender")
assert r.status_code == 200
cat_clean = r.json()
clean_cats = [d["category"] for d in cat_clean["distribution"]]
assert sorted(clean_cats) == ["Female", "Male"], f"Expected ['Female', 'Male'], got {clean_cats}"
print(f"   [PASS] Gender successfully normalized into strictly binary canonical categories: {clean_cats}")

print("7. Testing Duplicate Removal...")
r = requests.post(f"{BASE}/duplicates/remove", json={"keep": "first"})
assert r.status_code == 200
dup_res = r.json()
assert dup_res["explanation"]["before_count"] == 25
assert dup_res["explanation"]["after_count"] == 0
assert dup_res["overview"]["rows"] == 1175
print("   [PASS] Deduplication success: 25 duplicates removed. Rows now 1175.")

print("8. Testing Data Integrity: Raw dataset remains strictly immutable (1200 rows)...")
r = requests.get(f"{BASE}/raw-table?use_raw=true&page=1&page_size=10")
assert r.status_code == 200
assert r.json()["total_records"] == 1200, f"Raw data modified! Expected 1200, got {r.json()['total_records']}"

r = requests.get(f"{BASE}/raw-table?use_raw=false&page=1&page_size=10")
assert r.status_code == 200
assert r.json()["total_records"] == 1175, f"Current data expected 1175, got {r.json()['total_records']}"
print("   [PASS] Immutable raw state confirmed: Raw remains 1200 rows while cleaned is 1175 rows.")

print("9. Testing Machine Learning Pipeline (Leak-free classification)...")
r = requests.post(f"{BASE}/ml/train", json={
    "target_column": "result",
    "problem_type": "classification",
    "algorithms": ["random_forest", "logistic_regression"],
    "test_size": 0.2,
    "scaling_method": "standard",
    "encoding_method": "onehot",
    "random_state": 42
})
assert r.status_code == 200, f"ML train failed: {r.text}"
ml = r.json()
assert len(ml["models_evaluated"]) == 2
print(f"   [PASS] ML trained successfully! Recommended model: {ml['recommended_model']}. Features: {len(ml['feature_columns'])}")

print("10. Testing Arbitrary New Dataset Upload (generic non-student CSV)...")
custom_csv = "product_name,category,price,units_sold\nLaptop,Electronics,1200.0,15\nPhone,Electronics,,42\nShirt,Apparel,45.0,120\nShoes,Apparel,85.0,\n"
files = {"file": ("sales_quarter.csv", custom_csv, "text/csv")}
r = requests.post(f"{BASE}/upload", files=files)
assert r.status_code == 200, f"Upload failed: {r.text}"
up_res = r.json()
assert up_res["overview"]["filename"] == "sales_quarter.csv"
assert up_res["overview"]["rows"] == 4
assert up_res["overview"]["columns"] == 4
print("   [PASS] Successfully uploaded 'sales_quarter.csv' (4 rows, 4 columns). Engine adapted generically.")

print("11. Testing Reset to Demo Dataset...")
r = requests.post(f"{BASE}/demo/load")
assert r.status_code == 200
demo_ov = r.json()["overview"]
assert demo_ov["filename"] == "student_performance_raw.csv"
assert demo_ov["rows"] == 1200
assert demo_ov["columns"] == 12
print("   [PASS] Reset to demo dataset verified: Restored 1200-row Student Performance dataset.")

print("12. Testing Raw Inconsistencies vs Cleaned Categories dual view...")
# Clean gender
requests.post(f"{BASE}/inconsistencies/treat", json={"column": "gender", "action": "canonical"})
r_clean = requests.get(f"{BASE}/categorical/gender?use_raw=false")
assert r_clean.status_code == 200
clean_cats = [d["category"] for d in r_clean.json()["distribution"]]
assert sorted(clean_cats) == ["Female", "Male"], f"Expected clean to have ['Female', 'Male'], got {clean_cats}"

r_raw = requests.get(f"{BASE}/categorical/gender?use_raw=true")
assert r_raw.status_code == 200
raw_cats = [d["category"] for d in r_raw.json()["distribution"]]
assert len(raw_cats) > 2, f"Expected raw to preserve inconsistent categories, got {raw_cats}"
print(f"   [PASS] Clean view has {clean_cats} while Raw view preserves all original variants: {raw_cats}")

print("13. Testing Inconsistencies Endpoint 3-Stage Pipeline Data...")
r_inc = requests.get(f"{BASE}/inconsistencies")
assert r_inc.status_code == 200
inc_data = r_inc.json()
assert inc_data["total_found"] > 0
gender_col = next((c for c in inc_data["inconsistent_columns"] if c["column"] == "gender"), None)
assert gender_col is not None
assert "raw_counts" in gender_col
assert "clean_counts" in gender_col
assert gender_col["is_cleaned"] is True
print(f"   [PASS] Inconsistencies pipeline data verified: raw variants ({len(gender_col['raw_counts'])}) -> clean canonical ({len(gender_col['clean_counts'])}).")

# Finally reset back to demo so clean state is ready for user
requests.post(f"{BASE}/demo/load")

print("==================================================")
print("ALL 13 VERIFICATION CHECKS PASSED PERFECTLY!")
print("==================================================")
