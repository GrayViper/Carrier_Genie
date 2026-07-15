Product Requirements Document (PRD)
Product: CareerGenie – Smart Resume Analyzer & Job Matcher
1. Executive Summary
CareerGenie is an AI-powered career guidance platform that helps students improve resumes, discover relevant jobs and internships, and manage applications. Recruiters can post opportunities and review matched candidates, while administrators manage the platform.
2. Problem Statement
Students struggle to optimize resumes and find suitable opportunities. Recruiters spend significant time screening candidates. CareerGenie streamlines both using AI-powered resume analysis and intelligent job matching.
3. Objectives
- AI resume analysis
- Intelligent job matching
- Role-based dashboards
- Application tracking
- Recruiter job management
- Secure authentication
4. Target Users
Students, Recruiters/Faculty Coordinators, and Administrators.
5. Functional Requirements
• Authentication (JWT + Bcrypt)
• Student profile management
• Resume upload (PDF)
• Resume parsing and AI feedback
• ATS score and improvement suggestions
• Job posting and management
• Job matching with similarity scoring
• Job search with filters
• Application tracking
• Notifications (email/in-app)
• Admin dashboard and analytics
6. Non-Functional Requirements
Performance: Resume analysis <10 sec
Security: JWT, HTTPS, password hashing
Availability: 99% uptime
Scalability: 10,000+ users
7. Technology Stack
Frontend: React.js + Tailwind CSS
Backend: Node.js + Express.js
Database: MongoDB
Authentication: JWT + Bcrypt
AI: Python NLP / OpenAI API
Deployment: Vercel + Render
8. Database Entities
Users, Resume, Jobs, Applications, Notifications.
9. Core API Endpoints
POST /api/auth/register
POST /api/auth/login
POST /api/resume/upload
GET /api/jobs
POST /api/jobs
POST /api/applications
GET /api/admin/analytics
10. User Interface
Landing Page, Login, Register, Student Dashboard, Recruiter Dashboard, Resume Upload, Job Listings, Job Details, Application Tracker, Admin Panel.
11. MVP Scope
Authentication, resume analysis, job matching, job posting, dashboards, application tracking, notifications, and admin panel.
12. Future Enhancements
AI resume rewriting, mock interviews, LinkedIn integration, GitHub analysis, cover letter generation, interview scheduling, mobile application.
