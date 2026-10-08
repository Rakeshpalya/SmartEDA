# SmartEDA — Interactive Exploratory Data Analysis & Machine Learning Platform

**Project Title:** Student Performance Analysis and Prediction Using Statistical and Machine Learning Techniques  
**Application Name:** SmartEDA  
**Course:** VTU BAD702 – Statistical Machine Learning and Data Science  
**Repository:** [https://github.com/Rakeshpalya/SmartEDA.git](https://github.com/Rakeshpalya/SmartEDA.git)  

---

## 📌 Executive Summary

**SmartEDA** is a full-stack, production-quality Exploratory Data Analysis (EDA) and Machine Learning platform engineered specifically for the **VTU BAD702** curriculum.

In academic and industrial machine learning, **Exploratory Data Analysis carries higher weightage than model fitting alone**. Algorithmic performance is bounded by data hygiene and feature representations. SmartEDA automates data quality diagnostics, dynamic statistical analysis, leak-free preprocessing, and multi-model benchmarking while maintaining full mathematical transparency.

---

## 🎯 Educational Guarantee (Teacher Evaluation Requirement)

Every cleaning, transformation, and modeling step in the platform displays a structured 5-point explanation card:
1. **What problem was found?** — Concrete identification of missingness, duplicate rows, skewness, or outlier fences.
2. **Why is it a problem?** — Statistical consequence (e.g., standard error inflation, bias, gradient divergence).
3. **What technique was applied?** — Exact Pandas / NumPy / Scikit-Learn function applied.
4. **What changed in the dataset?** — Precise before vs after counts and distribution shifts.
5. **Why does it improve the dataset?** — Mathematical justification for model generalization and predictive power.

---

## 🚀 Key Features & Syllabus Coverage

### 1. Data Ingestion & Understanding
- Drag-and-drop ingestion of **CSV**, **XLSX**, and **XLS** files.
- Built-in realistic **Student Performance demo dataset** (`student_performance_raw.csv`, 1200 rows, 12 columns) featuring genuine educational anomalies: missing values in `study_hours`, duplicate rows, casing variations (`'male'`, `'Male'`, `'MALE'`, `'female'`, `'Female'`, `'FEMALE'`), and extreme score outliers.
- **Data Inspection (`head()`, `tail()`, `shape`, `info()`):** Schema detection, memory footprint, data types, and recommended next actions.
- **Searchable, Sortable, Paginated Data Table:** Interactive table with sticky headers, NaN highlighting, and column sorting.
- **Immutable Raw Data State:** The original uploaded raw dataset remains permanently untouched in memory for before/after comparison.

### 2. Algorithmic Data Quality Scoring (0–100)
- Dynamic Health Score gauge with transparent, dynamically calculated deductions:
  - Missing values deduction
  - Duplicate rows deduction
  - Potential outliers deduction
  - Inconsistent text labels deduction
  - Constant/Zero-variance column deduction
- Automatic classification into **Excellent**, **Good**, **Needs Cleaning**, or **Poor / High Risk**.

### 3. Data Cleaning Suite
- **Missing Value Treatment (`isnull().sum()`):**
  - Columns with 0 missing values (e.g., `student_id`) are excluded from treatment candidate lists.
  - Mathematically validated strategies: Mean & Median restricted strictly to numeric features; Mode Imputation for categoricals.
  - Strategies: Drop Rows, Drop Column, Mean, Median, Mode, Forward Fill (`ffill`), Backward Fill (`bfill`), Constant Value.
- **Duplicate Removal (`duplicated()`, `drop_duplicates()`):**
  - Identification and one-click removal preserving the first valid occurrence.
- **Inconsistent String Cleaning & Gender Normalization:**
  - 3-stage Before / Cleaning Operation / After pipeline.
  - Canonical mapping of gender representations (`male*` → `Male`, `female*` → `Female`).
  - Raw inconsistent dataset preserved intact for presentation demonstration.
- **Outlier Detection & Capping:**
  - **IQR Method (Tukey's Fences):** $Q_1 - 1.5 \times IQR$ to $Q_3 + 1.5 \times IQR$.
  - **Z-Score Method (Empirical Rule):** $|z| > 3.0$ standard deviations.
  - Winsorization / Capping to statistical fences without row loss.

### 4. Statistical Analysis & Visualizations
- **Categorical Variable Analysis & Category Filter:**
  - Interactive **Category Filter** allowing users to isolate or compare specific representations (e.g. `male` variants vs `female` variants).
  - Dynamic frequency distribution bar charts and category proportions donut charts (proportions strictly recomputed relative to filtered observations).
  - Automated statistical interpretation (`'Male' is the dominant category, representing X% of the data`).
  - Dual view toggle: **Cleaned Data (Active)** vs **Raw Data (Original)**.
- **Numerical Distribution Analysis:**
  - Histograms with dynamic binning, KDE curves, and Box Plots.
  - Five-Number Summary ($Min, Q_1, Median, Q_3, Max$), variance, and skewness classification.
- **Descriptive Statistics (`df.describe()`):**
  - Central tendency, dispersion, and spread metrics across all numerical features.
- **Correlation Heatmap:**
  - Pearson & Spearman rank correlation matrices calculated dynamically.
  - Strongest positive and negative correlation detection.
- **Visualization Studio:**
  - Interactive multi-type chart builder (Scatter, Line, Bar, Box, Area, Histogram).

### 5. Preprocessing & Machine Learning Suite
- **Preprocessing:**
  - Scaling: StandardScaler (Z-score normalization), MinMaxScaler ($[0, 1]$ bounding), RobustScaler.
  - Categorical Encoding: One-Hot Encoding (`get_dummies()`), Label Encoding.
  - Strict **Train/Test Split ($80/20$)** performed before fitting transformations to prevent data leakage.
- **Machine Learning Benchmark:**
  - **Classification Tasks:** Random Forest Classifier, Logistic Regression, Decision Tree, Support Vector Classifier (SVC).
  - Metrics: Accuracy, Precision, Recall, F1-Score, Confusion Matrix, ROC-AUC.
  - **Regression Tasks:** Random Forest Regressor, Linear Regression, Ridge, Decision Tree Regressor.
  - Metrics: Mean Squared Error (MSE), Root Mean Squared Error (RMSE), Mean Absolute Error (MAE), $R^2$ Score.
  - Feature Importance rankings derived directly from trained ensemble models.

### 6. Presentation Mode & Report Generation
- **One-Click Presentation Mode:** Built-in modal presentation deck summarizing executive findings, methodology, and evaluation metrics for teacher vivas.
- **Comprehensive Audit Report:** Downloadable summary of all cleaning operations, statistical distributions, and trained model metrics.

---

## 🛠 Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React.
- **Backend:** Python 3.10+, FastAPI, Uvicorn, Pandas, NumPy, SciPy, Scikit-Learn.
- **Deployment:** Netlify (Frontend SPA), Render / Railway / Fly.io / AWS (FastAPI Backend).

---

## 📂 Project Structure

```
SmartEDA/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application & configurable CORS
│   │   ├── state.py             # Active & raw dataset state manager
│   │   ├── models.py            # Pydantic request/response schemas
│   │   ├── routes/
│   │   │   └── api.py           # REST API endpoints
│   │   └── services/
│   │       ├── eda_service.py   # Statistical, inspection, and correlation logic
│   │       ├── cleaning_service.py # Missing, duplicate, outlier, string treatments
│   │       ├── ml_service.py    # Leak-free preprocessing & Scikit-learn pipelines
│   │       └── report_service.py # Audit trail and summary generation
│   ├── data/
│   │   └── student_performance_raw.csv # Reference demo dataset
│   ├── requirements.txt         # Python dependencies
│   └── verify_test.py           # 13-point automated verification suite
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI cards, Navbar, Sidebar, Modals
│   │   ├── pages/               # 21 specialized EDA & ML route views
│   │   ├── services/
│   │   │   └── api.ts           # Dynamic API client with VITE_API_BASE_URL
│   │   ├── types.ts             # TypeScript interface definitions
│   │   └── App.tsx              # Application root and route orchestrator
│   ├── public/
│   │   └── _redirects           # Netlify SPA fallback routing
│   ├── .env.example             # Environment variable template
│   ├── package.json             # Frontend dependencies
│   └── vite.config.ts           # Vite build & local development proxy
├── data/
│   └── student_performance_raw.csv
├── netlify.toml                 # Netlify build & redirect configuration
├── DEPLOYMENT.md                # Step-by-step production deployment guide
└── .gitignore                   # Clean Git ignore rules
```

---

## 💻 Local Setup & Execution

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher & npm

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API documentation: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173/`

### 4. Running Verification Suite
```bash
python backend/verify_test.py
```
Validates zero-missing guard, strategy validation, gender canonicalization, ML train/test split, CSV upload, and demo reset.

---

## 🌐 Production Deployment

Refer to [`DEPLOYMENT.md`](./DEPLOYMENT.md) for detailed instructions:
1. **Frontend (Netlify):** Connect GitHub repo `https://github.com/Rakeshpalya/SmartEDA.git`, build command `npm run build`, publish directory `dist`, base directory `frontend`. Set `VITE_API_BASE_URL` to the public FastAPI URL.
2. **Backend (Render / Railway / Fly.io):** Deploy `backend` directory using Python runtime, `pip install -r requirements.txt`, and start command `uvicorn app.main:app --host 0.0.0.0 --port 10000`. Configure `CORS_ORIGINS`.

---

## 🎓 Teacher Viva & Presentation Notes

When presenting **SmartEDA** for evaluation:
1. **Begin with Raw Data Inconsistencies:** Show the Raw Data table and Categorical Analysis for `gender`. Highlight that casing variations (`male`, `Male`, `MALE`) splinter categories.
2. **Demonstrate Category Filter:** Select only male representations, demonstrating dynamic recalculation of proportions totaling 100%.
3. **Apply Canonical Cleaning:** Navigate to Inconsistent Values and click Normalize, showing how `current_df` is unified into `Male` and `Female` while the raw dataset remains preserved.
4. **Demonstrate Missing Value Guards:** Highlight that `student_id` (0 missing) is rejected and cannot be treated; perform median imputation on `study_hours`.
5. **Show Leak-Free Machine Learning:** Train Random Forest Classifier on `result`, emphasizing that preprocessing was fitted only on training data.
6. **Open Presentation Mode:** Click the Presentation Mode button in the navbar for a curated slide deck.
