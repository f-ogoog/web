const pool = require('../config/database');

const getAllBooks = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM books ORDER BY id ASC'
    );
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Помилка отримання книг:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при отриманні книг'
    });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM books WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Книгу не знайдено'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Помилка отримання книги:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при отриманні книги'
    });
  }
};

const createBook = async (req, res) => {
  try {
    const { title, author, year_published, isbn, publisher, price } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: 'Назва та автор є обов\'язковими полями'
      });
    }

    const result = await pool.query(
      `INSERT INTO books (title, author, year_published, isbn, publisher, price) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [title, author, year_published, isbn, publisher, price]
    );

    res.status(201).json({
      success: true,
      message: 'Книгу успішно додано',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Помилка створення книги:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Книга з таким ISBN вже існує'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Помилка сервера при створенні книги'
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, year_published, isbn, publisher, price } = req.body;

    const result = await pool.query(
      `UPDATE books 
       SET title = COALESCE($1, title),
           author = COALESCE($2, author),
           year_published = COALESCE($3, year_published),
           isbn = COALESCE($4, isbn),
           publisher = COALESCE($5, publisher),
           price = COALESCE($6, price),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [title, author, year_published, isbn, publisher, price, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Книгу не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Книгу успішно оновлено',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Помилка оновлення книги:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при оновленні книги'
    });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM books WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Книгу не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Книгу успішно видалено',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Помилка видалення книги:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при видаленні книги'
    });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};