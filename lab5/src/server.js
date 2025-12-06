require('dotenv').config();
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const cors = require('cors');
const schema = require('./schema');
const resolvers = require('./resolvers');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: '📚 Library GraphQL API',
    version: '1.0.0',
    endpoints: {
      graphql: '/graphql',
      playground: '/graphql (відкрийте в браузері для GraphQL Playground)'
    },
    documentation: {
      queries: [
        'books',
        'book(id: ID!)',
        'booksByAuthor(author: String!)',
        'booksByPublisher(publisher: String!)',
        'booksByYear(year: Int!)'
      ],
      mutations: [
        'createBook(input: CreateBookInput!)',
        'updateBook(id: ID!, input: UpdateBookInput!)',
        'deleteBook(id: ID!)'
      ]
    }
  });
});

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: resolvers,
  graphiql: true,
  customFormatErrorFn: (error) => ({
    message: error.message,
    locations: error.locations,
    path: error.path,
  })
}));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не знайдено. Використовуйте /graphql для GraphQL API'
  });
});

app.use((err, req, res, next) => {
  console.error('Серверна помилка:', err);
  res.status(500).json({
    success: false,
    message: 'Внутрішня помилка сервера'
  });
});

app.listen(PORT);
console.log(`Server is running on port ${PORT}`);