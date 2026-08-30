from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, AsyncSessionLocal
from seed import seed_database
from routers import sites, recordings, upload

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and seed initial dataset if empty
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_database(session)
    yield
    # Shutdown

app = FastAPI(
    title="Biophony Bioacoustics API",
    description="Acoustic Habitat Health Monitor backend API providing ACI calculation, species detection, GBIF expected baselines, and site trends.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sites.router)
app.include_router(recordings.router)
app.include_router(upload.router)

@app.get("/")
async def root():
    return {"name": "Biophony API", "status": "online", "docs": "/docs"}
