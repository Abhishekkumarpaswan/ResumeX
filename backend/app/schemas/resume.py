from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ResumeCreate(BaseModel):
    title: str
    template: str = "modern"
    content: dict = {}

# NEW
class ResumeUpdate(BaseModel):
    title: str
    template: str
    content: dict

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    title: str
    template: str
    content: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)