from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class PersonalOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EducationOut(BaseModel):
    id: int
    user_id: int
    school: str
    degree: str
    field: Optional[str] = None
    start_year: Optional[str] = None
    end_year: Optional[str] = None
    grade: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    technologies: Optional[str] = None
    role: Optional[str] = None
    outcomes: Optional[str] = None
    domain: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExperienceOut(BaseModel):
    id: int
    user_id: int
    company: str
    role: str
    responsibilities: Optional[str] = None
    technologies: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SkillOut(BaseModel):
    id: int
    user_id: int
    category: str
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CertificationOut(BaseModel):
    id: int
    user_id: int
    name: str
    issuer: Optional[str] = None
    skills_covered: Optional[str] = None
    date: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AchievementOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    date: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)