import re
import requests
import json
from typing import Dict, List, Optional
from app.config import HF_TOKEN
from app.services.retrieval import tokenize, extract_jd_keywords

# Common weak verbs or phrases to flag
WEAK_WORDS = {
    "responsible for": "Use an action verb instead (e.g., Led, Developed, Managed)",
    "assisted with": "Use a stronger action verb (e.g., Collaborated on, Contributed, Facilitated)",
    "helped with": "Use a stronger action verb (e.g., Assisted in, Supported, Maintained)",
    "handled": "Too passive. Try: Managed, Executed, Directed",
    "worked on": "Vague. Try: Built, Developed, Engineered, Implemented",
    "duties included": "Sounds like a list of tasks. Use active accomplishment statements.",
    "participated in": "Vague. Try: Collaborated on, Co-authored, Contributed to"
}

# Strong action verbs to suggest as replacements
STRONG_ACTION_VERBS = [
    "Spearheaded", "Engineered", "Orchestrated", "Designed", "Formulated",
    "Optimized", "Architected", "Automated", "Streamlined", "Maximized",
    "Implemented", "Pioneered", "Cultivated", "Executed", "Directed"
]

# Common spelling mistakes list for local checking
COMMON_TYPOS = {
    "developement": "development",
    "recieved": "received",
    "achived": "achieved",
    "libary": "library",
    "responsibilty": "responsibility",
    "maintainance": "maintenance",
    "agremment": "agreement",
    "succesful": "successful",
    "enviroment": "environment",
    "seperate": "separate"
}

