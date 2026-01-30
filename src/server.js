// Import the app module 
const app = require('./app');

// Define the port the server will listen on
const PORT = 6046;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
