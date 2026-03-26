from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import get_supabase
from app.routers import auth, users, scores, subscriptions, charities, draws, winners, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verify DB connection
    try:
        db = get_supabase()
        result = db.table("charities").select("id").limit(1).execute()
        print("✅ Database connection verified")
    except Exception as e:
        print(f"⚠️  Database connection warning: {e}")
    yield
    # Shutdown
    print("Shutting down Golf Charity Platform API")


app = FastAPI(
    title="Golf Charity Platform API",
    description="A Golf Charity Subscription Platform with monthly prize draws",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(scores.router, prefix=API_PREFIX)
app.include_router(subscriptions.router, prefix=API_PREFIX)
app.include_router(charities.router, prefix=API_PREFIX)
app.include_router(draws.router, prefix=API_PREFIX)
app.include_router(winners.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Golf Charity Platform API",
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    return {
        "message": "Golf Charity Platform API",
        "docs": "/docs",
        "health": "/health",
    }
