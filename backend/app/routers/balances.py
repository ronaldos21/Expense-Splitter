from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from sqlmodel import select
from ..db import get_session
from ..models import Group, Member, Expense, ExpenseShare
from ..schemas import BalanceRead

router = APIRouter(prefix="/groups/{gid}/balances", tags=["balances"])

@router.get("", response_model=List[BalanceRead])
def get_balances(gid: int, session=Depends(get_session)):
    group = session.get(Group, gid)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    members = session.exec(select(Member).where(Member.group_id == gid)).all()
    if not members:
        return []

    nets: Dict[int, float] = {m.id: 0.0 for m in members}
    names: Dict[int, str] = {m.id: m.name for m in members}

    # credits: what members paid
    for e in session.exec(select(Expense).where(Expense.group_id == gid)).all():
        if e.payer_id in nets:
            nets[e.payer_id] += float(e.amount)

    # debits: what members owe
    shares = session.exec(
        select(ExpenseShare)
        .join(Expense, ExpenseShare.expense_id == Expense.id)
        .where(Expense.group_id == gid)
    ).all()
    for s in shares:
        if s.member_id in nets:
            nets[s.member_id] -= float(s.share)

    out = [BalanceRead(member_id=i, name=names[i], net=round(v, 2)) for i, v in nets.items()]
    out.sort(key=lambda x: x.net, reverse=True)
    return out
