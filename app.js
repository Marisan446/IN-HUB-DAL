const express = require('express');
const locationRoutes = require('./src/routes/location.routes');
const productstatusRoutes = require('./src/routes/productstatus.routes');
const requeststatusRoutes = require('./src/routes/requeststatus.routes');
const producttypeRoutes = require('./src/routes/producttype.routes');
const userroleRoutes = require('./src/routes/userrole.routes');

const app = express();

// Middleware
app.use(express.json());

app.use('/api/location', locationRoutes);
app.use('/api/productstatus', productstatusRoutes);
app.use('/api/requeststatus', requeststatusRoutes);
app.use('/api/producttype', producttypeRoutes);
app.use('/api/userrole', userroleRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;