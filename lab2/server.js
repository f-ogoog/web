const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const initDatabaseAndGetClient = require('./db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;

let pool;

async function startServer() {
  try {
    pool = await initDatabaseAndGetClient();

    const app = express();
    app.use(express.json());

    app.post('/users/register', async (req, res) => {
      try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
          return res.status(400).json({ 
            error: 'Всі поля обов\'язкові' 
          });
        }

        const existingUser = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        if (existingUser.rows.length > 0) {
          return res.status(400).json({ 
            error: 'Користувач з таким email вже існує' 
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
          'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
          [username, email, hashedPassword, role || 'user']
        );

        const newUser = result.rows[0];

        res.status(201).json({ 
          message: 'Користувач успішно зареєстрований',
          user: newUser
        });

      } catch (error) {
        console.error('Помилка реєстрації:', error);
        res.status(500).json({ error: 'Помилка сервера' });
      }
    });

    app.post('/users/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ 
            error: 'Email та пароль обов\'язкові' 
          });
        }

        const result = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({ 
            error: 'Невірний email або пароль' 
          });
        }

        const user = result.rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ 
            error: 'Невірний email або пароль' 
          });
        }

        const authToken = jwt.sign(
          { 
            id: user.id, 
            email: user.email,
            role: user.role 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({ 
          message: 'Вхід успішний',
          authToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });

      } catch (error) {
        console.error('Помилка входу:', error);
        res.status(500).json({ error: 'Помилка сервера' });
      }
    });

    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          error: 'Токен не надано' 
        });
      }

      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ 
            error: 'Невалідний або прострочений токен' 
          });
        }
        
        req.user = user;
        next();
      });
    };

    const requireAdmin = (req, res, next) => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Доступ заборонено. Потрібна роль admin' 
        });
      }
      next();
    };

    app.get('/users/profile', authenticateToken, async (req, res) => {
      try {
        const result = await pool.query(
          'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
          [req.user.id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Користувач не знайдений' });
        }

        res.json(result.rows[0]);
      } catch (error) {
        console.error('Помилка отримання профілю:', error);
        res.status(500).json({ error: 'Помилка сервера' });
      }
    });

    app.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
      try {
        const result = await pool.query(
          'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({ 
          message: 'Список всіх користувачів',
          users: result.rows 
        });
      } catch (error) {
        console.error('Помилка отримання користувачів:', error);
        res.status(500).json({ error: 'Помилка сервера' });
      }
    });

    app.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
      try {
        const userId = parseInt(req.params.id);

        const result = await pool.query(
          'DELETE FROM users WHERE id = $1 RETURNING id',
          [userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Користувач не знайдений' });
        }

        res.json({ message: 'Користувач видалений' });
      } catch (error) {
        console.error('Помилка видалення користувача:', error);
        res.status(500).json({ error: 'Помилка сервера' });
      }
    });

    app.listen(PORT, () => {
      console.log(`Сервер запущено на порту ${PORT}`);
    });
  } catch (error) {
    console.error('Помилка запуску сервера:', error);
    process.exit(1);
  }
}

startServer();