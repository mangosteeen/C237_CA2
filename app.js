//******** TODO: Insert code to import 'express-session' *********//
const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const path = require('path');

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

// Middleware
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

// --------------------Login------------------------------------------- 
//******** TODO: Create a Middleware to check if user is logged in. ********//
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/login');
    }
};

//******** TODO: Create a Middleware to check if user is admin. ********//
const checkAdmin = (req, res, next) => {
    if (req.session.user.role === 'admin') {
        return next();
    } else {
        req.flash('error', 'Access denied');
        res.redirect('/');
    }
};

//******** TODO: Create a middleware function validateRegistration ********//
const validateRegistration = (req, res, next) => {
    const { username, email, password, address, contact } = req.body;

    if (!username || !email || !password || !address || !contact) {
        req.flash('error', 'All fields are required.');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next();
};

// Routes
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success')});
});

app.get('/register', (req, res) => {
    res.render('register', { messages: req.flash('error'), formData: req.flash('formData')[0] });
});

//******** TODO: Integrate validateRegistration into the register route. ********//
app.post('/register', validateRegistration, (req, res) => {
    //******** TODO: Update register route to include role. ********//
    const { username, email, password, address, contact, role } = req.body;
    const sql = 'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)';

    db.query(sql, [username, email, password, address, contact, role], (err, result) => {
        if (err) {
            throw err;
        }
        console.log(result);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    });
});

//******** TODO: Insert code for login routes to render login page below ********//
app.get('/login', (req, res) => {
    res.render('login', { 
        messages: req.flash('success'), 
        errors: req.flash('error') 
    });
});

//******** TODO: Insert code for login routes for form submission below ********//
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/login');
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND password = SHA1(?)';
    db.query(sql, [email, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            req.session.user = results[0];
            req.flash('success', 'Login successful!');
            // Redirecting to the correct view page after login
            res.redirect('/view');  // Assuming your 'view.ejs' is the main dashboard for users
        } else {
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    });
});

// --------------entong - View list of Request--------------------------------------------------//
app.get('/view', checkAuthenticated, (req, res) => {
    const sql = 'SELECT * FROM requests';
    const userId = req.session.user.id;

    db.query(sql, [userId, req.session.user.role], (err, results) => {
        if (err) return res.status(500).send('Database error');

        res.render('view', { 
            user: req.session.user,
            userRequests: results 
        });
    });
});

//******** TODO: Insert code for admin route to render dashboard page for admin. ********//
app.get('/admin', checkAuthenticated, checkAdmin, (req, res) => {
    res.render('admin', { user: req.session.user });
});

//******** TODO: Insert code for logout route ********//
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// --------------Joanne - Add New request----------------------------------------------------------------------
// Fixed render view to 'AddNewRequest' (matches your EJS filename)
app.get('/addNewRequest', checkAuthenticated, checkAdmin, (req, res) => {
    res.render('AddNewRequest', { user: req.session.user });
});

app.post('/addNewRequest', checkAuthenticated, checkAdmin, (req, res) => {
    const { name, taskType, description, urgency, requestStatus } = req.body;
    const sql = 'INSERT INTO requests (elderName, taskType, description, urgency, requestStatus) VALUES (?, ?, ?, ?, ?)';

    db.query(sql, [name, taskType, description, urgency, requestStatus], (error) => {
        if (error) {
            console.error("Error adding request:", error);
            res.status(500).send('Error adding request');
        } else {
            res.redirect('/view');
        }
    });
});

// --------------------Chia En - Edit/Update request------------------------------------------------------
app.get('/requests/:id/edit', checkAuthenticated, (req, res) => {
    const requestId = req.params.id;
    const sql = 'SELECT * FROM requests WHERE id = ?';

    db.query(sql, [requestId], (error, results) => {
        if (error) throw error;

        if (results.length > 0) {
            // Fixed render view to 'editRequest'
            res.render('editRequest', { request: results[0], user: req.session.user });
        } else {
            res.status(404).send('Request not found');
        }
    });
});

app.post('/requests/:id/update', checkAuthenticated, (req, res) => {
    const requestId = req.params.id;
    const { elderName, taskType, description, urgency } = req.body;

    const sql = 'UPDATE requests SET elderName = ?, taskType = ?, description = ?, urgency = ? WHERE id = ?';
    db.query(sql, [elderName, taskType, description, urgency, requestId], (error) => {
        if (error) {
            console.error("Error updating request:", error);
            res.status(500).send('Error updating request');
        } else {
            res.redirect('/view'); 
        }
    });
});

// ----------------------Quinn - Delete request------------------------------------------------------------
app.get('/requests/:id/delete', checkAuthenticated, checkAdmin, (req, res) => {
  const sql = 'DELETE FROM requests WHERE id = ?';
  db.query(sql, [req.params.id], (err) => {
    if (err) req.flash('error', 'Error deleting request');
    else req.flash('success', 'Request deleted');
    res.redirect('/view');
  });
});

// -------------------------Hui Zhi - Filter/Search-----------------------------------------------------------
app.get('/filter', checkAuthenticated, (req, res) => {
    const { title, urgency, type } = req.query;

    // Construct the SQL query to filter based on the query parameters
    let sql = 'SELECT * FROM tasks WHERE 1=1'; // This ensures the query is always valid
    
    // Array to hold query values
    let queryValues = [];

    // If title is provided, filter tasks by title
    if (title) {
        sql += ' AND title LIKE ?';
        queryValues.push(`%${title}%`);  // Use % for partial match
    }

    // If urgency is provided, filter tasks by urgency
    if (urgency) {
        sql += ' AND urgency = ?';
        queryValues.push(urgency);
    }

    // If type is provided, filter tasks by type
    if (type) {
        sql += ' AND type = ?';
        queryValues.push(type);
    }

    // Execute the query with dynamic values
    db.query(sql, queryValues, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        // Render the filter page with the filtered results
        res.render('filter', { tasks: results, title, urgency, type });
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