GENERAL_STOPWORDS = {
    "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", "cannot",
    "could", "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each",
    "few", "for", "from", "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed",
    "hell", "hes", "her", "here", "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i",
    "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more",
    "most", "mustnt", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shant", "she", "shed", "shell", "shes",
    "should", "shouldnt", "so", "some", "such", "than", "that", "thats", "the", "their", "theirs", "them",
    "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", "this",
    "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well",
    "were", "weve", "werent", "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who",
    "whos", "whom", "why", "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve",
    "your", "yours", "yourself", "yourselves",
    # Generic action verbs (all tenses and aspects)
    "accelerate", "accelerated", "accelerating", "accept", "accepted", "accepting", "achieve", "achieved", "achieving",
    "add", "added", "adding", "advance", "advanced", "advancing", "advise", "advised", "advising", "agree", "agreed", "agreeing",
    "allow", "allowed", "allowing", "apply", "applied", "applying", "approach", "approached", "approaches", "approaching",
    "assist", "assisted", "assisting", "begin", "began", "beginning", "behave", "behaved", "behaving", "benefit", "benefits",
    "build", "built", "building", "carry", "carried", "carrying", "collaborate", "collaborated", "collaborating",
    "communicate", "communicated", "communicating", "communication", "complete", "completed", "completing",
    "contribute", "contributed", "contributing", "create", "created", "creating", "deliver", "delivered", "delivering",
    "demonstrate", "demonstrated", "demonstrating", "design", "designed", "designing", "develop", "developed", "developing",
    "development", "direct", "directed", "directing", "document", "documented", "documenting", "ensure", "ensured", "ensuring",
    "establish", "established", "establishing", "evaluate", "evaluated", "evaluating", "execute", "executed", "executing",
    "explain", "explained", "explaining", "focus", "focused", "focusing", "follow", "followed", "following", "guide", "guided",
    "guiding", "help", "helped", "helping", "identify", "identified", "identifying", "implement", "implemented", "implementing",
    "improve", "improved", "improving", "include", "included", "including", "integrate", "integrated", "integrating",
    "lead", "led", "leading", "learn", "learned", "learning", "manage", "managed", "managing", "maintain", "maintained",
    "maintaining", "meet", "met", "meeting", "monitor", "monitored", "monitoring", "onboard", "onboarded", "onboarding",
    "optimize", "optimized", "optimizing", "participate", "participated", "participating", "perform", "performed", "performing",
    "plan", "planned", "planning", "prepare", "prepared", "preparing", "provide", "provided", "providing", "receive", "received",
    "receiving", "reduce", "reduced", "reducing", "report", "reported", "reporting", "require", "required", "requiring",
    "resolve", "resolved", "resolving", "review", "reviewed", "reviewing", "run", "ran", "running", "save", "saved", "saving",
    "share", "shared", "sharing", "solve", "solved", "solving", "start", "started", "starting", "support", "supported",
    "supporting", "test", "tested", "testing", "train", "trained", "training", "use", "used", "using", "validate", "validated",
    "validating", "work", "worked", "working", "write", "wrote", "writing",
    # Generic resume nouns/adjectives
    "ability", "academic", "achievement", "achievements", "active", "actively", "addition", "additional", "ahead", "always",
    "another", "applicant", "applicants", "application", "applications", "area", "areas", "background", "backgrounds",
    "basic", "basically", "best", "better", "business", "candidate", "candidates", "career", "careers", "case", "cases",
    "challenge", "challenges", "client", "clients", "close", "closely", "common", "company", "companies", "concept", "concepts",
    "content", "contents", "core", "customer", "customers", "daily", "data", "date", "dates", "day", "days", "description",
    "descriptions", "detail", "details", "different", "difficult", "direction", "directions", "domain", "domains", "due",
    "during", "each", "effective", "effectively", "effort", "efforts", "email", "emails", "employee", "employees", "employer",
    "employers", "end", "environment", "environments", "etc", "e.g.", "i.e.", "example", "examples", "experience", "experiences",
    "expert", "experts", "expertise", "field", "fields", "first", "free", "full", "future", "general", "goal", "goals", "good",
    "great", "group", "groups", "hand", "hands", "high", "highly", "history", "hour", "hours", "impact", "impacts", "importance",
    "important", "industry", "industries", "info", "information", "insight", "insights", "interest", "interests", "intern",
    "interns", "internship", "internships", "interview", "interviews", "issue", "issues", "job", "jobs", "key", "knowledge",
    "large", "level", "levels", "life", "linkedin", "local", "long", "low", "main", "major", "manner", "many", "member",
    "members", "method", "methods", "metric", "metrics", "mind", "mindset", "month", "months", "need", "needs", "new", "next",
    "number", "numbers", "office", "offices", "one", "ones", "opportunity", "opportunities", "option", "options", "outcome",
    "outcomes", "overall", "own", "part", "parts", "partner", "partners", "passion", "passionate", "past", "path", "paths",
    "people", "personal", "personally", "phone", "phones", "place", "places", "plan", "plans", "platform", "platforms",
    "point", "points", "position", "positions", "practice", "practices", "problem", "problems", "process", "processes",
    "product", "products", "professional", "professionals", "profile", "profiles", "program", "programs", "project",
    "projects", "quality", "qualities", "question", "questions", "rate", "rates", "read", "ready", "real", "reason", "reasons",
    "recommendation", "recommendations", "record", "records", "recruiter", "recruiters", "relevance", "relevant", "result",
    "results", "resume", "resumes", "review", "reviews", "right", "road", "roadmap", "roadmaps", "role", "roles", "service",
    "services", "session", "sessions", "skill", "skills", "solution", "solutions", "someone", "something", "standard",
    "standards", "status", "step", "steps", "street", "structure", "structures", "structured", "success", "successful",
    "system", "systems", "task", "tasks", "team", "teams", "technology", "technologies", "term", "terms", "text", "texts",
    "thing", "things", "time", "times", "today", "tool", "tools", "top", "total", "track", "tracks", "type", "types", "user",
    "users", "value", "values", "variety", "various", "way", "ways", "week", "weeks", "well", "word", "words", "world",
    "year", "years", "ad", "addon", "add-on", "benefits", "bas", "agent", "agents", "ahead", "begin", "behave"
}

def extract_clean_keywords(text: str) -> Dict[str, str]:
    """
    Extracts high-value terms from text.
    Returns a dictionary mapping the lowercase version of the term to its original case version in the text.
    Filters out digits, generic words, and short terms.
    """
    words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9.+#-]*\b', text)
    
    clean_map = {}
    for w in words:
        w_clean = w.strip(".- ")
        w_lower = w_clean.lower()
        
        if len(w_clean) < 2:
            continue
        if re.search(r'\d', w_clean):
            continue
        if w_lower in GENERAL_STOPWORDS:
            continue
            
        if w_lower not in clean_map:
            clean_map[w_lower] = w_clean
        else:
            current = clean_map[w_lower]
            if not current[0].isupper() and w_clean[0].isupper():
                clean_map[w_lower] = w_clean
            elif len(w_clean) > len(current):
                clean_map[w_lower] = w_clean
                
    return clean_map

def clean_keyword_list(kw_list: List[str]) -> List[str]:
    """Filters out numeric values, short words, and standard generic terms from AI results."""
    cleaned = []
    for kw in kw_list:
        kw_strip = kw.strip(".- ")
        kw_lower = kw_strip.lower()
        if len(kw_strip) < 2:
            continue
        if re.search(r'\d', kw_strip):
            continue
        if kw_lower in GENERAL_STOPWORDS:
            continue
        cleaned.append(kw_strip)
    return cleaned

