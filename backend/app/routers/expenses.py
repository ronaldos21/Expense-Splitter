from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import select
from ..db import get_session
from ..models import Group, Member, Expense, ExpenseShare
from ..schemas import ExpenseCreate, ExpenseRead, ExpenseShareRead

router = APIRouter(prefix="/groups/{gid}/expenses", tags=["expenses"])

@router.post("", response_model=ExpenseRead)
def create_expense(gid: int, payload: ExpenseCreate, session=Depends(get_session)):
    group = session.get(Group, gid)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    payer = session.get(Member, payload.payer_id)
    if not payer or payer.group_id != gid:
        raise HTTPException(status_code=400, detail="Payer must be a member of this group")

    members = session.exec(select(Member).where(Member.group_id == gid)).all()
    if not members:
        raise HTTPException(status_code=400, detail="Group has no members to split with")

    exp = Expense(group_id=gid, payer_id=payload.payer_id, amount=payload.amount, description=payload.description)
    session.add(exp)
    session.commit()
    session.refresh(exp)

    per = round(payload.amount / len(members), 2)
    shares = []
    for m in members:
        es = ExpenseShare(expense_id=exp.id, member_id=m.id, share=per)
        session.add(es)
        shares.append(ExpenseShareRead(member_id=m.id, share=per))
    session.commit()

    return ExpenseRead(
        id=exp.id, group_id=exp.group_id, payer_id=exp.payer_id,
        amount=exp.amount, description=exp.description, created_at=exp.created_at,
        shares=shares
    )

@router.get("", response_model=List[ExpenseRead])
def list_expenses(gid: int, session=Depends(get_session)):
    if not session.get(Group, gid):
        raise HTTPException(status_code=404, detail="Group not found")

    expenses = session.exec(select(Expense).where(Expense.group_id == gid).order_by(Expense.id.desc())).all()
    out: List[ExpenseRead] = []
    for e in expenses:
        es = session.exec(select(ExpenseShare).where(ExpenseShare.expense_id == e.id)).all()
        shares = [ExpenseShareRead(member_id=s.member_id, share=s.share) for s in es]
        out.append(ExpenseRead(
            id=e.id, group_id=e.group_id, payer_id=e.payer_id,
            amount=e.amount, description=e.description, created_at=e.created_at,
            shares=shares
        ))
    return out
