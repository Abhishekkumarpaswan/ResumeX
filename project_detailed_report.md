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
|          resumes.py (CRUD Operations, JSON Schema Validation)        |
+----------------------------------+------------------------------------+
                                   |
                            SQLAlchemy ORM
                                   |
                                   v
+-----------------------------------------------------------------------+
|                            PostgreSQL DB                              |
|           resume Table (id, user_id, title, structured_data)          |
+-----------------------------------------------------------------------+
```

### 1. Database Model (`app/models/resume.py`)
The resume state is saved in the `resumes` table. The data is represented as follows:
*   `id`: Primary key (Integer).
*   `user_id`: Foreign key referencing `users.id`, ensuring data ownership isolation.
*   `title`: The name of the resume version (e.g., "Full-Stack Engineer v1").
*   `structured_data`: A JSONB column. PostgreSQL JSONB is leveraged here to store flexible, nested JSON trees. This allows the frontend to dynamically add sections (like Projects, Certifications) without needing migrational alterations to SQL columns.

### 2. API Operations (`app/api/resumes.py`)
*   `GET /api/resumes/`: Retrieves a list of all resume documents created by the currently authenticated user.
*   `GET /api/resumes/{id}`: Fetches the full JSON content of a specific resume version.
*   `POST /api/resumes/`: Receives structured JSON details, validates them against Pydantic models (Schemas), and creates a new database entry.
*   `PUT /api/resumes/{id}`: Updates an existing resume's structured data (e.g., when the user changes a description, updates details, or drags blocks to reorder sections).

### 3. Frontend Architecture (`src/app/builder/`)
*   **State Binding**: Uses a single React state object mirroring the Pydantic schema structure (e.g., education arrays, experiences arrays, projects arrays).
*   **Drag-and-Drop Section Sorting**: Implemented via mouse/touch coordinates or drag-and-drop packages. When section order is swapped, it updates the layout indices in React, compiles the JSON payload, and calls `PUT /api/resumes/{id}` to save the layout ordering state.

---

## SECTION 2: The RAG-Backed AI Tailor (Generator)

The **AI Tailor** uses Retrieval-Augmented Generation (RAG) to align your personal history with a Job Description.

```
                       +-------------------------+
                       | Job Description (Input) |
                       +------------+------------+
                                    |
                                    v
                       +-------------------------+
                       | Hugging Face Embedding  |
                       |  (Dense 384-Dim Vector) |
                       +------------+------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                         PostgreSQL Query                              |
|   1. Dense Search: pgvector Cosine Distance (<=>)                     |
|   2. Lexical Search: FTS/BM25 Indexing Match                          |
+-----------------------------------+-----------------------------------+
                                    |
                             Retrieved Chunks
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                        Prompt Construction                            |
| "Analyze job description requirements. Here is the candidate's core  |
| project background: [Chunks]. Tailor the bullets to focus on..."    |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                         Hugging Face API                              |
|          Sends Prompt -> Receives Tailored Bullets (Qwen-7B)          |
+-----------------------------------------------------------------------+
```

### 1. Dense Semantic Indexing (`app/models/knowledge_base.py`)
*   The `knowledge_chunks` table contains an `embedding` column of type `Vector(384)`.
*   A `pgvector` HNSW index is applied over the column, supporting highly optimized nearest-neighbor searches.

### 2. Sentence Transformers Embeddings (`app/services/embeddings.py`)
*   Uses sentence-embedding representations to convert textual sentences into mathematical vectors.
*   When a new project is created, the system runs the model on the backend (or queries the Hugging Face API) to convert the text into a 384-number vector array, which is stored in the database.

### 3. Hybrid Search Strategy (`app/services/retrieval.py`)
To get the best matching project description, the search engine runs a dual query:
1.  **Dense Query (Semantic)**: Calculates the cosine distance (`<=>` operator in PostgreSQL) between the embedded Job Description and the stored vector columns. This matches conceptual keywords (e.g. "REST API" conceptual link to "endpoints").
2.  **Lexical Query (Keyword Match)**: Uses BM25 full-text indexing queries to match exact strings (e.g. `FastAPI`, `PgVector`).
3.  **Score Reciprocal Rank Fusion (RRF)**: Merges both lists to select the top 3-4 most relevant project modules.

### 4. Prompt Templating & LLM Execution (`app/api/buddy.py`)
*   Retrieves the target projects/history.
*   Builds an XML/Markdown structured prompt enclosing the relevant sections as "Candidate History Chunks" alongside the target "Job Description".
*   Instructs the LLM (`Qwen/Qwen2.5-7B-Instruct` or similar) to reformulate active past-tense statements that emphasize the key methodologies extracted from the JD.

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
*   Reads the upload.
*   Parses **PDFs** dynamically using PyMuPDF (`fitz`) and **DOCX** using python-docx. Outputs a clean text string.

### 2. Section Sanitization (`app/services/analyzer.py`)
*   `remove_sections(text, ["education", "certifications", "skills"])`
    Parses the document headers and removes blocks belonging to Education, Skills, and Certifications. This isolates the core descriptive text (Experience + Projects) to avoid false-flagging static listings.

### 3. Google X-Y-Z & Bullet Checker Heuristics
*   **Quantification Detection**: Checks each bullet point with the regex `\d+(?:\.\d+)?%?|\b\d+\b|\$\d+` to find numbers, rates, or currencies.
*   **Action Verb Check**: Matches the first word of the bullet point against a large lookup set (`VERB_LIST`) and checks for standard past-tense suffixes (`-ed`).
*   **Methodology Connectors**: Looks for terms like `by`, `through`, `resulting in`, `using` to confirm the candidate explained *how* they did the task.
*   **Aggregated Output**: Collects bullet point statistics and maps them to a single concise mistake (e.g. *"45% of achievements lack metrics"*), preventing dashboard clutter.

### 4. Readability Scoring (`count_syllables()`)
*   Applies a syllable-counting algorithm based on vowel breaks (handling silent final vowels).
*   Applies the Flesch Reading Ease formula:
    $$206.835 - 1.015 \times \left(\frac{\text{words}}{\text{sentences}}\right) - 84.6 \times \left(\frac{\text{syllables}}{\text{words}}\right)$$
*   Translates the math score into readable badges: *Very Easy (Clear)*, *Easy (Standard)*, *Medium (Technical)*, or *Hard (Complex)*.

### 5. Smart Keyword Checklist Tips (`generate_keyword_tailoring_tips()`)
*   Extracts missing skills from the Job Description comparison.
*   Matches the skill types (e.g. PostgreSQL mapped to database, React mapped to frontend).
*   Scans the resume for existing projects and inserts the keyword directly into a tailor-made sentence recommendation:
    *   *Example*: `"Add to your 'BillScan AI' project (e.g., 'Stored billing schemas and confidence scores in a PostgreSQL database')."`
*   The frontend renders these as checkable cards so users can track their optimization progress.

---

This three-pronged layout ensures that **ResumeBuddy** covers the entire lifecycle: from writing a structured resume, to tailoring it semantic-first for a job description, and finally auditing its ATS compatibility with recruiter-level quality checks.
