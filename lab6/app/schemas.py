from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

# Base Book Schema
class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Назва книги")
    author: str = Field(..., min_length=1, max_length=255, description="Автор книги")
    year_published: Optional[int] = Field(None, ge=1000, le=2100, description="Рік видання")
    isbn: Optional[str] = Field(None, max_length=20, description="ISBN код")
    publisher: Optional[str] = Field(None, max_length=255, description="Видавництво")
    price: Optional[Decimal] = Field(None, ge=0, description="Ціна книги")

# Schema для створення книги
class BookCreate(BookBase):
    pass

# Schema для оновлення книги (всі поля опціональні)
class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    year_published: Optional[int] = Field(None, ge=1000, le=2100)
    isbn: Optional[str] = Field(None, max_length=20)
    publisher: Optional[str] = Field(None, max_length=255)
    price: Optional[Decimal] = Field(None, ge=0)

# Schema для відповіді (включає ID та timestamps)
class BookResponse(BookBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schema для списку книг
class BooksListResponse(BaseModel):
    success: bool = True
    count: int
    data: list[BookResponse]

# Schema для одиничної відповіді
class BookSingleResponse(BaseModel):
    success: bool = True
    message: str
    data: BookResponse

# Schema для повідомлень про помилки
class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    detail: Optional[str] = None