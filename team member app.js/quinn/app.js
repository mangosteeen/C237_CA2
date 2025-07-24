const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('yourdb.db'); // Change this if your DB name is different

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse form data (optional for future forms)
app.use(express.urlencoded({ extended: true }));

// Set up sessions
app.use(session({
  secret: 'your-secret-key', // Change to your own secret
  resave: false,
  saveUninitialized: true
}));

// Admin access control middleware
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).send('Access denied. Admins only.');
  }
}

// Dummy login route for testing (simulate an admin)
app.get('/login', (req, res) => {
  req.session.user = {
    id: 1,
    role: 'admin'
  };
  res.send('Logged in as admin. Go to /viewAll');
});

// Route: Display all requests
app.get('/viewAll', isAdmin, (req, res) => {
  db.all("SELECT * FROM requests", [], (err, rows) => {
    if (err) {
      return res.send("Error loading requests.");
    }

    res.render('viewAll', {
      requests: rows,
      msg: req.session.msg || null
    });

    req.session.msg = null; // Clear the message after showing
  });
});

// Route: Delete request by ID
app.get('/requests/:id/delete', isAdmin, (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM requests WHERE id = ?", [id], (err) => {
    if (err) {
      req.session.msg = "Error deleting request.";
    } else {
      req.session.msg = "Request deleted successfully.";
    }

    res.redirect('/viewAll');
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
