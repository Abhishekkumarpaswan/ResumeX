from sqlalchemy.orm import Session
from app.models.knowledge_base import (
    KBProject, KBExperience, KBSkill,
    KBCertification, KBAchievement
)
from app.services.embeddings import generate_embedding
from rank_bm25 import BM25Okapi
import re
import math

SYNONYM_MAP = {
    "javascript": "js",
    "typescript": "ts",
    "amazon web services": "aws",
    "kubernetes": "k8s",
    "postgresql": "postgres",
    "reactjs": "react",
    "react.js": "react",
    "node.js": "node",
    "nodejs": "node",
    "next.js": "next",
    "nextjs": "next",
    
    # Modern AI/ML synonyms/concepts
    "llms": "llm",
    "agents": "agent",
    "agentic": "agent",
    "genai": "genai",
    "generative": "genai",
    "rag": "rag",
    "fastapi": "api",
    "flask": "api",
    "rest": "api",
    "apis": "api",
    "pgvector": "vector",
}

STOPWORDS = {
    "a", "an", "am", "as", "at", "be", "by", "do", "he", "if", "in", 
    "is", "it", "me", "my", "no", "of", "on", "or", "so", "to", "up", 
    "we", "us", "oh", "ah", "and", "the", "for", "with", "by", "from", "was",
    "were", "have", "has", "had", "will", "would", "could", "should",
    "you", "our", "your", "they", "this", "that", "these", "those",
    "work", "good", "well", "also", "using", "use", "used", "into", "them",
    "design", "designed", "designer", "build", "built", "building",
    "develop", "developed", "developer", "developing", "development",
    "solve", "solved", "solving", "solution", "solutions",
    "application", "applications", "environment", "environments",
    "capability", "capabilities", "problem", "problems",
    "platform", "platforms", "role", "roles", "outcomes", "outcome",
    "domain", "domains", "title", "titles", "description", "descriptions",
    "team", "teams", "collaborate", "collaborated", "collaborating",
    "deliver", "delivered", "delivering", "enhance", "enhanced", "enhancing",
    "user", "users", "experience", "experiences", "task", "tasks",
    "job", "jobs", "project", "projects", "company", "companies",
    "intern", "internship", "internships", "summer", "responsibilities"
}

def stem_word(w: str) -> str:
    if len(w) <= 3:
        return w
    if w.endswith("ies"):
        w = w[:-3] + "y"
    elif w.endswith("sses"):
        w = w[:-2]
    elif w.endswith("s") and not w.endswith("ss") and not w.endswith("us") and not w.endswith("is") and not w.endswith("as"):
        w = w[:-1]
    
    if w.endswith("ingly"):
        w = w[:-5]
    elif w.endswith("ing"):
        w = w[:-3]
        if w.endswith("at"):
            w += "e"
    elif w.endswith("ed"):
        w = w[:-2]
        if w.endswith("at"):
            w += "e"
    return w

def tokenize(text: str) -> list:
    text = text.lower()
    text = text.replace("generative ai", "genai").replace("gen ai", "genai")
    text = text.replace("c++", "cpp").replace("c#", "csharp").replace(".net", "dotnet")
    text = text.replace("node.js", "node").replace("react.js", "react").replace("next.js", "next")
    
    text = re.sub(r'[^\w\s]', ' ', text)
    
    tokens = []
    for w in text.split():
        w_mapped = SYNONYM_MAP.get(w, w)
        stemmed = stem_word(w_mapped)
        if stemmed not in STOPWORDS:
            tokens.append(stemmed)
    return tokens

def extract_technology_tokens(tech_string: str) -> set:
    if not tech_string:
        return set()
    tokens = []
    # Split by comma, semicolon, or slash
    for term in re.split(r'[,;/]', tech_string):
        term = term.strip().lower()
        if not term:
            continue
        tokens.extend(tokenize(term))
    return set(tokens)

