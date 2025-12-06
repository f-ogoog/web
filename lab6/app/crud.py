from sqlalchemy.orm import Session
from sqlalchemy import or_
from app import models, schemas
from typing import Optional

def create_book(db: Session, book: schemas.BookCreate):
    db_book = models.Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

def get_books(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Book).offset(skip).limit(limit).all()

def get_book(db: Session, book_id: int):
    return db.query(models.Book).filter(models.Book.id == book_id).first()

def get_books_by_author(db: Session, author: str):
    return db.query(models.Book).filter(
        models.Book.author.ilike(f"%{author}%")
    ).all()

def get_books_by_publisher(db: Session, publisher: str):
    return db.query(models.Book).filter(
        models.Book.publisher.ilike(f"%{publisher}%")
    ).all()

def get_books_by_year(db: Session, year: int):
    return db.query(models.Book).filter(
        models.Book.year_published == year
    ).all()

def get_book_by_isbn(db: Session, isbn: str):
    return db.query(models.Book).filter(models.Book.isbn == isbn).first()

def search_books(db: Session, query: str):
    return db.query(models.Book).filter(
        or_(
            models.Book.title.ilike(f"%{query}%"),
            models.Book.author.ilike(f"%{query}%"),
            models.Book.publisher.ilike(f"%{query}%")
        )
    ).all()

def update_book(db: Session, book_id: int, book_update: schemas.BookUpdate):
    db_book = get_book(db, book_id)
    if not db_book:
        return None
    
    update_data = book_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_book, field, value)
    
    db.commit()
    db.refresh(db_book)
    return db_book

def delete_book(db: Session, book_id: int):
    db_book = get_book(db, book_id)
    if not db_book:
        return None
    
    db.delete(db_book)
    db.commit()
    return db_book

def get_books_count(db: Session):
    return db.query(models.Book).count()