import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.api import router as api_router

app = FastAPI(
    title="SmartEDA Backend",
    description="SmartEDA – Student Performance Analysis and Prediction Using Statistical and Machine Learning Techniques (VTU BAD702)",
    version="1.0.0"
)

# CORS configuration supporting development and configurable production domains (e.g. Netlify)
cors_env = os.getenv("CORS_ORIGINS", "").strip()
if cors_env:
    allowed_origins = [orig.strip() for orig in cors_env.split(",") if orig.strip()]
    for standard in ["https://smarteda.netlify.app", "http://localhost:5173", "http://127.0.0.1:5173"]:
        if standard not in allowed_origins:
            allowed_origins.append(standard)
else:
    # Development defaults + production Netlify + permissive fallback
    allowed_origins = [
        "https://smarteda.netlify.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(api_router, prefix="/api")

@app.get("/health")
def health_root():
    return {"status": "ok"}

@app.get("/")
def root():
    return {
        "status": "online",
        "platform": "SmartEDA",
        "description": "VTU BAD702 – Statistical Machine Learning and Data Science Project API",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