def cosine_similarity(a: list, b: list) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x ** 2 for x in a) ** 0.5
    norm_b = sum(x ** 2 for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

def calibrated_similarity(jd_embedding: list, item_embedding: list) -> float:
    raw_sim = cosine_similarity(jd_embedding, item_embedding)
    # Scale range [0.3, 0.8] to [0.0, 1.0]
    min_val = 0.3
    max_val = 0.8
    scaled_sim = (raw_sim - min_val) / (max_val - min_val)
    return max(0.0, min(1.0, scaled_sim))


def normalize_bm25(raw_score: float) -> float:
    """
    Convert a raw BM25 score to a 0-1 range using a fixed saturation curve,
    instead of dividing by the max score in the current corpus.
    Dividing by corpus-max makes scores relative to whatever else happens
    to be in the knowledge base (unstable with small corpora) rather than
    reflecting absolute match quality. This uses 1 - e^(-score/k), which
    saturates smoothly: a raw BM25 of ~6-8 (a strong real match) lands
    around 0.7-0.85, while a raw score of ~1-2 (a couple incidental word
    overlaps) stays low, around 0.15-0.3.
    """
    k = 6.0
    return 1 - math.exp(-raw_score / k)

def extract_jd_keywords(jd_text: str) -> set:
    tokens = tokenize(jd_text)
    stopwords = {
        "and", "or", "the", "a", "an", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "are", "was", "were", "be",
        "have", "has", "had", "will", "would", "could", "should", "you",
        "we", "our", "your", "they", "this", "that", "these", "those",
        "must", "able", "work", "good", "also", "well", "can", "not",
        "using", "real", "world", "into", "them", "design", "build",
        "develop", "solve", "solutions", "applications", "environments",
        "capabilities", "problems", "platforms"
    }
    return {t for t in tokens if t not in stopwords}

def rule_based_boost(item_text: str, jd_keywords: set, technologies: str = "") -> float:
    boost = 0.0
    item_tokens = set(tokenize(item_text))
    # Use direct comma-split and normalization for technology lists
    tech_tokens = extract_technology_tokens(technologies)

    # Exact keyword match boost (general text overlap)
    exact_matches = item_tokens & jd_keywords
    boost += min(len(exact_matches) * 0.025, 0.10)

    # Technology match boost — this is the strongest real signal.
    tech_matches = tech_tokens & jd_keywords
    boost += min(len(tech_matches) * 0.10, 0.40)

    return min(boost, 1.0)

def score_items(items, build_text_fn, embed_text_fn, jd_text, jd_embedding, jd_keywords):
    """
    Shared scoring routine for projects/experience/certifications/achievements.
    Returns list of (final_score, item) sorted descending.
    """
    if not items:
        return []

    item_texts = [tokenize(build_text_fn(i)) for i in items]
    bm25 = BM25Okapi(item_texts)
    bm25_raw_scores = bm25.get_scores(tokenize(jd_text))

    # Dynamic Weighting based on items count
    if len(items) < 4:
        w_vector, w_bm25, w_boost = 0.65, 0.10, 0.25
    else:
        w_vector, w_bm25, w_boost = 0.55, 0.20, 0.25

    scored = []
    for i, item in enumerate(items):
        if item.embedding is None:
            continue
        # Use calibrated similarity to expand the dynamic range
        vector_score = calibrated_similarity(jd_embedding, list(item.embedding))
        bm25_score = normalize_bm25(bm25_raw_scores[i])
        boost = rule_based_boost(
            embed_text_fn(item)[0],
            jd_keywords,
            embed_text_fn(item)[1]
        )
        final_score = (w_vector * vector_score) + (w_bm25 * bm25_score) + (w_boost * boost)
        scored.append((final_score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored


def apply_min_selection(scored: list, threshold: float, minimum: int) -> list:
    """
    Given a (score, item) list sorted descending, keep everything above
    `threshold`. If that leaves fewer than `minimum` items (but enough
    exist overall), top up with the next-highest scoring items regardless
    of threshold so the resume never drops below the guaranteed minimum.
    """
    selected = [(s, item) for s, item in scored if s > threshold]
    if len(selected) < minimum:
        already = {id(item) for _, item in selected}
        for s, item in scored:
            if len(selected) >= minimum:
                break
            if id(item) not in already:
                selected.append((s, item))
                already.add(id(item))
        selected.sort(key=lambda x: x[0], reverse=True)
    return selected


def retrieve_and_rank(user_id: int, jd_text: str, db: Session) -> dict:
    jd_embedding = generate_embedding(jd_text)
    jd_keywords = extract_jd_keywords(jd_text)

    results = {
        "projects": [],
        "experience": [],
        "certifications": [],
        "achievements": [],
        "skills": []
    }

    # --- Projects ---
    projects = db.query(KBProject).filter(KBProject.user_id == user_id).all()
    if projects:
        def build_text(p):
            return f"{p.title} {p.description or ''} {p.technologies or ''} {p.role or ''} {p.outcomes or ''} {p.domain or ''}"

        def embed_text(p):
            item_text = f"{p.title} {p.description or ''} {p.outcomes or ''}"
            return (item_text, p.technologies or "")

        scored = score_items(projects, build_text, embed_text, jd_text, jd_embedding, jd_keywords)
        results["projects"] = [
            {**{c.name: getattr(p, c.name) for c in p.__table__.columns if c.name != "embedding"}, "score": round(float(score), 3)}
            for score, p in scored
        ]

    # --- Experience ---
    experiences = db.query(KBExperience).filter(KBExperience.user_id == user_id).all()
    if experiences:
        def build_text(e):
            return f"{e.company} {e.role} {e.responsibilities or ''} {e.technologies or ''}"

        def embed_text(e):
            return (f"{e.role} {e.responsibilities or ''}", e.technologies or "")

        scored = score_items(experiences, build_text, embed_text, jd_text, jd_embedding, jd_keywords)
        results["experience"] = [
            {**{c.name: getattr(e, c.name) for c in e.__table__.columns if c.name != "embedding"}, "score": round(float(score), 3)}
            for score, e in scored[:2]
        ]

    # --- Certifications ---
    certifications = db.query(KBCertification).filter(KBCertification.user_id == user_id).all()
    if certifications:
        def build_text(c):
            return f"{c.name} {c.issuer or ''} {c.skills_covered or ''}"

        def embed_text(c):
            return (f"{c.name} {c.skills_covered or ''}", "")

        scored = score_items(certifications, build_text, embed_text, jd_text, jd_embedding, jd_keywords)
        min_certifications = min(2, len(certifications))
        selected = apply_min_selection(scored, 0.2, min_certifications)
        results["certifications"] = [
            {**{col.name: getattr(c, col.name) for col in c.__table__.columns if col.name != "embedding"}, "score": round(float(score), 3)}
            for score, c in selected
        ]

    # --- Achievements ---
    achievements = db.query(KBAchievement).filter(KBAchievement.user_id == user_id).all()
    if achievements:
        def build_text(a):
            return f"{a.title} {a.description or ''}"

        def embed_text(a):
            return (f"{a.title} {a.description or ''}", "")

        scored = score_items(achievements, build_text, embed_text, jd_text, jd_embedding, jd_keywords)
        min_achievements = min(1, len(achievements))
        selected = apply_min_selection(scored, 0.2, min_achievements)
        results["achievements"] = [
            {**{c.name: getattr(a, c.name) for c in a.__table__.columns if c.name != "embedding"}, "score": round(float(score), 3)}
            for score, a in selected
        ]

    # --- Skills (all included, JD-relevant ones first) ---
    skills = db.query(KBSkill).filter(KBSkill.user_id == user_id).all()
    jd_text_lower = jd_text.lower()
    jd_tokens = set(tokenize(jd_text))

    def skill_relevance(skill):
        name_lower = skill.name.lower()
        name_tokens = set(tokenize(skill.name))
        if name_lower in jd_text_lower:
            return 0
        if name_tokens & jd_tokens:
            return 1
        return 2

    skills_sorted = sorted(skills, key=skill_relevance)
    results["skills"] = [{"id": s.id, "category": s.category, "name": s.name} for s in skills_sorted]

    return results