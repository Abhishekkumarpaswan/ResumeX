from pydantic import BaseModel


class KBStatusOut(BaseModel):
    personal: bool
    education_count: int
    skills_count: int
    projects_count: int
    ready: bool


class ExtractTextOut(BaseModel):
    text: str