import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import Base
from app.api import auth, resumes, knowledge_base as kb_api, buddy

app = FastAPI(title="ResumeX API")

# Comma-separated list of allowed origins, e.g.
# "http://localhost:3000,https://resumex.vercel.app"
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
app.include_router(kb_api.router, prefix="/kb", tags=["knowledge-base"])
app.include_router(buddy.router, prefix="/buddy", tags=["buddy"])

@app.get("/")
def root():
    return {"message": "ResumeX API is running"}