const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

// Routes
const userRoutes = require('./backend/routes/userRoutes');
const parkRoutes = require('./backend/routes/parkRoutes');
const feedbackRoutes = require('./backend/routes/feedbackRoutes');
// Add more routes as needed

app.use('/api/users', userRoutes);
app.use('/api/parks', parkRoutes);
app.use('/api/feedback', feedbackRoutes);
// Add more route paths as needed

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});