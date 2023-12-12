require('dotenv').config();
const express = require('express');
const port = process.env.PORT || 5000;
const router = require('./routes/jobRoutes');
const userRouter = require('./routes/userRoutes');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');

connectDB();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Cookie parser
app.use(cookieParser());

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

// Handle any other requests by serving the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

// API status
app.route('/').get((req, res) => {
  res.send('Server is running');
});

// API routes
app.use('/api/jobs', router);
app.use('/api/users', userRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(port, (req, res) => {
  console.log(`Server is running on port: ${port}`);
});
