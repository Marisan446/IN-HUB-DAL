const express = require('express');
const locationRoutes = require('./routes/location.routes');

const app = express();

// Middleware
app.use(express.json());

app.use('/api/locations', locationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;