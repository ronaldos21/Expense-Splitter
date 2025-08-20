from sqlmodel import SQLModel
from datetime import datetime
from typing import List, Optional

#---Groups---
class GroupCreate(SQLModel):
    name: str

class GroupRead(SQLModel):
    id: int
    name: str
    created_at: datetime

#---Members---
class MemberCreate(SQLModel):
    name: str
    email: Optional[str] = None


class MemberRead(SQLModel):
    id: int
    group_id: int
    name: str
    email: str | None
    created_at: datetime

#---Expenses---
class ExpenseCreate(SQLModel):
    payer_id: int
    amount: float
    description: str = ""

class ExpenseShareRead(SQLModel):
    member_id: int
    share: float

class ExpenseRead(SQLModel):
    id: int
    group_id: int
    payer_id: int
    amount: float
    description: str
    created_at: datetime
    shares: List[ExpenseShareRead]

class BalanceRead(SQLModel):
    member_id: int
    name: str
    net: float

