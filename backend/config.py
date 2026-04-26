import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-dev-secret-key')
    # Fallback to local SQLite if no PostgreSQL URL is provided (no Docker)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        'sqlite:///shop_multi.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key')
