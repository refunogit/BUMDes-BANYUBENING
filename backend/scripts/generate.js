const path = require('path');
const { execSync } = require('child_process');

const enginesDir = path.resolve(__dirname, '../prisma/engines');
const schemaEnginePath = path.join(enginesDir, 'schema-engine');
const queryEnginePath = path.join(enginesDir, 'libquery_engine.so.node');

process.env.PRISMA_SCHEMA_ENGINE_BINARY = schemaEnginePath;
process.env.PRISMA_QUERY_ENGINE_LIBRARY = queryEnginePath;
process.env.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = '1';

console.log('Running offline-safe Prisma generate...');
execSync('npx prisma generate', {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: process.env,
});
