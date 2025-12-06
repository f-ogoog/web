# Library REST API (FastAPI)

REST API для управління бібліотекою книг з використанням FastAPI, SQLAlchemy та PostgreSQL.

## Вимоги

- Python 3.9 або вище
- Docker та Docker Compose
- pip (менеджер пакетів Python)

## Встановлення та запуск

### 1. Створіть віртуальне середовище (рекомендовано)

```bash
python3 -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
```

### 2. Встановіть залежності

```bash
pip install -r requirements.txt
```

### 3. Запустіть PostgreSQL через Docker Compose

```bash
docker-compose up -d
```

Це запустить PostgreSQL контейнер на порту `5433` з базою даних `library_py`.

### 4. Налаштуйте змінні оточення

Створіть файл `.env` в корені проекту:

```bash
cp .env.example .env
```

Або створіть `.env` вручну:

```env
DATABASE_URL=postgresql://admin:admin123@localhost:5433/library_py
```

### 5. Запустіть сервер

**Режим розробки (з автоматичним перезапуском):**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Або звичайний режим:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Сервер буде доступний на `http://localhost:8000`

## Використання

### API Документація

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Root endpoint**: `http://localhost:8000/`

### Доступні endpoints

#### Books

- `GET /api/books` - отримати всі книги (з підтримкою пагінації та пошуку)
  - Query параметри:
    - `skip` (int, default: 0) - пропустити N записів
    - `limit` (int, default: 100, max: 1000) - максимум записів
    - `search` (string, optional) - пошук за назвою, автором або видавництвом

- `GET /api/books/{book_id}` - отримати книгу за ID

- `POST /api/books` - створити нову книгу
  - Body: JSON з полями `title`, `author`, `year_published`, `isbn`, `publisher`, `price`

- `PUT /api/books/{book_id}` - оновити книгу
  - Body: JSON з опціональними полями для оновлення

- `DELETE /api/books/{book_id}` - видалити книгу

#### Пошук

- `GET /api/books/author/{author}` - пошук книг за автором
- `GET /api/books/publisher/{publisher}` - пошук книг за видавництвом
- `GET /api/books/year/{year}` - пошук книг за роком видання

#### Статистика

- `GET /api/stats` - отримати статистику (загальна кількість книг)

## Приклади використання

### Створити книгу

```bash
curl -X POST "http://localhost:8000/api/books" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Кобзар",
    "author": "Тарас Шевченко",
    "year_published": 1840,
    "isbn": "978-617-679-123-4",
    "publisher": "Наш Формат",
    "price": 150.00
  }'
```

### Отримати всі книги

```bash
curl "http://localhost:8000/api/books"
```

### Пошук книг

```bash
curl "http://localhost:8000/api/books?search=Шевченко"
```

### Оновити книгу

```bash
curl -X PUT "http://localhost:8000/api/books/1" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 200.00
  }'
```

## Структура проекту

```
lab6/
├── app/
│   ├── __init__.py
│   ├── models.py      # SQLAlchemy моделі
│   ├── schemas.py     # Pydantic схеми
│   ├── crud.py        # CRUD операції
│   └── database.py    # Налаштування бази даних
├── main.py            # Головний файл FastAPI
├── requirements.txt   # Python залежності
├── docker-compose.yaml # Docker Compose конфігурація
└── .env               # Змінні оточення (створіть самостійно)
```

## Зупинка

Для зупинки PostgreSQL контейнера:

```bash
docker-compose down
```

Для зупинки з видаленням даних:

```bash
docker-compose down -v
```

## Примітки

- База даних створюється автоматично при першому запуску через SQLAlchemy
- Таблиця `books` створюється автоматично згідно з моделлю
- Для додавання тестових даних використовуйте POST запити або SQL скрипти

