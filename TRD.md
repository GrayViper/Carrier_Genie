Technical Requirements Document (TRD)
Project: CareerGenie – Smart Resume Analyzer & Job Matcher
1. Purpose
This document defines the technical architecture, technology stack, system design, implementation guidelines, APIs, database, security, deployment strategy, and development standards for the CareerGenie platform.
2. Technology Stack
Frontend: React.js, Vite, Tailwind CSS, React Router, Axios
Backend: Node.js, Express.js
Database: MongoDB (Mongoose)
Authentication: JWT + Bcrypt
AI Service: Python FastAPI, spaCy, PyMuPDF, Sentence Transformers (or OpenAI API)
Storage: Local/Cloud Object Storage
Deployment: Vercel (Frontend), Render (Backend & AI), MongoDB Atlas
3. High-Level Architecture
React Frontend
        |
Express REST API
   |           |
MongoDB    AI Resume Service (FastAPI)
                |
          Resume Analysis & Job Matching
4. Folder Structure
frontend/
backend/
ai-service/
docs/
shared/
README.md
.env.example
5. Database Collections
Users
Resumes
Jobs
Applications
Notifications
6. Core API Modules
Authentication
Resume Upload & Analysis
Jobs
Applications
Notifications
Admin Analytics
7. Security Requirements
JWT authentication, bcrypt password hashing, role-based access control, HTTPS, CORS configuration, request validation, rate limiting, secure environment variables, file upload validation.
8. AI Module
Extract resume text, identify skills, calculate ATS score, compare with job requirements, generate improvement suggestions, return structured JSON response.
9. Coding Standards
Use reusable React components, RESTful APIs, MVC architecture, async/await, centralized error handling, environment-based configuration, ESLint and Prettier.
10. Testing
Unit testing for services, API testing with Postman, frontend component testing, integration testing, manual end-to-end testing.
11. Deployment
Frontend: Vercel
Backend: Render
AI Service: Render
Database: MongoDB Atlas
CI/CD via GitHub Actions (optional).
12. Milestones
Phase 1: Authentication
Phase 2: Resume Module
Phase 3: Job Module
Phase 4: Recruiter Dashboard
Phase 5: Admin Dashboard
Phase 6: Testing
Phase 7: Deployment
