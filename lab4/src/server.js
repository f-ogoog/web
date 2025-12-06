require('dotenv').config();
const express = require('express');
const cors = require('cors');
const booksRoutes = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: '📚 Library CRUD API',
    version: '1.0.0',
    endpoints: {
      books: '/api/books'
    }
  });
});

app.use('/api/books', booksRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не знайдено'
  });
});

app.use((err, req, res, next) => {
  console.error('Серверна помилка:', err);
  res.status(500).json({
    success: false,
    message: 'Внутрішня помилка сервера'
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
  console.log(`API доступне за адресою: http://localhost:${PORT}/api/books`);
});