from pydantic import BaseModel, EmailStr


# --- Auth ---

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


# --- Portfolio ---

class OTPRequest(BaseModel):
    pan: str
    bo_id: str
    dob: str  # YYYY-MM-DD


class OTPVerify(BaseModel):
    session_id: str
    otp: str
    num_periods: int = 6


class PortfolioSummary(BaseModel):
    id: int
    pan: str
    investor_name: str
    total_value: float
    fetched_at: str

    class Config:
        from_attributes = True
