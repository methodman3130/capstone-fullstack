require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

/**
 * Why app.js and server.js are separate:
 * app.js builds the Express application; server.js owns the environment,
 * the database connection, and the port. That split lets tests import the
 * app without opening a real port, and it keeps each file doing one job.
 */

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Try: http://localhost:${PORT}/api/products`);
  });

  // Shut down cleanly instead of leaving a zombie process on the port.
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err.message);
    server.close(() => process.exit(1));
  });
}

start();
