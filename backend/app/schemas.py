from sqlmodel import SQLModel
from datetime import datetime

class GroupCreate(SQLModel):
    name: str

class GroupRead(SQLModel):
    id: int
    name: str
    created_at: datetime

class MemberCreate(SQLModel):
    name: str
    email: str | None = None


class MemberRead(SQLModel):
    id: int
    group_id: int
    name: str
    email: str | None
    created_at: datetime