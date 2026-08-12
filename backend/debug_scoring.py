"""
Debug script to see exact score breakdown (vector vs bm25 vs boost)
for each project against a JD. Run from backend/ folder:

    python3 debug_scoring.py <user_id>

Paste your actual JD into JD_TEXT below first.
"""
import sys
sys.path.insert(0, ".")

from app.database import SessionLocal
from app.models.knowledge_base import KBProject
from app.services.embeddings import generate_embedding
from app.services.retrieval import (
    tokenize, cosine_similarity, extract_jd_keywords,
    rule_based_boost, calibrated_similarity, normalize_bm25,
    extract_technology_tokens
)
from rank_bm25 import BM25Okapi

JD_TEXT = """Design, develop, and deploy machine learning and artificial intelligence solutions to solve real-world business problems. Build data pipelines, preprocess large datasets, train and optimize ML models, and deploy them into production environments. Collaborate with data scientists and software engineers to integrate AI capabilities into applications using Python, TensorFlow, PyTorch, Scikit-learn, and cloud platforms."""

def main():
    user_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    db = SessionLocal()

    projects = db.query(KBProject).filter(KBProject.user_id == user_id).all()
    if not projects:
        print("No projects found for this user_id.")
        return

    jd_embedding = generate_embedding(JD_TEXT)
    jd_keywords = extract_jd_keywords(JD_TEXT)

    project_texts = []
    for p in projects:
        text = f"{p.title} {p.description or ''} {p.technologies or ''} {p.role or ''} {p.outcomes or ''} {p.domain or ''}"
        project_texts.append(tokenize(text))

    bm25 = BM25Okapi(project_texts)
    bm25_scores = bm25.get_scores(tokenize(JD_TEXT))

    # Dynamic Weighting based on items count
    if len(projects) < 4:
        w_vector, w_bm25, w_boost = 0.65, 0.10, 0.25
    else:
        w_vector, w_bm25, w_boost = 0.55, 0.20, 0.25

    print(f"\n{'='*100}")
    print(f"JD keywords extracted: {sorted(jd_keywords)}")
    print(f"Dynamic weights configured: vector={w_vector}, bm25={w_bm25}, boost={w_boost}")
    print(f"{'='*100}\n")

    rows = []
    for i, p in enumerate(projects):
        if p.embedding is None:
            print(f"[{p.title}] -- NO EMBEDDING STORED, skipping")
            continue

        vector_score = calibrated_similarity(jd_embedding, list(p.embedding))
        bm25_raw = bm25_scores[i]
        bm25_score = normalize_bm25(bm25_raw)
        item_text = f"{p.title} {p.description or ''} {p.outcomes or ''}"
        boost = rule_based_boost(item_text, jd_keywords, p.technologies or "")
        final_score = (w_vector * vector_score) + (w_bm25 * bm25_score) + (w_boost * boost)

        embed_text = f"{p.title} {p.description or ''} {p.technologies or ''} {p.role or ''} {p.outcomes or ''} {p.domain or ''}"
        tech_tokens = extract_technology_tokens(p.technologies or "")
        item_tokens = set(tokenize(item_text))
        tech_overlap = tech_tokens & jd_keywords
        item_overlap = item_tokens & jd_keywords

        rows.append((final_score, p.title, vector_score, bm25_raw, bm25_score, boost, embed_text, tech_overlap, item_overlap, w_vector, w_bm25, w_boost))

    rows.sort(key=lambda x: x[0], reverse=True)

    for final_score, title, vector_score, bm25_raw, bm25_score, boost, embed_text, tech_overlap, item_overlap, wv, wbm, wbo in rows:
        print(f"PROJECT: {title}")
        print(f"  FINAL SCORE     = {final_score:.4f}")
        print(f"  vector_score    = {vector_score:.4f}  (contributes {wv*vector_score:.4f})")
        print(f"  bm25_raw        = {bm25_raw:.4f}")
        print(f"  bm25_normalized = {bm25_score:.4f}  (contributes {wbm*bm25_score:.4f})")
        print(f"  rule_boost      = {boost:.4f}  (contributes {wbo*boost:.4f})")
        print(f"  tech overlap w/ JD keywords  : {tech_overlap}")
        print(f"  text overlap w/ JD keywords  : {item_overlap}")
        print(f"  embedded text   : {embed_text[:150]}")
        print("-" * 100)

    db.close()

if __name__ == "__main__":
    main()