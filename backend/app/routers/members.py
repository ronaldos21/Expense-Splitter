from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import select
from ..db import get_session
from ..models import Group, Member
from ..schemas import MemberCreate, MemberRead

router = APIRouter(prefix="/groups/{gid}/members", tags=["members"])

@router.post("", response_model=MemberRead)
def create_member(gid: int, payload: MemberCreate, session=Depends(get_session)):
    group = session.get(Group, gid)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if payload.email:
        exists = session.exec(
            select(Member).where(Member.group_id == gid, Member.email == payload.email)
        ).first()
        if exists:
            raise HTTPException(status_code=400, detail="Member with this email already exists in this group")

    m = Member(group_id=gid, name=payload.name, email=payload.email)
    session.add(m); session.commit(); session.refresh(m)
    return m

@router.get("", response_model=List[MemberRead])
def list_members(gid: int, session=Depends(get_session)):
    if not session.get(Group, gid):
        raise HTTPException(status_code=404, detail="Group not found")
    return session.exec(
        select(Member).where(Member.group_id == gid).order_by(Member.id.desc())
    ).all()
