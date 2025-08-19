from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import init_db  
from .routers import groups, members, expenses

app = FastAPI(title="Expense Splitter API", version="0.1.0")

# wide-open CORS in dev; we’ll tighten later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # later: set to your Vercel URL / localhost:5173
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