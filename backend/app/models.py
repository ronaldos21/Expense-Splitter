from __future__ import annotations
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime


# Function to get the current UTC time
def utcnow() -> datetime:
    return datetime.now(timezone.utc)

# Define the Group and Member models
class Group(SQLModel, table=True):
    __tablename__ = "groups"  # avoid reserved word 'group'
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=utcnow, sa_column=Column(DateTime(timezone=True)))


class Member(SQLModel, table=True):
    __tablename__ = "members"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow, sa_column=Column(DateTime(timezone=True)))
