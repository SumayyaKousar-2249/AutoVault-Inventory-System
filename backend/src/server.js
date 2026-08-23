'use strict';

require('dotenv').config();
const app = require('./app');
const { initialize } = require('./config/database');

const PORT = process.env.PORT || 5000;

// Ensure DB schema is ready before accepting requests
initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  });
