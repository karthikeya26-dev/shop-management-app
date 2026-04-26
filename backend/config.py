import os
import tempfile

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-dev-secret-key')
    
    # Check if we are running in a Read-Only Serverless environment (Vercel)
    if os.environ.get('VERCEL') == '1':
        db_path = f"sqlite:///{os.path.join(tempfile.gettempdir(), 'shop_multi.db')}"
    else:
        db_path = 'sqlite:///shop_multi.db'
        
    # Fallback to local SQLite if no PostgreSQL URL is provided
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', db_path)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key')