def generate_keyword_tailoring_tips(missing_keywords: List[str], text: str) -> List[Dict]:
    """
    Generates contextual placement recommendations for missing keywords
    based on the projects/experience detected in the resume text.
    """
    tips = []
    
    has_resumebuddy = any(x in text.lower() for x in ["resumebuddy", "buddy"])
    has_billscan = any(x in text.lower() for x in ["billscan", "donut", "indian bill"])
    has_classroom = any(x in text.lower() for x in ["classroom", "java swing", "sockets"])
    has_accenture = any(x in text.lower() for x in ["accenture", "workday"])
    
    database_terms = ["sql", "postgres", "mysql", "mongodb", "sqlite", "redis", "database", "query", "indexing"]
    ai_ml_terms = ["pytorch", "tensor", "keras", "scikit", "numpy", "pandas", "ml", "nlp", "llm", "rag", "embed", "transformer", "fine-tuning"]
    frontend_terms = ["react", "next.js", "typescript", "javascript", "tailwind", "html", "css", "vue", "angular", "frontend"]
    backend_terms = ["fastapi", "flask", "django", "nodejs", "express", "api", "jwt", "auth", "backend"]
    devops_terms = ["docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "git", "github", "jenkins"]

    for kw in missing_keywords:
        kw_lower = kw.lower()
        tip = ""
        suggested_section = "Skills Section"
        
        # 1. Database skills
        if any(term in kw_lower for term in database_terms):
            suggested_section = "Database / Back-end"
            if has_billscan:
                tip = f"Add to your 'BillScan AI' project (e.g., 'Stored billing schemas and confidence scores in a {kw} database')."
            elif has_classroom:
                tip = f"Add to your 'Virtual Classroom' project (e.g., 'Optimized role-based queries and table joins using {kw}')."
            else:
                tip = f"List {kw} in your Skills list and mention it under a database-driven project description."
                
        # 2. AI / ML / NLP skills
        elif any(term in kw_lower for term in ai_ml_terms):
            suggested_section = "AI & Machine Learning"
            if has_billscan:
                tip = f"Mention {kw} under 'BillScan AI' (e.g. 'implemented a two-stage parsing pipeline leveraging {kw}')."
            elif has_accenture:
                tip = f"Incorporate {kw} in your Accenture AEH Summer Intern experience (e.g., when describing Agentic AI workflows)."
            else:
                tip = f"Add {kw} to your Projects section when highlighting machine learning modeling or vector lookups."
                
        # 3. Frontend terms
        elif any(term in kw_lower for term in frontend_terms):
            suggested_section = "Frontend Development"
            if has_resumebuddy:
                tip = f"Add to your 'ResumeBuddy' project description (e.g., 'built the interactive drag-and-drop builder using {kw}')."
            elif has_billscan:
                tip = f"Mention {kw} when describing the confidence scoring and one-click correction dashboard in 'BillScan AI'."
            else:
                tip = f"List {kw} in your Skills list and reference it in a web application project description."
                
        # 4. Backend terms
        elif any(term in kw_lower for term in backend_terms):
            suggested_section = "Back-end Architect"
            if has_resumebuddy:
                tip = f"Mention {kw} in your 'ResumeBuddy' project (e.g., 'implemented REST endpoints and JWT authentication using {kw}')."
            elif has_billscan:
                tip = f"Reference {kw} when describing your anomaly detection backend APIs."
            else:
                tip = f"Include {kw} in your Skills list and detail your API architecture in a backend project."
                
        # 5. DevOps / Cloud terms
        elif any(term in kw_lower for term in devops_terms):
            suggested_section = "DevOps & Deployment"
            tip = f"Integrate {kw} as a deployment detail (e.g., 'packaged applications into {kw} containers for local deployment')."
            
        # 6. Generic fallback
        else:
            suggested_section = "Skills / General"
            tip = f"Add {kw} to your Skills list and mention it as part of your core engineering competencies."
            
        tips.append({
            "keyword": kw,
            "section": suggested_section,
            "tip": tip
        })
        
    return tips

def analyze_resume_text(resume_text: str, job_description: Optional[str] = None) -> Dict:
    """
    Analyzes resume text for ATS score, keywords match, grammar/spelling, style, and essential sections.
    Uses Hugging Face LLM if token is present, falling back to a robust rule-based analyzer.
    """
    if not resume_text.strip():
        return get_fallback_analysis("Empty resume text provided.", job_description)

    # Clean the input text
    cleaned_text = resume_text.strip()
    result = None

    # Try AI analysis first if token is available
    if HF_TOKEN:
        try:
            ai_result = analyze_with_ai(cleaned_text, job_description)
            if ai_result:
                # Clean up AI returned keywords
                ai_result["matched_keywords"] = clean_keyword_list(ai_result.get("matched_keywords", []))
                ai_result["missing_keywords"] = clean_keyword_list(ai_result.get("missing_keywords", []))
                result = ai_result
        except Exception as e:
            print(f"AI Analysis failed: {str(e)}. Falling back to rule-based analysis.")

    if not result:
        # Fallback to local rule-based analysis
        result = get_fallback_analysis(cleaned_text, job_description)

    # Attach keyword tailoring suggestions
    missing_kws = result.get("missing_keywords", [])
    result["missing_keywords_with_tips"] = generate_keyword_tailoring_tips(missing_kws, cleaned_text)
    
    return result


def analyze_with_ai(resume_text: str, job_description: Optional[str] = None) -> Optional[Dict]:
    """Queries Hugging Face Serverless Inference API for structured analysis."""
    url = "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct"
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }

    # Format the prompt
    system_instruction = (
        "You are an expert Applicant Tracking System (ATS) auditor and career coach. "
        "Analyze the provided resume text. If a job description is provided, compare the resume against it. "
        "Return ONLY a JSON object (do not wrap in markdown ```json blocks). "
        "Ensure all fields are fully populated according to this exact JSON schema:\n"
        "{\n"
        "  \"ats_score\": number (0-100),\n"
        "  \"structure_score\": number (0-100),\n"
        "  \"language_score\": number (0-100),\n"
        "  \"impact_score\": number (0-100),\n"
        "  \"contact_score\": number (0-100),\n"
        "  \"keyword_score\": number (0-100),\n"
        "  \"essential_sections\": [\n"
        "    { \"section\": \"Contact Information\", \"exists\": boolean, \"details\": \"string description\" },\n"
        "    { \"section\": \"Work Experience\", \"exists\": boolean, \"details\": \"string description\" },\n"
        "    { \"section\": \"Education\", \"exists\": boolean, \"details\": \"string description\" },\n"
        "    { \"section\": \"Skills\", \"exists\": boolean, \"details\": \"string description\" },\n"
        "    { \"section\": \"Projects\", \"exists\": boolean, \"details\": \"string description\" }\n"
        "  ],\n"
        "  \"contact_checklist\": {\n"
        "    \"has_email\": boolean,\n"
        "    \"has_phone\": boolean,\n"
        "    \"has_linkedin\": boolean,\n"
        "    \"has_github\": boolean\n"
        "  },\n"
        "  \"suggestions\": [\"string suggestion 1\", \"string suggestion 2\"],\n"
        "  \"mistakes\": [\"string mistake 1\", \"string mistake 2\"],\n"
        "  \"grammar_spelling_errors\": [\n"
        "    { \"type\": \"spelling\" or \"grammar\", \"error\": \"misspelled/wrong word\", \"suggestion\": \"corrected word\", \"context\": \"sentence snippet with the error\" }\n"
        "  ],\n"
        "  \"metrics\": {\n"
        "    \"word_count\": number,\n"
        "    \"estimated_read_time_minutes\": number,\n"
        "    \"action_verbs_count\": number,\n"
        "    \"readability_score\": \"Easy\" or \"Medium\" or \"Hard\"\n"
        "  },\n"
        "  \"matched_keywords\": [\"string\", ...],\n"
        "  \"missing_keywords\": [\"string\", ...]\n"
        "}"
    )

    jd_section = f"Job Description:\n{job_description}\n\n" if job_description else "No specific job description provided. Perform a general ATS audit.\n\n"
    user_prompt = f"{jd_section}Resume Text:\n{resume_text}"

    payload = {
        "inputs": f"<|im_start|>system\n{system_instruction}<|im_end|>\n<|im_start|>user\n{user_prompt}<|im_end|>\n<|im_start|>assistant\n",
        "parameters": {
            "max_new_tokens": 1500,
            "temperature": 0.2,
            "return_full_text": False
        }
    }

    response = requests.post(url, headers=headers, json=payload, timeout=20.0)
    if response.status_code == 200:
        result = response.json()
        text_out = ""
        if isinstance(result, list) and len(result) > 0:
            text_out = result[0].get("generated_text", "")
        elif isinstance(result, dict):
            text_out = result.get("generated_text", "")

        # Try to parse JSON output
        parsed_json = extract_json(text_out)
        if parsed_json:
            # Recheck standard items in case the model omitted them
            ensure_essential_fields(parsed_json, resume_text, job_description)
            return parsed_json

    return None


