from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int

class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True
        # In Pydantic v1, this was `orm_mode = True`
        # In Pydantic v2, it is `from_attributes = True`
