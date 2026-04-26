# 🚀 Cloud-Native Shop Management Platform

A cutting-edge Full-Stack, SaaS Multi-Tenant application designed to overhaul organizational capabilities. Built dynamically with **React & Vite** on the frontend, supported by a heavy **Python Flask & SQLAlchemy** backend, and fully engineered for the modern cloud using automated DevOps CI/CD pipelines.

---

## 🔥 Key Features

* **SaaS Multi-Tenancy**: The platform dynamically assigns secure, mathematically isolated SQLite/PostgreSQL database structures to every registered user via JWT tokens. Each registered user manages a totally independent shop sandbox safely isolated from others.
* **Live Analytics Engine**: The dashboard aggressively tracks logic to instantly aggregate **Daily, Monthly, and Lifetime** revenue streams, identifying and sorting your highest velocity products directly into a "Top Sellers" UI sidebar.
* **Intelligent Stock Automation**: Transactions mathematically deduct stock using protected REST API endpoints. If inventory dips beneath safety thresholds, the Backend forcefully triggers high-priority visual dashboard Alerts requesting immediate restocking.
* **CSS Custom Properties Engine**: A built-in logic toggle allowing end-users to shift the entire UI interface between four custom aesthetics dynamically: *Dark Theme, Light Theme, Ocean, and Sunset*. 
* **Full DevOps Integration**: The codebase comes natively bootstrapped with `Dockerfiles`, high-availability `Kubernetes` manifests, automated `Terraform` AWS deployment scripts, and strict `GitHub Actions` CI/CD formatting to guarantee seamless cloud operations.

---

## 🛠️ Technology Stack

**Frontend Frameworks:** React 18, Vite, Context-API, Vanilla CSS Root Variables  
**Backend Architecture:** Python, Flask, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-Cors  
**Local Database:** SQLite Sandbox (Instant Setup)  
**Production Database:** PostgreSQL  
**DevOps Ecosystem:** Docker, Kubernetes (K8s), HashiCorp Terraform, Prometheus, GitHub Actions  

---

## 💻 Local Developer Guide

Because this application runs off of a decoupled Microservice pattern, both systems must boot up to talk to each other correctly.

### Instant Start (Windows)
We've bundled a master batch script inside the root folder. You do strictly **not** need to use manual commands.

1. Locate `start_shop.bat` in the root folder.
2. Double-click it. 
3. The platform will automatically launch a terminal window for the Python Database server, and a separate window for the React compiler!
4. Navigate to `http://localhost:5174/` to view the live dashboard.

### Manual Boot (If required)

**1. Boot the Python Backend**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**2. Boot the React Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security Posture

* User passwords forcefully hashed before persistence using the `werkzeug.security` module.
* `get_jwt_identity()` injected into every single API Route ensuring complete Data Governance across `Product`, `Sale`, `Expense`, and `Alert` models, blocking multi-tenant overlapping requests automatically.
