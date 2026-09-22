# ResumeX

ResumeX is an AI-powered resume builder and optimization platform designed to help users create professional resumes, tailor them to target job descriptions, and evaluate them with ATS-style scoring.

The project brings together a modern Next.js frontend, a FastAPI backend, PostgreSQL storage, and vector-based retrieval to support AI-assisted resume matching and optimization.

## Live Demo

Try ResumeX online:

- **Frontend**: [https://resume-buddy-pcpt.vercel.app](https://resume-buddy-pcpt.vercel.app)
- **Backend API**: [https://resumex-backend-skm3.onrender.com](https://resumex-backend-skm3.onrender.com)

## Why ResumeX?

Candidates often spend hours rewriting the same resume for different roles. ResumeX streamlines that workflow by providing:

- Structured resume creation and editing
- AI-assisted tailoring for job descriptions
- ATS-style analysis of resume quality
- Retrieval-based recommendations using relevant experience and project history
- A clean dashboard for resume management and review

## Core Features

### Resume Builder
- Create and edit structured resume data
- Reorder sections and customize resume layout
- Save multiple resume versions
- Prepare outputs for professional use and reuse

### AI Tailor / Resume Generator
- Accept a job description and candidate background
- Retrieve and rank experience or project items using hybrid semantic and keyword matching
- Assemble tailored resumes structured around the target role requirements

### ATS Analyzer
- Parse uploaded PDF and DOCX files
- Detect missing skills, weak phrasing, and structural issues
- Evaluate readability, impact, and keyword relevance
- Surface actionable suggestions for improvements

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn-inspired UI patterns

### Backend
- FastAPI
- Python
- SQLAlchemy
- PostgreSQL
- pgvector
- Hugging Face / sentence-transformers integration

### Supporting Components
- PDF and DOCX parsing
- JWT-based authentication
- Semantic vector search for retrieval-augmented generation

## Repository Structure

```text
ResumeX/
├── backend/
│   ├── app/
│   ├── main.py
│   ├── requirements.txt
│   └── debug_scoring.py
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   └── README.md
├── architecture_overview.md
├── project_detailed_report.md
├── pyrightconfig.json
├── .gitignore
├── README.md
└── LICENSE (if added later)
```

## Architecture Overview

ResumeX follows a multi-tier architecture:

- Frontend: Next.js app for dashboard interaction and resume workflows
- Backend: FastAPI APIs for authentication, resume management, and AI services
- Data layer: PostgreSQL with pgvector for structured records and semantic retrieval

A typical request flow:

1. The user interacts with the frontend
2. The frontend sends requests to the FastAPI backend
3. The backend stores or analyzes data in PostgreSQL
4. Relevant resume/project context is retrieved using vector similarity and keyword matching
5. Tailored resume layouts or ATS analysis feedback are returned to the UI

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL with pgvector enabled
- Access to model services or Hugging Face credentials if needed

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend is usually available at:

- http://localhost:3000

The backend is typically available at:

- http://localhost:8000

## Environment Variables

The application uses environment configuration for local and deployment-specific settings.

Example backend environment variables:

```env
ALLOWED_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/resumex
HF_TOKEN=your_huggingface_token
```

Ensure the database connection and any required AI provider credentials are configured before running the project.

## API Highlights

The FastAPI service exposes endpoints for:

- Authentication under `/auth`
- Resume management under `/resumes`
- Knowledge base and vector retrieval under `/kb`
- Resume tailoring under `/buddy`

## Project Docs

This repository includes supporting architecture references:

- `architecture_overview.md`
- `project_detailed_report.md`

These are helpful for understanding the platform design, backend services, and AI-driven resume workflow in more depth.

## Roadmap Ideas

Possible future improvements include:

- PDF/Word export support
- More resume templates
- Enhanced dashboard analytics
- Better role-specific recommendation tuning
- Improved authentication and authorization flows
- Background processing for heavier AI analysis tasks

## License

This repository does not currently declare a root license file. If you plan to distribute or reuse it publicly, consider adding an explicit license such as MIT.

## Contributing

Contributions are welcome. A standard workflow would be:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run relevant checks and validation
5. Open a pull request with a clear summary

## Contact

For collaboration or questions, use the repository owner and GitHub profile linked to this project.

---

Built to help users craft stronger resumes, match better to job descriptions, and optimize for ATS-friendly hiring systems.