def extract_json(text: str) -> Optional[Dict]:
    """Helper to clean and extract JSON from string output."""
    try:
        # Remove any Markdown code block wrappers
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n", "", cleaned)
            cleaned = re.sub(r"\n```$", "", cleaned)
        cleaned = cleaned.strip()

        # Find first curly brace and last curly brace
        start_idx = cleaned.find("{")
        end_idx = cleaned.rfind("}")
        if start_idx != -1 and end_idx != -1:
            json_str = cleaned[start_idx:end_idx + 1]
            return json.loads(json_str)
    except Exception as e:
        print(f"Error parsing JSON from response: {str(e)}")
    return None


def ensure_essential_fields(parsed_json: Dict, text: str, jd: Optional[str]):
    """Ensures structure validation in AI JSON output."""
    for score_field in ["ats_score", "structure_score", "language_score", "impact_score", "contact_score", "keyword_score"]:
        if score_field not in parsed_json:
            parsed_json[score_field] = 70

    if "essential_sections" not in parsed_json:
        parsed_json["essential_sections"] = []
    if "contact_checklist" not in parsed_json:
        parsed_json["contact_checklist"] = {"has_email": False, "has_phone": False, "has_linkedin": False, "has_github": False}
    if "suggestions" not in parsed_json:
        parsed_json["suggestions"] = ["Maintain quantitative impact highlights."]
    if "mistakes" not in parsed_json:
        parsed_json["mistakes"] = []
    if "grammar_spelling_errors" not in parsed_json:
        parsed_json["grammar_spelling_errors"] = []
    if "metrics" not in parsed_json:
        words = len(text.split())
        parsed_json["metrics"] = {
            "word_count": words,
            "estimated_read_time_minutes": max(1, round(words / 200)),
            "action_verbs_count": 5,
            "readability_score": "Medium"
        }
    if "matched_keywords" not in parsed_json:
        parsed_json["matched_keywords"] = []
    if "missing_keywords" not in parsed_json:
        parsed_json["missing_keywords"] = []


