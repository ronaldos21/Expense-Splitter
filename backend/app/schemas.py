from sqlmodel import SQLModel
from datetime import datetime

class GroupCreate(SQLModel):
    name: str

class GroupRead(SQLModel):
    id: int
    name: str
    created_at: datetime