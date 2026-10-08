import os
import random
import pandas as pd
import numpy as np

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

# Generate base 1175 unique students, then append 25 duplicates = 1200 rows total
base_rows = 1175
num_duplicates = 25
total_rows = base_rows + num_duplicates

student_ids = [f"S{i+1:04d}" for i in range(base_rows)]

# Realistic gender pool with intentional casing and whitespace inconsistencies
genders_pool = ["Male", "male", "MALE", " Male ", "Female", "female", "FEMALE", " female "]
gender = [random.choice(genders_pool) for _ in range(base_rows)]

# Ages mostly 18-24, with realistic college distribution and ~1.5% outliers
ages = [float(random.randint(18, 24)) for _ in range(base_rows)]
outlier_age_indices = random.sample(range(base_rows), 16)
outlier_age_values = [72.0, 85.0, 94.0, 102.0, 6.0, 9.0, 88.0, 91.0, 79.0, 105.0, 8.0, 7.0, 99.0, 86.0, 93.0, 101.0]
for idx, val in zip(outlier_age_indices, outlier_age_values):
    ages[idx] = val

# Study hours 1.5 to 10.5 hrs, with ~1.5% outliers
study_hours = [round(random.uniform(1.8, 10.0), 1) for _ in range(base_rows)]
outlier_study_indices = random.sample(range(base_rows), 15)
outlier_study_values = [32.0, 36.5, 42.0, 48.0, 35.5, 39.0, 45.0, 50.0, 31.0, 34.5, 41.0, 46.5, 38.0, 44.0, 49.5]
for idx, val in zip(outlier_study_indices, outlier_study_values):
    study_hours[idx] = val

# Attendance between 55% and 99%, with ~1% outliers
attendance = [round(random.uniform(55.0, 99.0), 1) for _ in range(base_rows)]
outlier_att_indices = random.sample(range(base_rows), 12)
outlier_att_values = [140.0, 155.0, 165.0, 150.0, 145.0, 160.0, 170.0, 135.0, 148.0, 152.0, 158.0, 162.0]
for idx, val in zip(outlier_att_indices, outlier_att_values):
    attendance[idx] = val

# Sleep hours between 4.5 and 9.5
sleep_hours = [round(random.uniform(4.5, 9.2), 1) for _ in range(base_rows)]

# Previous score between 40 and 96
previous_score = [round(random.uniform(42.0, 96.0), 1) for _ in range(base_rows)]

# Categoricals with formatting variations
internet_pool = ["Yes", "yes", "Y", "No", "no", "N"]
internet_access = [random.choice(internet_pool) for _ in range(base_rows)]

extracurricular_pool = ["Yes", "No", "yes", "no"]
extracurricular = [random.choice(extracurricular_pool) for _ in range(base_rows)]

income_pool = ["Low", "Medium", "High", "Medium", "High"]
family_income = [random.choice(income_pool) for _ in range(base_rows)]

# Final score naturally correlated with study_hours, attendance, and previous_score + realistic noise
final_score = []
result = []
for i in range(base_rows):
    # Base formula reflecting real student performance dynamics
    base = 0.38 * previous_score[i] + 3.1 * study_hours[i] + 0.28 * attendance[i] + random.uniform(-7, 7)
    score_val = max(30.0, min(100.0, round(base, 1)))
    final_score.append(score_val)
    result.append("Pass" if score_val >= 50.0 else "Fail")

# Add a few high score outliers in final_score
outlier_score_indices = random.sample(range(base_rows), 6)
for idx in outlier_score_indices:
    final_score[idx] = 175.0 + random.randint(5, 20)

df = pd.DataFrame({
    "student_id": student_ids,
    "gender": gender,
    "age": ages,
    "study_hours": study_hours,
    "attendance": attendance,
    "previous_score": previous_score,
    "sleep_hours": sleep_hours,
    "internet_access": internet_access,
    "extracurricular": extracurricular,
    "family_income": family_income,
    "final_score": final_score,
    "result": result
})

# Explicitly ensure student_id has ZERO missing values
assert df["student_id"].isna().sum() == 0, "student_id must have 0 missing values"

# Inject realistic missing values across selected columns (5-8%)
missing_indices_gender = random.sample(range(base_rows), 16) # ~1.4%
for idx in missing_indices_gender:
    df.loc[idx, "gender"] = np.nan

missing_indices_age = random.sample(range(base_rows), 78) # ~6.6%
for idx in missing_indices_age:
    df.loc[idx, "age"] = np.nan

missing_indices_study = random.sample(range(base_rows), 64) # ~5.4%
for idx in missing_indices_study:
    df.loc[idx, "study_hours"] = np.nan

missing_indices_att = random.sample(range(base_rows), 48) # ~4.1%
for idx in missing_indices_att:
    df.loc[idx, "attendance"] = np.nan

missing_indices_prev = random.sample(range(base_rows), 56) # ~4.8%
for idx in missing_indices_prev:
    df.loc[idx, "previous_score"] = np.nan

missing_indices_extra = random.sample(range(base_rows), 38) # ~3.2%
for idx in missing_indices_extra:
    df.loc[idx, "extracurricular"] = np.nan

missing_indices_income = random.sample(range(base_rows), 32) # ~2.7%
for idx in missing_indices_income:
    df.loc[idx, "family_income"] = np.nan

# Inject duplicate rows (25 rows = ~2.1% duplicates)
duplicate_slice = df.iloc[15:15+num_duplicates].copy()
df = pd.concat([df, duplicate_slice], ignore_index=True)

# Save files
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_csv = os.path.join(base_dir, "data", "student_performance_raw.csv")
root_csv = os.path.abspath(os.path.join(base_dir, "..", "data", "student_performance_raw.csv"))

os.makedirs(os.path.dirname(backend_csv), exist_ok=True)
os.makedirs(os.path.dirname(root_csv), exist_ok=True)

df.to_csv(backend_csv, index=False)
df.to_csv(root_csv, index=False)

print(f"Generated realistic demo dataset with {len(df)} rows and {len(df.columns)} columns.")
print(f"Duplicates: {df.duplicated().sum()}")
print(f"Missing values by column:\n{df.isna().sum()}")
print(f"Saved to:\n  - {backend_csv}\n  - {root_csv}")
