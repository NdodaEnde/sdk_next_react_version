"""
Production server starter with gunicorn for the medical certificates application
"""
import os
import sys
import subprocess
from dotenv import load_dotenv

# Load production environment variables
if os.path.exists('.env.production'):
    load_dotenv('.env.production')
else:
    print("Warning: .env.production file not found")
    load_dotenv()  # Fall back to regular .env file

# Ensure PostgreSQL is properly configured
if os.getenv("DB_TYPE") != "postgres":
    print("Error: Production environment must use PostgreSQL. Set DB_TYPE=postgres in .env.production")
    sys.exit(1)

if not os.getenv("DATABASE_URL"):
    print("Error: DATABASE_URL environment variable is not set in .env.production")
    sys.exit(1)

# Set environment variables for production
os.environ["NODE_ENV"] = "production"

# Check for required packages
try:
    import gunicorn
except ImportError:
    print("Error: gunicorn is not installed. Run: pip install gunicorn")
    sys.exit(1)

try:
    import psycopg2
except ImportError:
    print("Error: psycopg2 is not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

# Check that database can be initialized
try:
    from database import initialize_database
    initialize_database()
    print("Database connection successful and tables created/verified")
except Exception as e:
    print(f"Error: Failed to initialize database: {e}")
    sys.exit(1)

# Get number of workers and port
workers = os.getenv("GUNICORN_WORKERS", "4")
port = os.getenv("PORT", "8003")

print(f"Starting production server on port {port} with {workers} workers")

# Start Gunicorn server
subprocess.run([
    "gunicorn",
    "--workers", workers,
    "--bind", f"0.0.0.0:{port}",
    "--access-logfile", "-",  # Log to stdout
    "--error-logfile", "-",   # Error log to stdout
    "--timeout", "120",       # 2-minute timeout for long-running requests
    "--worker-class", "gevent",  # Use gevent for async processing
    "--preload",              # Load application code before forking workers
    "app:app"                 # The Flask application object
])