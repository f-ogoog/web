from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import os

from app import models, schemas, crud
from app.database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="📚 Library API",
    description="REST API для управління бібліотекою книг",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "📚 Library REST API",
        "version": "1.0.0",
        "endpoints": {
            "books": "/api/books",
            "documentation": "/docs",
            "redoc": "/redoc"
        }
    }

@app.post(
    "/api/books",
    response_model=schemas.BookSingleResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Books"]
)
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    if book.isbn:
        existing_book = crud.get_book_by_isbn(db, book.isbn)
        if existing_book:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Книга з таким ISBN вже існує"
            )
    
    db_book = crud.create_book(db, book)
    return {
        "success": True,
        "message": "Книгу успішно створено",
        "data": db_book
    }

@app.get(
    "/api/books",
    response_model=schemas.BooksListResponse,
    tags=["Books"]
)
def get_books(
    skip: int = Query(0, ge=0, description="Пропустити N записів"),
    limit: int = Query(100, ge=1, le=1000, description="Максимум записів"),
    search: Optional[str] = Query(None, description="Пошук за назвою, автором або видавництвом"),
    db: Session = Depends(get_db)
):
    if search:
        books = crud.search_books(db, search)
    else:
        books = crud.get_books(db, skip=skip, limit=limit)
    
    return {
        "success": True,
        "count": len(books),
        "data": books
    }

@app.get(
    "/api/books/{book_id}",
    response_model=schemas.BookSingleResponse,
    tags=["Books"]
)
def get_book(book_id: int, db: Session = Depends(get_db)):
    db_book = crud.get_book(db, book_id)
    if not db_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книгу не знайдено"
        )
    
    return {
        "success": True,
        "message": "Книгу знайдено",
        "data": db_book
    }

@app.get(
    "/api/books/author/{author}",
    response_model=schemas.BooksListResponse,
    tags=["Books"]
)
def get_books_by_author(author: str, db: Session = Depends(get_db)):
    books = crud.get_books_by_author(db, author)
    return {
        "success": True,
        "count": len(books),
        "data": books
    }

@app.get(
    "/api/books/publisher/{publisher}",
    response_model=schemas.BooksListResponse,
    tags=["Books"]
)
def get_books_by_publisher(publisher: str, db: Session = Depends(get_db)):
    books = crud.get_books_by_publisher(db, publisher)
    return {
        "success": True,
        "count": len(books),
        "data": books
    }

@app.get(
    "/api/books/year/{year}",
    response_model=schemas.BooksListResponse,
    tags=["Books"]
)
def get_books_by_year(year: int, db: Session = Depends(get_db)):
    books = crud.get_books_by_year(db, year)
    return {
        "success": True,
        "count": len(books),
        "data": books
    }

@app.put(
    "/api/books/{book_id}",
    response_model=schemas.BookSingleResponse,
    tags=["Books"]
)
def update_book(
    book_id: int,
    book_update: schemas.BookUpdate,
    db: Session = Depends(get_db)
):
    db_book = crud.update_book(db, book_id, book_update)
    if not db_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книгу не знайдено"
        )
    
    return {
        "success": True,
        "message": "Книгу успішно оновлено",
        "data": db_book
    }

@app.delete(
    "/api/books/{book_id}",
    response_model=schemas.BookSingleResponse,
    tags=["Books"]
)
def delete_book(book_id: int, db: Session = Depends(get_db)):
    db_book = crud.delete_book(db, book_id)
    if not db_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книгу не знайдено"
        )
    
    return {
        "success": True,
        "message": "Книгу успішно видалено",
        "data": db_book
    }

@app.get("/api/stats", tags=["Statistics"])
def get_statistics(db: Session = Depends(get_db)):
    total_books = crud.get_books_count(db)
    return {
        "success": True,
        "data": {
            "total_books": total_books
        }
    }