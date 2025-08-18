from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Group(SQLModel, table=True):
    __tablename__ = "groups"  # avoid reserved word 'group'
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
