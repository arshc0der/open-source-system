import mysql from 'mysql2';
// Create a pool instead of a single connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'my_database',
  waitForConnections: true,
  connectionLimit: 10, // Max simultaneous connections allowed
  queueLimit: 0
});

// Querying using a pool directly handles opening/closing connections automatically
pool.query('SELECT * FROM users', (err, results, fields) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(results); // Array of user rows
});
