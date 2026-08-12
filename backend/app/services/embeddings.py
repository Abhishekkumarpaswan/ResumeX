import requests
from typing import List
from app.config import HF_TOKEN

# Lazily load the local model only when needed
_local_model = None

def get_local_model():
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        _local_model = SentenceTransformer('all-MiniLM-L6-v2')
    return _local_model

def generate_embedding(text: str) -> List[float]:
    """Generate embedding for a single text string."""
    if HF_TOKEN:
        try:
            url = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
            headers = {"Authorization": f"Bearer {HF_TOKEN}"}
            response = requests.post(url, headers=headers, json={"inputs": text}, timeout=10.0)
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list):
                    if len(result) > 0 and isinstance(result[0], list):
                        return result[0]
                    return result
        except Exception as e:
            print(f"HF API Embedding failed: {str(e)}. Falling back to local model.")

    # Fallback to local model
    model = get_local_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()

def build_project_text(title: str, description: str, technologies: str = "", role: str = "", outcomes: str = "", domain: str = "") -> str:
    """Combine project fields into a single text for embedding."""
    parts = [f"Project: {title}"]
    if description:
        parts.append(f"Description: {description}")
    if technologies:
        parts.append(f"Technologies: {technologies}")
    if role:
        parts.append(f"Role: {role}")
    if outcomes:
        parts.append(f"Outcomes: {outcomes}")
    if domain:
        parts.append(f"Domain: {domain}")
    return " | ".join(parts)

def build_experience_text(company: str, role: str, responsibilities: str = "", technologies: str = "") -> str:
    """Combine experience fields into a single text for embedding."""
    parts = [f"Company: {company}", f"Role: {role}"]
    if responsibilities:
        parts.append(f"Responsibilities: {responsibilities}")
    if technologies:
        parts.append(f"Technologies: {technologies}")
    return " | ".join(parts)

def build_certification_text(name: str, issuer: str = "", skills_covered: str = "") -> str:
    """Combine certification fields into a single text for embedding."""
    parts = [f"Certification: {name}"]
    if issuer:
        parts.append(f"Issuer: {issuer}")
    if skills_covered:
        parts.append(f"Skills: {skills_covered}")
    return " | ".join(parts)

def build_achievement_text(title: str, description: str = "") -> str:
    """Combine achievement fields into a single text for embedding."""
    parts = [f"Achievement: {title}"]
    if description:
        parts.append(f"Description: {description}")
    return " | ".join(parts)