from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    JWTManager(app)

    # Register blueprints
    from routes import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    # Create tables on startup if they don't exist
    with app.app_context():
        db.create_all()

    return app

# Export global app instance for Vercel Serverless environment
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
