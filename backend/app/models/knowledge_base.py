from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base

class KBPersonal(Base):
    __tablename__ = "kb_personal"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    location = Column(String)
    linkedin = Column(String)
    github = Column(String)
    summary = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class KBEducation(Base):
    __tablename__ = "kb_education"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    school = Column(String, nullable=False)
    degree = Column(String, nullable=False)
    field = Column(String)
    start_year = Column(String)
    end_year = Column(String)
    grade = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class KBProject(Base):
    __tablename__ = "kb_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    technologies = Column(String)
    role = Column(String)
    outcomes = Column(Text)
    domain = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    embedding = Column(Vector(384))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class KBExperience(Base):
    __tablename__ = "kb_experience"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    responsibilities = Column(Text)
    technologies = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    embedding = Column(Vector(384))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class KBSkill(Base):
    __tablename__ = "kb_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False)  # languages, frameworks, tools, databases, cloud
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class KBCertification(Base):
    __tablename__ = "kb_certifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    issuer = Column(String)
    skills_covered = Column(Text)
    date = Column(String)
    embedding = Column(Vector(384))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class KBAchievement(Base):
    __tablename__ = "kb_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    date = Column(String)
    embedding = Column(Vector(384))
    created_at = Column(DateTime(timezone=True), server_default=func.now())