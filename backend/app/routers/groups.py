from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import select
from ..db import get_session
from ..models import Group
from ..schemas import GroupCreate, GroupRead

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
    
