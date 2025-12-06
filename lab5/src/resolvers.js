const pool = require('../config/database');

const resolvers = {
  books: async () => {
    try {
      const result = await pool.query(
        'SELECT * FROM books ORDER BY id ASC'
      );
      
      return {
        success: true,
        count: result.rows.length,
        books: result.rows
      };
    } catch (error) {
      console.error('Помилка отримання книг:', error);
      throw new Error('Не вдалося отримати книги');
    }
  },

  book: async ({ id }) => {
    try {
      const result = await pool.query(
        'SELECT * FROM books WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Помилка отримання книги:', error);
      throw new Error('Не вдалося отримати книгу');
    }
  },

  booksByAuthor: async ({ author }) => {
    try {
      const result = await pool.query(
        'SELECT * FROM books WHERE author ILIKE $1 ORDER BY id ASC',
        [`%${author}%`]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Помилка пошуку за автором:', error);
      throw new Error('Не вдалося знайти книги за автором');
    }
  },

  booksByPublisher: async ({ publisher }) => {
    try {
      const result = await pool.query(
        'SELECT * FROM books WHERE publisher ILIKE $1 ORDER BY id ASC',
        [`%${publisher}%`]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Помилка пошуку за видавництвом:', error);
      throw new Error('Не вдалося знайти книги за видавництвом');
    }
  },

  booksByYear: async ({ year }) => {
    try {
      const result = await pool.query(
        'SELECT * FROM books WHERE year_published = $1 ORDER BY id ASC',
        [year]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Помилка пошуку за роком:', error);
      throw new Error('Не вдалося знайти книги за роком');
    }
  },


  createBook: async ({ input }) => {
    try {
      const { title, author, year_published, isbn, publisher, price } = input;

      if (!title || !author) {
        return {
          success: false,
          message: 'Назва та автор є обов\'язковими полями',
          book: null
        };
      }

      const result = await pool.query(
        `INSERT INTO books (title, author, year_published, isbn, publisher, price) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [title, author, year_published, isbn, publisher, price]
      );

      return {
        success: true,
        message: 'Книгу успішно створено',
        book: result.rows[0]
      };
    } catch (error) {
      console.error('Помилка створення книги:', error);
      
      if (error.code === '23505') {
        return {
          success: false,
          message: 'Книга з таким ISBN вже існує',
          book: null
        };
      }

      return {
        success: false,
        message: 'Не вдалося створити книгу',
        book: null
      };
    }
  },

  updateBook: async ({ id, input }) => {
    try {
      const { title, author, year_published, isbn, publisher, price } = input;

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
        return {
          success: false,
          message: 'Книгу не знайдено',
          book: null
        };
      }

      return {
        success: true,
        message: 'Книгу успішно оновлено',
        book: result.rows[0]
      };
    } catch (error) {
      console.error('Помилка оновлення книги:', error);
      
      return {
        success: false,
        message: 'Не вдалося оновити книгу',
        book: null
      };
    }
  },

  deleteBook: async ({ id }) => {
    try {
      const result = await pool.query(
        'DELETE FROM books WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Книгу не знайдено',
          book: null
        };
      }

      return {
        success: true,
        message: 'Книгу успішно видалено',
        book: result.rows[0]
      };
    } catch (error) {
      console.error('Помилка видалення книги:', error);
      
      return {
        success: false,
        message: 'Не вдалося видалити книгу',
        book: null
      };
    }
  }
};

module.exports = resolvers;