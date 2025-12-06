const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'schema.graphql');
const schemaString = fs.readFileSync(schemaPath, 'utf8');

const schema = buildSchema(schemaString);
module.exports = schema;