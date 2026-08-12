from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_id
from app.models.resume import Resume
from app.schemas.resume import ResumeCreate, ResumeResponse, ResumeUpdate
from app.services.analyzer import analyze_resume_text
from app.services.file_extraction import extract_text_from_file

router = APIRouter()

@router.post("/analyze")
def analyze_resume(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    user_id: int = Depends(get_current_user_id)
):
    try:
        resume_text = extract_text_from_file(file)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File parsing error: {str(e)}")

    analysis = analyze_resume_text(resume_text, job_description)
    analysis["plain_text"] = resume_text
    return analysis

@router.post("/", response_model=ResumeResponse)
def create_resume(resume: ResumeCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    new_resume = Resume(
        user_id=user_id,
        title=resume.title,
        template=resume.template,
        content=resume.content
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    return new_resume

@router.get("/", response_model=List[ResumeResponse])
def get_resumes(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    resumes = db.query(Resume).filter(Resume.user_id == user_id).all()
    return resumes

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

@router.put("/{resume_id}", response_model=ResumeResponse)
def update_resume(resume_id: int, resume: ResumeUpdate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    db_resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
    if not db_resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db_resume.title = resume.title
    db_resume.template = resume.template
    db_resume.content = resume.content
    db.commit()
    db.refresh(db_resume)
    return db_resume

@router.delete("/{resume_id}")
def delete_resume(resume_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted"}