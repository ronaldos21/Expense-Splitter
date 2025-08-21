from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import init_db  
from .routers import groups, members, expenses, balances

app = FastAPI(title="Expense Splitter API", version="0.1.0")

# wide-open CORS in dev; we’ll tighten later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # frontend dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db() #creates tables on app boot

@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(groups.router)
app.include_router(members.router)
app.include_router(expenses.router)
app.include_router(balances.router)

'''
app.include_router(groups.router,   prefix="/api")
app.include_router(members.router,  prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(balances.router, prefix="/api")
'''