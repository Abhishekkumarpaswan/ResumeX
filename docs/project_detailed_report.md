# ResumeBuddy: In-Depth Engineering & Architectural Report

This report provides a detailed breakdown of the three key sections of the **ResumeBuddy** platform:
1. **The Interactive Resume Builder**
2. **The RAG-Backed AI Tailor (Generator)**
3. **The Custom ATS Resume Analyzer**

---

## SECTION 1: The Interactive Resume Builder

The **Resume Builder** provides a structured form interface and drag-and-drop mechanics to input, edit, and save resumes.

```
+-----------------------------------------------------------------------+
|                              Next.js UI                               |
| (Drag-and-Drop Order List, Input Forms, Section Layout Controllers)   |
+----------------------------------+------------------------------------+
                                   |
                             JSON Payload
                         (Bearer Auth Token)
                                   |
                                   v
+-----------------------------------------------------------------------+
|                             FastAPI Route                             |
|          resumes.py (CRUD Operations, Pydantic Schema Validation)     |
+----------------------------------+------------------------------------+
                                   |
                            SQLAlchemy ORM
                                   |
                                   v
+-----------------------------------------------------------------------+
|                            PostgreSQL DB                              |
|       resumes Table (id, user_id, title, template, content JSON)      |
+-----------------------------------------------------------------------+
```

### 1. Database Model (`app/models/resume.py`)
The resume state is saved in the `resumes` table. The data is represented as follows:
*   `id`: Primary key (Integer).
*   `user_id`: Foreign key referencing `users.id`, ensuring data ownership isolation.
*   `title`: The name of the resume version (e.g., "Full-Stack Engineer v1").
*   `template`: The visual style template identifier (e.g., "classic", "modern", "minimal").
*   `content`: A JSON column holding nested resume sections (personal info, experience, projects, skills, education, certifications, extracurriculars, and sectionOrder).

### 2. API Operations (`app/api/resumes.py`)
*   `GET /resumes/`: Retrieves a list of all resume documents created by the currently authenticated user.
*   `GET /resumes/{id}`: Fetches the full JSON content and configuration of a specific resume version.
*   `POST /resumes/`: Receives structured JSON details, validates them against Pydantic schemas, and creates a new database entry.
*   `PUT /resumes/{id}`: Updates an existing resume's title, template, and content (e.g., when the user edits fields or drags blocks to reorder sections).
*   `DELETE /resumes/{id}`: Removes a resume document.

### 3. Frontend Architecture (`src/app/builder/`)
*   **State Binding**: Uses a React state object mirroring the Pydantic schema structure (e.g., education arrays, experiences arrays, projects arrays).
*   **Drag-and-Drop Section Sorting**: Implemented via `@dnd-kit`. When section order is swapped, it updates layout indices in React, compiles the JSON payload, and calls `PUT /resumes/{id}` to save the layout ordering state.

---

## SECTION 2: The RAG-Backed AI Tailor (Generator)

The **AI Tailor** uses Retrieval-Augmented Generation (RAG) concepts to align candidate Knowledge Base entries with a target Job Description.

```
                       +-------------------------+
                       | Job Description (Input) |
                       +------------+------------+
                                    |
                                    v
                       +-------------------------+
                       | Hugging Face / ST Embed |
                       |  (Dense 384-Dim Vector) |
                       +------------+------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                     retrieval.py Hybrid Scoring                       |
|   1. Dense Search: Vector Cosine Similarity                           |
|   2. Lexical Search: BM25 Okapi Scoring (rank_bm25)                   |
|   3. Rule Boost: Technology & Keyword Intersection                    |
+-----------------------------------+-----------------------------------+
                                    |
                             Top Ranked Items
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                        Resume Content Assembly                        |
|   Assembles top-ranked experience, projects, skills, certifications,  |
|   and achievements into structured JSON resume payload               |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                        Next.js Generator UI                           |
|   Displays tailored resume preview with ranking metrics & download    |
+-----------------------------------------------------------------------+
```

### 1. Dense Semantic Indexing (`app/models/knowledge_base.py`)
*   Knowledge Base tables (`kb_projects`, `kb_experience`, `kb_certifications`, `kb_achievements`) contain an `embedding` column of type `Vector(384)`.
*   pgvector extension types allow storing 384-dimensional dense vectors alongside candidate background records.

### 2. Sentence Transformers Embeddings (`app/services/embeddings.py`)
*   Converts textual entries into dense vector embeddings.
*   Queries Hugging Face feature extraction API (`sentence-transformers/all-MiniLM-L6-v2`) or falls back to local `SentenceTransformer('all-MiniLM-L6-v2')`.

