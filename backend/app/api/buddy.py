import traceback
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_id as get_user_id
from app.models.knowledge_base import KBPersonal, KBEducation, KBSkill, KBProject
from app.schemas.buddy import KBStatusOut, ExtractTextOut
from app.services.file_extraction import extract_text_from_file
from app.services.retrieval import retrieve_and_rank

router = APIRouter()

class GenerateRequest(BaseModel):
    job_description: str
    template: str = "classic"

@router.post("/generate")
def generate_resume(request: GenerateRequest, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):

    # --- Validate minimum requirements ---
    personal = db.query(KBPersonal).filter(KBPersonal.user_id == user_id).first()
    if not personal:
        raise HTTPException(status_code=400, detail="Please complete your personal information first")

    education = db.query(KBEducation).filter(KBEducation.user_id == user_id).all()
    if len(education) < 1:
        raise HTTPException(status_code=400, detail="Please add at least 1 education entry")

    skills = db.query(KBSkill).filter(KBSkill.user_id == user_id).all()
    if len(skills) < 3:
        raise HTTPException(status_code=400, detail="Please add at least 3 skills")

    # --- Retrieve and rank items ---
    try:
        ranked = retrieve_and_rank(user_id, request.job_description, db)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Retrieval error: {str(e)}")

    if not ranked:
        raise HTTPException(status_code=500, detail="Retrieval returned empty results")

    if len(ranked["projects"]) < 2:
        raise HTTPException(status_code=400, detail="Please add at least 2 projects to your knowledge base")

    # --- Assemble resume content ---
    # Group skills by category
    skill_groups: dict = {}
    for s in ranked["skills"]:
        cat = s["category"]
        if cat not in skill_groups:
            skill_groups[cat] = []
        skill_groups[cat].append(s["name"])

    resume_content = {
        "personal": {
            "name": personal.name,
            "email": personal.email,
            "phone": personal.phone or "",
            "location": personal.location or "",
            "linkedin": personal.linkedin or "",
            "github": personal.github or "",
            "summary": personal.summary or ""
        },
        "education": [
            {
                "school": edu.school,
                "degree": edu.degree,
                "field": edu.field or "",
                "startYear": edu.start_year or "",
                "endYear": edu.end_year or ""
            }
            for edu in education
        ],
        "experience": [
            {
                "company": exp["company"],
                "role": exp["role"],
                "startDate": exp.get("start_date") or "",
                "endDate": exp.get("end_date") or "",
                "description": exp.get("responsibilities") or ""
            }
            for exp in ranked["experience"]
        ],
        "projects": [
            {
                "title": p["title"],
                "description": p.get("description") or "",
                "technologies": p.get("technologies") or "",
                "link": ""
            }
            for p in ranked["projects"][:3]
        ],
        "skills": {
            "technical": skill_groups.get("languages", []),
            "frameworks": skill_groups.get("frameworks", []),
            "concepts": skill_groups.get("tools", []) + skill_groups.get("databases", []),
            "soft": skill_groups.get("cloud", [])
        },
        "certifications": [
            {
                "name": c["name"],
                "issuer": c.get("issuer") or "",
                "date": c.get("date") or "",
                "link": ""
            }
            for c in ranked["certifications"]
        ],
        "extracurricular": [
            {
                "title": a["title"],
                "organization": "",
                "date": a.get("date") or "",
                "description": a.get("description") or ""
            }
            for a in ranked["achievements"]
        ]
    }

    return {
    "resume_content": resume_content,
    "template": request.template,
    "all_ranked_projects": ranked["projects"],
    "ranking_info": {
        "projects_selected": min(len(ranked["projects"]), 3),
        "experience_selected": len(ranked["experience"]),
        "certifications_selected": len(ranked["certifications"]),
        "achievements_selected": len(ranked["achievements"]),
        "skills_selected": len(ranked["skills"])
    }
}

@router.get("/status", response_model=KBStatusOut)
def get_kb_status(user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):

    personal = db.query(KBPersonal).filter(KBPersonal.user_id == user_id).first()
    education = db.query(KBEducation).filter(KBEducation.user_id == user_id).all()
    skills = db.query(KBSkill).filter(KBSkill.user_id == user_id).all()
    projects = db.query(KBProject).filter(KBProject.user_id == user_id).all()

    return {
        "personal": personal is not None,
        "education_count": len(education),
        "skills_count": len(skills),
        "projects_count": len(projects),
        "ready": (
            personal is not None and
            len(education) >= 1 and
            len(skills) >= 3 and
            len(projects) >= 2
        )
    }

@router.post("/extract-jd", response_model=ExtractTextOut)
def extract_jd(user_id: int = Depends(get_user_id), file: UploadFile = File(...)):

    text = extract_text_from_file(file)

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from this file. Try pasting the job description instead."
        )

    return {"text": text}