def count_syllables(word: str) -> int:
    word = word.lower().strip(".:;!?()-,")
    if len(word) <= 3:
        return 1
    vowels = "aeiouy"
    count = 0
    if word[0] in vowels:
        count += 1
    for index in range(1, len(word)):
        if word[index] in vowels and word[index - 1] not in vowels:
            count += 1
    if word.endswith("e"):
        count -= 1
    if count <= 0:
        count = 1
    return count

BUZZWORDS = {
    "team player": "Overused cliché. Instead, describe a project where you collaborated or led a team.",
    "detail-oriented": "Overused phrase. Show this through your precise metrics instead.",
    "hardworking": "Generic adjective. Let your accomplishments speak for themselves.",
    "go-getter": "Unprofessional slang. Replace with action-oriented achievements.",
    "self-starter": "Vague. Describe how you initiated or owned a project from scratch.",
    "think outside the box": "Overused corporate buzzword. Focus on original solutions you developed.",
    "synergy": "Corporate jargon. Explain the collaboration or integration in clear terms.",
    "results-driven": "Vague buzzword. Demonstrate this with concrete numbers and stats.",
    "motivated": "Fluff. Use accomplishments to show your dedication.",
    "dynamic": "Meaningless filler. Replace with description of your specific actions.",
    "go-to person": "Informal. Try: Subject Matter Expert, Key Contributor."
}

VERB_LIST = {
    "spearheaded", "engineered", "orchestrated", "designed", "formulated",
    "optimized", "architected", "automated", "streamlined", "maximized",
    "implemented", "pioneered", "cultivated", "executed", "directed",
    "managed", "led", "built", "created", "developed", "established",
    "improved", "increased", "decreased", "saved", "reduced", "analyzed",
    "produced", "delivered", "facilitated", "supervised", "coordinated",
    "collaborated", "negotiated", "authored", "resolved"
}

