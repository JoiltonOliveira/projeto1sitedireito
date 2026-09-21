const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const logPath = path.join(root, 'db_validation.log');
const psql = 'C:/Program Files/PostgreSQL/18/bin/psql.exe';
const connectionArgs = ['-U', 'postgres', '-h', 'localhost', '-d', 'postgres', '-P', 'pager=off', '-v', 'ON_ERROR_STOP=1'];
const env = { ...process.env, PGPASSWORD: 'joiltondev' };

function run(args, label) {
  const result = spawnSync(psql, args, { env, encoding: 'utf8' });
  const out = [
    `--- ${label} ---`,
    `exitCode=${result.status}`,
    `stdout:\n${result.stdout || ''}`,
    `stderr:\n${result.stderr || ''}`,
    ''
  ].join('\n');
  fs.appendFileSync(logPath, out, 'utf8');
  return result;
}

function ensureDb() {
  const dbName = 'atendimento_digital';
  const exists = run(['-U', 'postgres', '-h', 'localhost', '-d', 'postgres', '-Atqc', `SELECT 1 FROM pg_database WHERE datname = '${dbName}';`], 'check_db_exists');
  if ((exists.stdout || '').trim() !== '1') {
    run(['-U', 'postgres', '-h', 'localhost', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', `CREATE DATABASE "${dbName}";`], 'create_db');
  }
  return dbName;
}

fs.writeFileSync(logPath, 'DB VALIDATION START\n', 'utf8');
run(['--version'], 'psql_version');
run(['-U', 'postgres', '-h', 'localhost', '-d', 'postgres', '-P', 'pager=off', '-Atqc', 'SELECT current_user, current_database(), version();'], 'login_probe');
const dbName = ensureDb();
run(['-U', 'postgres', '-h', 'localhost', '-d', dbName, '-P', 'pager=off', '-v', 'ON_ERROR_STOP=1', '-f', path.join(root, 'database', 'schema.sql')], 'apply_schema');
run(['-U', 'postgres', '-h', 'localhost', '-d', dbName, '-P', 'pager=off', '-Atqc', "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"], 'list_tables');
fs.appendFileSync(logPath, 'DB VALIDATION END\n', 'utf8');

console.log('DB validation log written to ' + logPath);
