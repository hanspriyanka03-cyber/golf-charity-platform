from supabase import create_client, Client
from app.config import settings

# Use service key for admin operations (bypasses RLS)
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_key)

# Anon client for user-scoped operations
supabase_anon: Client = create_client(settings.supabase_url, settings.supabase_key)


def get_supabase() -> Client:
    return supabase


def get_supabase_anon() -> Client:
    return supabase_anon
