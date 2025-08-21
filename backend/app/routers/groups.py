from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List
from sqlmodel import select
from ..db import get_session

#DTOS (SQLModel Schemas)
from ..schemas import GroupCreate, GroupRead

#ORM models
from ..models import Group, Member, ExpenseShare, Expense

router = APIRouter(prefix="/groups", tags=["groups"])

@router.post("", response_model=GroupRead)
def create_group(payload: GroupCreate, session=Depends(get_session)):
    #(optional) checking for duplicate names
    exists = session.exec(select(Group).where(Group.name == payload.name)).first()
    if exists:
        raise HTTPException(status_code=400, detail="Group with this name already exists")
    
    g = Group(name=payload.name)
    session.add(g)
    session.commit()
    session.refresh(g)
    return g



@router.get("", response_model=List[GroupRead])
def list_groups(session=Depends(get_session)):
    rows = session.exec(select(Group).order_by(Group.id.desc())).all()
    return rows


@router.delete("/{gid}", status_code=204)
def delete_group(gid: int, session=Depends(get_session)):
    g = session.get(Group, gid)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")

    # If no FK cascade in DB, manually delete children:
    # delete shares -> expenses -> members -> group
    expense_ids = [e.id for e in session.exec(
        select(Expense).where(Expense.group_id == gid)
    ).all()]

    if expense_ids:
        # shares
        shares = session.exec(
            select(ExpenseShare).where(ExpenseShare.expense_id.in_(expense_ids))
        ).all()
        for s in shares:
            session.delete(s)
        # expenses
        for eid in expense_ids:
            exp = session.get(Expense, eid)
            if exp:
                session.delete(exp)

    # members
    members = session.exec(select(Member).where(Member.group_id == gid)).all()
    for m in members:
        session.delete(m)

    # group
    session.delete(g)
    session.commit()
    return Response(status_code=204)

    
