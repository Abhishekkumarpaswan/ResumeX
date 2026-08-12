from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_id as get_user_id
from app.models.knowledge_base import (
    KBPersonal, KBEducation, KBProject,
    KBExperience, KBSkill, KBCertification, KBAchievement
)
from app.schemas.knowledge_base import (
    PersonalOut, EducationOut, ProjectOut,
    ExperienceOut, SkillOut, CertificationOut, AchievementOut
)
from app.services.embeddings import (
    generate_embedding,
    build_project_text,
    build_experience_text,
    build_certification_text,
    build_achievement_text,
)

router = APIRouter()

# --- Request Schemas ---

class PersonalIn(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    summary: Optional[str] = None

class EducationIn(BaseModel):
    school: str
    degree: str
    field: Optional[str] = None
    start_year: Optional[str] = None
    end_year: Optional[str] = None
    grade: Optional[str] = None

class ProjectIn(BaseModel):
    title: str
    description: str
    technologies: Optional[str] = None
    role: Optional[str] = None
    outcomes: Optional[str] = None
    domain: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ExperienceIn(BaseModel):
    company: str
    role: str
    responsibilities: Optional[str] = None
    technologies: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class SkillIn(BaseModel):
    category: str
    name: str

class CertificationIn(BaseModel):
    name: str
    issuer: Optional[str] = None
    skills_covered: Optional[str] = None
    date: Optional[str] = None

class AchievementIn(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[str] = None

# --- Personal ---

@router.get("/personal", response_model=Optional[PersonalOut])
def get_personal(user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    personal = db.query(KBPersonal).filter(KBPersonal.user_id == user_id).first()
    return personal

@router.post("/personal", response_model=PersonalOut)
def save_personal(data: PersonalIn, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    existing = db.query(KBPersonal).filter(KBPersonal.user_id == user_id).first()
    if existing:
        for key, value in data.model_dump().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    new = KBPersonal(user_id=user_id, **data.model_dump())
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

# --- Education ---

@router.get("/education", response_model=List[EducationOut])
def get_education(user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    return db.query(KBEducation).filter(KBEducation.user_id == user_id).all()

@router.post("/education", response_model=EducationOut)
def add_education(data: EducationIn, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    new = KBEducation(user_id=user_id, **data.model_dump())
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

@router.delete("/education/{id}")
def delete_education(id: int, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    item = db.query(KBEducation).filter(KBEducation.id == id, KBEducation.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# --- Projects ---

@router.get("/projects", response_model=List[ProjectOut])
def get_projects(user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    return db.query(KBProject).filter(KBProject.user_id == user_id).all()

@router.post("/projects", response_model=ProjectOut)
def add_project(data: ProjectIn, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    text = build_project_text(
        title=data.title,
        description=data.description,
        technologies=data.technologies or "",
        role=data.role or "",
        outcomes=data.outcomes or "",
        domain=data.domain or ""
    )
    embedding = generate_embedding(text)

    new = KBProject(user_id=user_id, embedding=embedding, **data.model_dump())
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

@router.delete("/projects/{id}")
def delete_project(id: int, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    item = db.query(KBProject).filter(KBProject.id == id, KBProject.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# --- Experience ---

@router.get("/experience", response_model=List[ExperienceOut])
def get_experience(user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    return db.query(KBExperience).filter(KBExperience.user_id == user_id).all()

@router.post("/experience", response_model=ExperienceOut)
def add_experience(data: ExperienceIn, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    text = build_experience_text(
        company=data.company,
        role=data.role,
        responsibilities=data.responsibilities or "",
        technologies=data.technologies or ""
    )
    embedding = generate_embedding(text)

    new = KBExperience(user_id=user_id, embedding=embedding, **data.model_dump())
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

@router.delete("/experience/{id}")
def delete_experience(id: int, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    item = db.query(KBExperience).filter(KBExperience.id == id, KBExperience.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# --- Skills ---

@router.get("/skills", response_model=List[SkillOut])
def get_skills(user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    return db.query(KBSkill).filter(KBSkill.user_id == user_id).all()

@router.post("/skills", response_model=SkillOut)
def add_skill(data: SkillIn, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    new = KBSkill(user_id=user_id, **data.model_dump())
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

@router.delete("/skills/{id}")
def delete_skill(id: int, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    item = db.query(KBSkill).filter(KBSkill.id == id, KBSkill.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# --- Certifications ---

@router.get("/certifications", response_model=List[CertificationOut])
def get_certifications(user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    return db.query(KBCertification).filter(KBCertification.user_id == user_id).all()

@router.post("/certifications", response_model=CertificationOut)
def add_certification(data: CertificationIn, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    text = build_certification_text(
        name=data.name,
        issuer=data.issuer or "",
        skills_covered=data.skills_covered or ""
    )
    embedding = generate_embedding(text)

    new = KBCertification(user_id=user_id, embedding=embedding, **data.model_dump())
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

@router.delete("/certifications/{id}")
def delete_certification(id: int, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    item = db.query(KBCertification).filter(KBCertification.id == id, KBCertification.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# --- Achievements ---

@router.get("/achievements", response_model=List[AchievementOut])
def get_achievements(user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    return db.query(KBAchievement).filter(KBAchievement.user_id == user_id).all()

@router.post("/achievements", response_model=AchievementOut)
def add_achievement(data: AchievementIn, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    text = build_achievement_text(
        title=data.title,
        description=data.description or ""
    )
    embedding = generate_embedding(text)

    new = KBAchievement(user_id=user_id, embedding=embedding, **data.model_dump())
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

@router.delete("/achievements/{id}")
def delete_achievement(id: int, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    item = db.query(KBAchievement).filter(KBAchievement.id == id, KBAchievement.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}