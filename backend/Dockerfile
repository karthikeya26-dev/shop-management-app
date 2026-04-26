FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Command to run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:create_app()"]
