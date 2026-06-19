from pydantic import BaseModel, EmailStr


class EmailEvent(BaseModel):
    email: EmailStr
    token: str
    action: str