### 3. Hybrid Search Strategy (`app/services/retrieval.py`)
To rank and select the best matching background records for a job description, the system executes a multi-signal scoring pipeline:
1.  **Dense Semantic Similarity**: Calculates cosine similarity between the embedded Job Description and the stored item vector embeddings.
2.  **Lexical Search**: Tokenizes text and computes BM25 Okapi match scores (`rank_bm25`) normalized via smooth saturation curves.
3.  **Technology Keyword Boost**: Identifies technology terms and exact keyword matches to apply boost weightings.
4.  **Weighted Score Combination**: Merges vector similarity, BM25 scores, and technology boosts into a unified score to rank entries.

### 4. Resume Content Assembly (`app/api/buddy.py`)
*   `POST /buddy/generate` validates candidate Knowledge Base requirements (minimum personal info, 1 education, 3 skills, 2 projects).
*   Invokes `retrieve_and_rank()` to retrieve top-performing records across sections.
*   Groups skills by category and constructs a structured `resume_content` JSON object ready for rendering or editing in the Resume Builder.

---

## SECTION 3: The Custom ATS Resume Analyzer

The **Resume Analyzer** evaluates documents local-first, measuring them against professional recruitment criteria.

```
                       +-------------------------+
                       |   Uploaded PDF / DOCX   |
                       +------------+------------+
                                    |
                                    v
                       +-------------------------+
                       |  file_extraction.py     |
                       |  (PyMuPDF / docx parse) |
                       +------------+------------+
                                    |
                                    v
                       +-------------------------+
                       |    remove_sections()    |
                       |  (Strips Skills, Edu)   |
                       +------------+------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                        Local Auditing Engine                          |
|  - Google X-Y-Z check: Regexes matching metrics, verbs, & connectors  |
|  - Syllable Counter & Readability Ease Calculations                   |
|  - Buzzword & Typo Dictionary Lookups                                 |
|  - Calibrated Keyword Intersections                                   |
+-----------------------------------+-----------------------------------+
                                    |
                             Calculated Data
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                        Next.js Dashboard                              |
|  - Animated circular progress ring rendering ATS score                |
|  - Interactive Missing Keywords Checklist with placement advice cards |
+-----------------------------------------------------------------------+
```

### 1. Document Extraction (`app/services/file_extraction.py`)
*   Reads the file upload stream.
*   Parses **PDFs** dynamically using PyMuPDF (`fitz`) and **DOCX** using python-docx, outputting clean text.

### 2. Section Sanitization (`app/services/analyzer.py`)
*   `remove_sections(text, ["education", "certifications", "skills"])`
    Parses document headers and removes blocks belonging to Education, Skills, and Certifications. This isolates core descriptive text (Experience + Projects) to avoid false-flagging static listings.

### 3. Google X-Y-Z & Bullet Checker Heuristics
*   **Quantification Detection**: Checks body bullet points with regex patterns to find numbers, percentages, or currencies.
*   **Action Verb Check**: Matches bullet point starting words against action verb sets (`VERB_LIST`) and past-tense suffixes (`-ed`).
*   **Methodology Connectors**: Scans for connectors (`by`, `through`, `resulting in`, `using`) confirming candidate methodology explanations.
*   **Aggregated Output**: Collects bullet statistics and maps them to concise suggestions (e.g., *"45% of achievements lack metrics"*).

### 4. Readability Scoring (`count_syllables()`)
*   Applies a syllable-counting algorithm based on vowel breaks.
*   Calculates Flesch Reading Ease score:
    $$206.835 - 1.015 \times \left(\frac{\text{words}}{\text{sentences}}\right) - 84.6 \times \left(\frac{\text{syllables}}{\text{words}}\right)$$
*   Translates math scores into readable ratings: *Very Easy (Clear)*, *Easy (Standard)*, *Medium (Technical)*, or *Hard (Complex)*.

### 5. Smart Keyword Checklist Tips (`generate_keyword_tailoring_tips()`)
*   Extracts missing skills from Job Description comparison.
*   Categorizes skill domain types (databases, frontend, backend, AI/ML, DevOps).
*   Scans candidate background and generates placement advice cards.

---

This three-pronged architecture ensures that **ResumeBuddy** covers the entire lifecycle: writing structured resumes, tailoring them semantic-first for job descriptions, and auditing ATS compatibility with recruiter-level quality checks.
