import uuid
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field

class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    category_id: uuid.UUID
    external_id: str = Field(..., max_length=255)
    description: str
    specification: Optional[dict[str, Any]] = Field(default_factory=dict)
    image_url: Optional[str] = Field(None, max_length=1024)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    category_id: Optional[uuid.UUID] = None
    external_id: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    specification: Optional[dict[str, Any]] = None
    image_url: Optional[str] = Field(None, max_length=1024)

class ProductResponse(ProductBase):
    id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)