def remove_sections(text: str, sections_to_remove: List[str]) -> str:
    """
    Removes sections (e.g. Education, Certifications, Skills) from the text
    so they are not scanned for bullet point audits.
    """
    headers = {
        "education": [r"\beducation\b", r"\bacademics\b", r"\bacademic background\b"],
        "certifications": [r"\bcertifications\b", r"\bcertificates\b", r"\bawards\b", r"\bachievements\b", r"\bpublications\b"],
        "skills": [r"\bskills\b", r"\btechnical skills\b", r"\btechnologies\b", r"\bcore competencies\b"]
    }
    
    cleaned_text = text
    for sec_name in sections_to_remove:
        patterns = headers.get(sec_name.lower(), [])
        for p in patterns:
            match = re.search(p, cleaned_text, re.IGNORECASE)
            if match:
                start_pos = match.start()
                # Find the next section header starting after match.end()
                all_other_patterns = [
                    r"\bexperience\b", r"\bemployment\b", r"\bwork history\b",
                    r"\bprofessional history\b", r"\bskills\b", r"\btechnical skills\b",
                    r"\btechnologies\b", r"\bcore competencies\b", r"\bprojects\b",
                    r"\bpersonal projects\b", r"\bkey projects\b", r"\beducation\b",
                    r"\bacademics\b", r"\bcertifications\b", r"\bcertificates\b", r"\bawards\b"
                ]
                next_pos = len(cleaned_text)
                for op in all_other_patterns:
                    op_match = re.search(op, cleaned_text[match.end():], re.IGNORECASE)
                    if op_match:
                        pos = match.end() + op_match.start()
                        if pos < next_pos:
                            next_pos = pos
                cleaned_text = cleaned_text[:start_pos] + "\n" + cleaned_text[next_pos:]
                break
                
    return cleaned_text

