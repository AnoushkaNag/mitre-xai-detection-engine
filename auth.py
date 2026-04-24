"""
RBAC (Role-Based Access Control) Authentication Module
Provides authentication, token generation, and permission checking
"""

import jwt
import os
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from pydantic import BaseModel

# Secret key for JWT tokens (in production, use environment variable)
SECRET_KEY = os.getenv("SECRET_KEY", "threat-detection-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60  # 24 hours

# Define user roles and their permissions
ROLE_PERMISSIONS = {
    "admin": ["read", "write", "analyze", "manage_users", "view_logs"],
    "analyst": ["read", "write", "analyze", "view_logs"],
    "viewer": ["read"],
}

# Predefined users (in production, use a database)
USERS_DB = {
    "admin": {"password": "admin123", "role": "admin", "name": "Admin User"},
    "analyst": {"password": "analyst123", "role": "analyst", "name": "Security Analyst"},
    "viewer": {"password": "viewer123", "role": "viewer", "name": "Viewer User"},
}


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_role: str
    expires_in: int


class TokenData(BaseModel):
    username: str
    role: str
    exp: int


class CurrentUser(BaseModel):
    username: str
    role: str
    permissions: list


# ============================================================================
# TOKEN MANAGEMENT
# ============================================================================

def create_access_token(username: str, role: str) -> str:
    """Create JWT access token"""
    expires = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "username": username,
        "role": role,
        "exp": expires,
        "iat": datetime.utcnow()
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token


def verify_token(token: str) -> Optional[TokenData]:
    """Verify JWT token and return token data"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("username")
        role = payload.get("role")
        exp = payload.get("exp")
        
        if username is None or role is None:
            return None
        
        return TokenData(username=username, role=role, exp=exp)
    except jwt.ExpiredSignatureError:
        print("⚠️  [auth] Token expired")
        return None
    except jwt.InvalidTokenError:
        print("⚠️  [auth] Invalid token")
        return None


# ============================================================================
# AUTHENTICATION FUNCTIONS
# ============================================================================

def authenticate_user(username: str, password: str) -> Optional[Dict]:
    """Authenticate user with username and password"""
    if username not in USERS_DB:
        print(f"❌ [auth] User not found: {username}")
        return None
    
    user = USERS_DB[username]
    if user["password"] != password:
        print(f"❌ [auth] Invalid password for user: {username}")
        return None
    
    print(f"✅ [auth] User authenticated: {username} (role: {user['role']})")
    return {
        "username": username,
        "role": user["role"],
        "name": user["name"]
    }


def get_current_user(token: str) -> CurrentUser:
    """Dependency to get current user from token"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token"
        )
    
    token_data = verify_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    permissions = ROLE_PERMISSIONS.get(token_data.role, [])
    print(f"🔐 [auth] User {token_data.username} ({token_data.role}) accessing resource")
    
    return CurrentUser(
        username=token_data.username,
        role=token_data.role,
        permissions=permissions
    )


def require_permission(permission: str):
    """Dependency to require specific permission"""
    def permission_checker(current_user: CurrentUser = Depends(lambda: get_current_user(""))):
        if permission not in current_user.permissions:
            print(f"❌ [auth] Permission denied for {current_user.username}: {permission}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {permission}"
            )
        return current_user
    return permission_checker


# ============================================================================
# AUTHORIZATION DECORATORS
# ============================================================================

def require_role(*allowed_roles):
    """Decorator to require specific roles"""
    def role_checker(current_user: CurrentUser):
        if current_user.role not in allowed_roles:
            print(f"❌ [auth] Role denied for {current_user.username}: {current_user.role}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This operation requires one of: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
