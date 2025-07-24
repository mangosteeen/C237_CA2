const express = require('express');
const mysql = require('mysql2');

//******** TODO: Insert code to import 'express-session' *********//
const session = require('express-session');

const flash = require('connect-flash');

const app = express();

// Database connection
const db = mysql.createConnection({
    host: 'q7-dbf.h.filess.io',
    port: 3307,
    user: 'CA2database_forgotten',        
    password: '69a15e57e33ad4c69c9574abfc7d967431ee99ae',       
    database: 'CA2database_forgotten'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    // Session expires after 1 week of inactivity
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}
}));

app.use(flash());

// Setting up EJS
app.set('view engine', 'ejs');

// --------------Joanne - Add New request----------------------------------------------------------------------

app.get('/addNewRequest', checkAuthenticated, checkAdmin, (req, res) => {
    res.render('addRequest', {user: req.session.user } ); 
});

app.post('/addNewRequest', (req, res) => {
    // Extract request data from the request body
    const { name, taskType, description, urgency, requestStatus } = req.body;
   
    const sql = 'INSERT INTO requests (elderName, taskType, description, urgency, requestStatus) VALUES (?, ?, ?, ?, ?)';
    // Insert the new request into the database
    connection.query(sql , [name, taskType, description, urgency, requestStatus], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error adding request:", error);
            res.status(500).send('Error adding request');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

// --------------------Chia En - Edit/Update request------------------------------------------------------

// Load the edit request form
app.get('/requests/:id/edit', checkAuthenticated, (req, res) => {
    const requestId = req.params.id;
    const sql = 'SELECT * FROM requests WHERE id = ?';

    connection.query(sql, [requestId], (error, results) => {
        if (error) throw error;

        if (results.length > 0) {
            res.render('editRequest', { request: results[0], user: req.session.user }); // Render edit form
        } else {
            res.status(404).send('Request not found');
        }
    });
});

// Submit the edited request
app.post('/requests/:id/update', checkAuthenticated, (req, res) => {
    const requestId = req.params.id;
    const { elder_name, task_type, description, urgency } = req.body;

    const sql = 'UPDATE requests SET elder_name = ?, task_type = ?, description = ?, urgency = ? WHERE id = ?';

    connection.query(sql, [elder_name, task_type, description, urgency, requestId], (error, results) => {
        if (error) {
            console.error("Error updating request:", error);
            res.status(500).send('Error updating request');
        } else {
            res.redirect('/my-requests'); // Redirect to user’s list
        }
    });
});

// ----------------------Quinn - Delete request------------------------------------------------------------

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

// -------------------------Hui Zhi - Filter/Search-----------------------------------------------------------

// Static data for testing (no database)
const tasks = [
  { id: 1, title: 'Doctor Appointment', urgency: 'High', type: 'Appointment' },
  { id: 2, title: 'Take Medication', urgency: 'Medium', type: 'Medication' },
  { id: 3, title: 'Morning Exercise', urgency: 'Low', type: 'Exercise' },
  { id: 4, title: 'Meeting with Caregiver', urgency: 'High', type: 'Appointment' },
  { id: 5, title: 'Walk in the Park', urgency: 'Low', type: 'Exercise' },
  { id: 6, title: 'Follow-up Doctor Appointment', urgency: 'Medium', type: 'Appointment' }
];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Capture GET requests and apply filtering
app.get('/', (req, res) => {
  const { title, urgency, type } = req.query;

  let filteredTasks = tasks;

  // Apply title filter (case-insensitive search)
  if (title) {
    filteredTasks = filteredTasks.filter(task => task.title.toLowerCase().includes(title.toLowerCase()));
  }

  // Apply urgency filter
  if (urgency) {
    filteredTasks = filteredTasks.filter(task => task.urgency === urgency);
  }

  // Apply type filter
  if (type) {
    filteredTasks = filteredTasks.filter(task => task.type === type);
  }

  // Render filtered tasks
  res.render('filter', { tasks: filteredTasks, urgency, type, title });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
