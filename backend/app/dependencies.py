from fastapi import HTTPException, Request
from jose import jwt, JWTError

from app.config import SECRET_KEY, ALGORITHM

def get_current_user_id(request: Request) -> int:
    final_token = None
    
    # 1. Try Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        final_token = auth_header.split(" ")[1]
        
    # 2. Try access_token cookie
    if not final_token:
        final_token = request.cookies.get("access_token")
        
    # 3. Try query parameter (fallback)
    if not final_token:
        final_token = request.query_params.get("token")
            
    if not final_token:
        raise HTTPException(status_code=401, detail="Missing authentication token")

    try:
        payload = jwt.decode(final_token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        return int(sub)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token payload")