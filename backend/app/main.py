from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 

app = FastAPI(title="Expense Splitter API", version="0.1.0")

# wide-open CORS in dev; we’ll tighten later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # later: set to your Vercel URL / localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}