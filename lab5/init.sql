-- Створення таблиці books
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    year_published INTEGER,
    isbn VARCHAR(20) UNIQUE,
    publisher VARCHAR(255),
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка тестових даних
INSERT INTO books (title, author, year_published, isbn, publisher, price) VALUES
('Кобзар', 'Тарас Шевченко', 1840, '978-617-679-123-4', 'Наш Формат', 150.00),
('Тіні забутих предків', 'Михайло Коцюбинський', 1911, '978-966-03-456-7', 'А-БА-БА-ГА-ЛА-МА-ГА', 180.50),
('Чорна рада', 'Пантелеймон Куліш', 1857, '978-617-585-234-1', 'Фоліо', 200.00),
('Лісова пісня', 'Леся Українка', 1912, '978-966-441-678-9', 'Школа', 120.00);

-- Створення індексів
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_title ON books(title);