def get_fallback_analysis(text: str, job_description: Optional[str] = None) -> Dict:
    """Calculates all metrics locally using regexes, rules, and token intersections."""
    words = text.split()
    word_count = len(words)

    # 1. Contact Info Checks
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    phone_match = re.search(r'\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}', text)
    linkedin_match = re.search(r'linkedin\.com/in/[a-zA-Z0-9_-]+', text, re.IGNORECASE)
    github_match = re.search(r'github\.com/[a-zA-Z0-9_-]+', text, re.IGNORECASE)

    has_email = email_match is not None
    has_phone = phone_match is not None
    has_linkedin = linkedin_match is not None
    has_github = github_match is not None

    contact_checklist = {
        "has_email": has_email,
        "has_phone": has_phone,
        "has_linkedin": has_linkedin,
        "has_github": has_github
    }

    # Contact Score Calculation
    contact_score = 20
    if has_email: contact_score += 30
    if has_phone: contact_score += 20
    if has_linkedin: contact_score += 20
    if has_github: contact_score += 10

    # 2. Section Checks (Regex Case-Insensitive Headers)
    sections_def = {
        "Contact Information": r"(contact|personal info|about me|details|email|phone)",
        "Work Experience": r"(experience|employment|history|work|career)",
        "Education": r"(education|academic|qualification|university|college|school)",
        "Skills": r"(skills|technologies|expertise|competencies|tools)",
        "Projects": r"(projects|personal projects|key projects|academic projects)"
    }

    essential_sections = []
    found_sections_count = 0
    for name, pattern in sections_def.items():
        if name == "Contact Information" and (has_email or has_phone):
            exists = True
            details = "Found contact details (email or phone) in the text."
        else:
            match = re.search(pattern, text, re.IGNORECASE)
            exists = match is not None
            details = f"Detected '{name}' section header in the text." if exists else f"Could not locate an explicit '{name}' section header."

        if exists:
            found_sections_count += 1

        essential_sections.append({
            "section": name,
            "exists": exists,
            "details": details
        })

    # 3. Action Verbs, Weak Phrases, and Quantification
    action_verbs_found = []
    for verb in STRONG_ACTION_VERBS:
        if re.search(r'\b' + re.escape(verb.lower()) + r'\b', text.lower()):
            action_verbs_found.append(verb)

    # Weak words search
    mistakes = []
    suggestions = []
    weak_phrases_count = 0
    for phrase, tip in WEAK_WORDS.items():
        if re.search(r'\b' + re.escape(phrase) + r'\b', text.lower()):
            weak_phrases_count += 1
            mistakes.append(f"Contains passive phrase: '{phrase}'. Suggestion: {tip}")

    # Bullet Auditing & Google X-Y-Z check (Scoped to Experience & Projects, excluding Skills/Education/Certifications)
    analyzable_text = remove_sections(text, ["education", "certifications", "skills"])
    bullets = re.findall(r'(?:^|\n)\s*[-•*+]\s+(.*)', analyzable_text)
    quantified_bullets_count = 0
    non_verb_bullets = 0
    weak_impact_bullets = 0
    
    unquantified_examples = []
    non_verb_examples = []
    no_connector_examples = []

    for bullet in bullets:
        bullet_clean = bullet.strip()
        if not bullet_clean or len(bullet_clean.split()) < 4:
            continue
            
        # A. Quantification check
        has_metric = re.search(r'\d+(?:\.\d+)?%?|\b\d+\b|\$\d+', bullet_clean) is not None
        print(bullet_clean)
        if has_metric:
            quantified_bullets_count += 1
        else:
            first_words = " ".join(bullet_clean.split()[:4]) + "..."
            print(first_words)
            unquantified_examples.append(first_words)
            
        # B. Start-word verb check
        words_in_bullet = bullet_clean.split()
        if words_in_bullet:
            first_word = words_in_bullet[0].strip(".,;:()").lower()
            is_verb = first_word in VERB_LIST or first_word.endswith("ed")
            if not is_verb:
                non_verb_bullets += 1
                first_words = " ".join(words_in_bullet[:3]) + "..."
                non_verb_examples.append(f"'{words_in_bullet[0]}' in '{first_words}'")
                
        # C. Google X-Y-Z connector check
        has_connector = re.search(r'\b(by|through|resulting in|leads to|to achieve|reducing|increasing|improving|using|via|with)\b', bullet_clean.lower()) is not None
        if not has_connector:
            weak_impact_bullets += 1
            first_words = " ".join(words_in_bullet[:4]) + "..."
            no_connector_examples.append(first_words)

    bullets_count = len(bullets)
    quantification_rate = (quantified_bullets_count / bullets_count) if bullets_count > 0 else 0
    impact_score = int(30 + (quantification_rate * 50) + (min(5, len(action_verbs_found)) / 5 * 20)) if bullets_count > 0 else 60

    # Aggregated Bullet Point Feedback
    if unquantified_examples and bullets_count > 0:
        pct_unquantified = int(((bullets_count - quantified_bullets_count) / bullets_count) * 100)
        mistakes.append(
            f"Metrics missing: {pct_unquantified}% of achievements (e.g. '{unquantified_examples[0]}') lack numbers or percentages. Use the Google X-Y-Z formula: Accomplished [X] as measured by [Y], by doing [Z]."
        )
    if non_verb_examples:
        mistakes.append(
            f"Passive phrasing: {non_verb_bullets} bullet points do not start with a strong action verb (e.g. {non_verb_examples[0]}). Rephrase to start with terms like 'Spearheaded' or 'Optimized'."
        )
    if no_connector_examples:
        suggestions.append(
            f"Clarify project methodologies: Explain *how* outcomes were achieved in your bullets (e.g., in '{no_connector_examples[0]}', add details like 'by leveraging React' or 'via SQL indexing')."
        )

    # Verb Repetition Check
    verb_counts = {}
    words_lower = [w.strip(".,;:()!?").lower() for w in words]
    for w in words_lower:
        if w in VERB_LIST:
            verb_counts[w] = verb_counts.get(w, 0) + 1
            
    repeated_verbs = [v.capitalize() for v, count in verb_counts.items() if count >= 3]
    if repeated_verbs:
        mistakes.append(
            f"Repetitive phrasing: You used action words like {', '.join(repeated_verbs[:3])} multiple times. Try using synonyms (e.g., Orchestrated, Pioneered, Executed) to keep the text engaging."
        )

    # Buzzword Checker
    found_buzzwords = []
    for buzz, tip in BUZZWORDS.items():
        if re.search(r'\b' + re.escape(buzz) + r'\b', text.lower()):
            found_buzzwords.append(f"'{buzz}'")
            if len(found_buzzwords) <= 2:
                suggestions.append(f"Remove generic buzzword '{buzz}': {tip}")
    if found_buzzwords:
        mistakes.append(f"Contains overused cliches: {', '.join(found_buzzwords[:3])}. Try to replace with descriptive facts.")

    # Readability Metric (Flesch Reading Ease approximation)
    sentences = re.split(r'[.!?](?=\s|$)', text)
    sentences = [s for s in sentences if len(s.strip()) > 5]
    sentence_count = len(sentences) if len(sentences) > 0 else 1
    
    syllable_count = sum(count_syllables(w) for w in words)
    flesch_score = 206.835 - 1.015 * (word_count / sentence_count) - 84.6 * (syllable_count / word_count)
    
    if flesch_score >= 80:
        readability_score = "Very Easy (Clear)"
    elif flesch_score >= 60:
        readability_score = "Easy (Standard Business)"
    elif flesch_score >= 40:
        readability_score = "Medium (Technical & Clear)"
    else:
        readability_score = "Hard (Try shorter sentences)"

    metrics = {
        "word_count": word_count,
        "estimated_read_time_minutes": max(1, round(word_count / 200)),
        "action_verbs_count": max(1, len(action_verbs_found)),
        "readability_score": readability_score,
        "quantification_rate": int(quantification_rate * 100)
    }

    # Language Score
    language_score = max(40, 100 - (weak_phrases_count * 10) - (len(repeated_verbs) * 8) - (non_verb_bullets * 4))
    if word_count < 250 or word_count > 950:
        language_score = max(40, language_score - 12)
        mistakes.append(f"Length Alert: Suboptimal word count ({word_count} words). Recommended length for optimal ATS scoring is 350-750 words.")

    # Structure Score
    structure_score = int((found_sections_count / len(sections_def)) * 100) - (non_verb_bullets * 2)
    structure_score = max(40, min(100, structure_score))

    # 4. Spelling & Grammar check (Local lookup for typical errors)
    grammar_spelling_errors = []
    for typo, correction in COMMON_TYPOS.items():
        match = re.search(r'\b' + re.escape(typo) + r'\b', text.lower())
        if match:
            start = max(0, match.start() - 30)
            end = min(len(text), match.end() + 30)
            context = "..." + text[start:end].replace("\n", " ").strip() + "..."
            grammar_spelling_errors.append({
                "type": "spelling",
                "error": typo,
                "suggestion": correction,
                "context": context
            })

    # 5. Job Matching
    matched_keywords = []
    missing_keywords = []
    keyword_score = 100

    if job_description:
        jd_clean_map = extract_clean_keywords(job_description)
        resume_clean_map = extract_clean_keywords(text)

        matches_lower = set(jd_clean_map.keys()) & set(resume_clean_map.keys())
        misses_lower = set(jd_clean_map.keys()) - set(resume_clean_map.keys())

        matched_keywords = [jd_clean_map[kw] for kw in sorted(list(matches_lower))][:20]
        missing_keywords = [jd_clean_map[kw] for kw in sorted(list(misses_lower))][:20]

        if jd_clean_map:
            # Calibrate score: matching 12 keywords gives a solid 85-100% score
            denominator = min(12, len(jd_clean_map))
            keyword_score = int((len(matches_lower) / denominator) * 100)
    else:
        keyword_score = 100

    # 6. Suggestions assembly
    if not has_linkedin:
        suggestions.append("Add a professional LinkedIn link to help recruiters find your public profile.")
    if not has_github:
        suggestions.append("Include your GitHub link if applying for technical or development roles.")
    if found_sections_count < len(sections_def):
        suggestions.append("Ensure your resume contains all standard sections: Personal Info, Work History, Education, Skills, and Projects.")
    if len(action_verbs_found) < 3:
        suggestions.append("Incorporate more active, impact-oriented action verbs (e.g. Optimized, Automated, Spearheaded).")
    if quantification_rate < 0.4:
        suggestions.append("Quantify your project outcomes and job achievements with concrete numbers and metrics (e.g., 'improved performance by 15%').")

    # Limit suggestions and mistakes list length to keep interface clean
    suggestions = suggestions[:4]
    mistakes = mistakes[:4]

    if not suggestions:
        suggestions.append("Resume formatting and metrics are solid. Tailor your description closely to your target job description.")

    # Overall ATS calculation
    if job_description:
        ats_score = int(
            (0.15 * contact_score) +
            (0.20 * structure_score) +
            (0.20 * language_score) +
            (0.20 * impact_score) +
            (0.25 * keyword_score)
        )
    else:
        ats_score = int(
            (0.25 * contact_score) +
            (0.25 * structure_score) +
            (0.25 * language_score) +
            (0.25 * impact_score)
        )

    return {
        "ats_score": min(98, max(45, ats_score)),
        "structure_score": min(100, max(0, structure_score)),
        "language_score": min(100, max(0, language_score)),
        "impact_score": min(100, max(0, impact_score)),
        "contact_score": min(100, max(0, contact_score)),
        "keyword_score": min(100, max(0, keyword_score)),
        "essential_sections": essential_sections,
        "contact_checklist": contact_checklist,
        "suggestions": suggestions,
        "mistakes": mistakes,
        "grammar_spelling_errors": grammar_spelling_errors,
        "metrics": metrics,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords
    }
