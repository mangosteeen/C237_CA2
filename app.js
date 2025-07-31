//******** TODO: Insert code to import 'express-session' *********//
const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const path = require('path');

//******** TODO: Create database connection *********//
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

//******** TODO: Set up middleware *********//
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    // Session expires after 1 week of inactivity
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}
}));

app.use(flash());

//******** TODO: Set up EJS view engine *********//
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
    if (req.session.user.role === 'volunteer') {
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

//******** TODO: Insert code for main landing page ********//
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success')});
});

//******** TODO: Insert code for registration page ********//
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
            //******** TODO: Redirect to user dashboard after login ********//
            res.redirect('/view');
        } else {
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    });
});

// --------------entong - View list of Request--------------------------------------------------//
app.get('/view', checkAuthenticated, (req, res) => {
  const { urgency, taskType } = req.query;  // get filter params from URL query
  let sql;
  let params = [];

  if (req.session.user.role === 'elderly') {
    // Case-insensitive match for elderName
    sql = 'SELECT * FROM requests WHERE LOWER(elderName) = LOWER(?)';
    params = [req.session.user.username];
  } else if (req.session.user.role === 'volunteer') {
    // Start with a base query
    sql = 'SELECT * FROM requests WHERE 1=1'; // 1=1 to simplify appending AND conditions

    // Add urgency filter if present
    if (urgency) {
      sql += ' AND urgency = ?';
      params.push(urgency);
    }

    // Add taskType filter if present
    if (taskType) {
      sql += ' AND taskType = ?';
      params.push(taskType);
    }
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).send('Database error');

    console.log('Fetched requests for user:', req.session.user.username);
    console.log(results);

    res.render('view', {
      user: req.session.user,
      userRequests: results,
      messages: req.flash('success'),
      filters: { urgency, taskType } // pass current filter values to the view
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
// GET route to show the add request form
app.get('/addNewRequest', checkAuthenticated, (req, res) => {
    res.render('addNewRequest', {
        user: req.session.user,
        errors: [],
        messages: [],
        formData: {}
    });
});

// POST route to handle form submission
app.post('/addNewRequest', (req, res) => {
    const { taskType, description, urgency } = req.body;
    const name = req.session.user.username; // Fix: use logged-in user's name

    const errors = [];

    if (!taskType || !description || !urgency) {
        errors.push('All fields are required.');
    }

    if (errors.length > 0) {
        return res.render('addNewRequest', {
            user: req.session.user,
            errors,
            messages: [],
            formData: { taskType, description, urgency }
        });
    }

    const requestStatus = 'pending';
    const sql = 'INSERT INTO requests (elderName, taskType, description, urgency, requestStatus) VALUES (?, ?, ?, ?, ?)';

    db.query(sql, [name, taskType, description, urgency, requestStatus], (error, results) => {
        if (error) {
            console.error("Error adding request:", error);
            return res.render('addNewRequest', {
                user: req.session.user,
                errors: ['Database error: Unable to add request.'],
                messages: [],
                formData: { taskType, description, urgency }
            });
        } else {
            req.flash('success', 'Request added successfully!');
            res.redirect('/view');
        }
    });
});

// --------------------Chia En - Edit/Update request------------------------------------------------------
app.get('/requests/:id/edit', checkAuthenticated, (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM requests WHERE id = ?';

    db.query(sql, [id], (error, results) => {
        if (error) throw error;

        if (results.length > 0) {
            res.render('editRequest', { request: results[0], user: req.session.user });
        } else {
            res.status(404).send('Request not found');
        }
    });
});

app.post('/requests/:id/update', checkAuthenticated, (req, res) => {
    const id = req.params.id;
    const { elderName, taskType, description, urgency } = req.body;

    const sql = 'UPDATE requests SET elderName = ?, taskType = ?, description = ?, urgency = ? WHERE id = ?';
    db.query(sql, [elderName, taskType, description, urgency, id], (error) => {
        if (error) {
            console.error("Error updating request:", error);
            res.status(500).send('Error updating request');
        } else {
            res.redirect('/view'); 
        }
    });
});

// ----------------------Quinn - Delete request------------------------------------------------------------
app.get('/requests/:id/delete', checkAuthenticated, (req, res) => {
  const id = req.params.id;

  const sql = 'SELECT * FROM requests WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).send('Request not found');
    }

    const request = results[0];

    // Allow delete if volunteer or if elderly owns the request and it's still pending
    const isOwner = req.session.user.username === request.elderName;
    const isPending = request.requestStatus === 'pending';

    if (
      (req.session.user.role === 'volunteer') ||
      (req.session.user.role === 'elderly' && isOwner && isPending)
    ) {
      db.query('DELETE FROM requests WHERE id = ?', [id], (err) => {
        if (err) req.flash('error', 'Error deleting request');
        else req.flash('success', 'Request successfully cancelled.');
        res.redirect('/view');
      });
    } else {
      req.flash('error', 'You do not have permission to delete this request.');
      res.redirect('/view');
    }
  });
});

// -------------------------Hui Zhi - Filter/Search-----------------------------------------------------------
// app.get('/view', checkAuthenticated, (req, res) => {
//     const { el, urgency, taskType } = req.query; // Get filters from query params
//     let sql = 'SELECT * FROM requests WHERE 1=1';
//     let queryValues = [];

//     // Apply filters based on query parameters
//     if (el && el.trim()) {
//         sql += ' AND elderName LIKE ?';
//         queryValues.push(`%${el}%`);
//     }

//     if (urgency) {
//         sql += ' AND urgency = ?';
//         queryValues.push(urgency);
//     }

//     if (taskType) {
//         sql += ' AND taskType = ?';
//         queryValues.push(taskType);
//     }

//     // Execute the query with the applied filters
//     db.query(sql, queryValues, (err, results) => {
//         if (err) {
//             console.error(err);
//             return res.status(500).send('Database error');
//         }

//         // Get the result count
//         const resultCount = results.length;

//         // Render the view page with the filtered requests
//         res.render('filter', {
//             user: req.session.user,
//             userRequests: results,
//             el, // Pass the filter values back to the form
//             urgency,
//             taskType,
//             resultCount // Pass the result count to the template
//         });
//     });
// });


// POST route to handle status change (volunteer accepts)
app.post('/acceptRequest/:id', checkAuthenticated, (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).send('Request ID is missing');
    }

    const sql = 'UPDATE requests SET requestStatus = ? WHERE id = ?'; // 'id' is id in DB
    const newStatus = 'approved';

    db.query(sql, [newStatus, id], (err, result) => {
        if (err) {
            console.error('Error updating request status:', err);
            return res.status(500).send('Database error');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Request not found');
        }

        res.redirect('/approved'); // Redirect after successful update
    });
});


// Approved request//
// Route to view approved requests
app.get('/approved', checkAuthenticated, (req, res) => {
    let sql;
    let params = [];

    // If the user is elderly, show their approved requests only
    if (req.session.user.role === 'elderly') {
        sql = 'SELECT * FROM requests WHERE elderName = ? AND requestStatus = "approved"';
        params = [req.session.user.username];
    } else if (req.session.user.role === 'volunteer') {
        // Volunteers can see all approved requests
        sql = 'SELECT * FROM requests WHERE requestStatus = "approved"';
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).send('Database error');

        res.render('approvedRequests', {
            user: req.session.user,
            approvedRequests: results  // Display approved requests
        });
    });
});

// Forgot-password
// Show Forgot Password page
app.get('/forgot-password', (req, res) => {
    res.render('forgotPassword', {
        errors: req.flash('error'),
        messages: req.flash('success')
    });
});

// Handle email submission
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        req.flash('error', 'Email is required.');
        return res.redirect('/forgot-password');
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            req.flash('error', 'Database error.');
            return res.redirect('/forgot-password');
        }

        if (results.length === 0) {
            req.flash('error', 'No account found with that email.');
            return res.redirect('/forgot-password');
        }

        // Save the email temporarily for the reset-password flow
        req.session.resetEmail = email;
        req.flash('success', 'Email verified. Please reset your password.');
        res.redirect('/reset-password');
    });
});


// Set New password
app.get('/reset-password', (req, res) => {
    res.render('resetPassword', {
        errors: req.flash('error'),
        messages: req.flash('success')
    });
});


// Reset-password
app.post('/reset-password', (req, res) => {
    const { password } = req.body;
    const email = req.session.resetEmail;

    if (!email) {
        req.flash('error', 'Session expired.');
        return res.redirect('/forgot-password');
    }

    if (!password || password.length < 6) {
        req.flash('error', 'Password must be at least 6 characters.');
        return res.redirect('/reset-password');
    }

    const sql = 'UPDATE users SET password = SHA1(?) WHERE email = ?';
    db.query(sql, [password, email], (err, result) => {
        if (err) {
            req.flash('error', 'Error resetting password.');
            return res.redirect('/reset-password');
        }

        // Clear session
        req.session.resetEmail = null;
        req.flash('success', 'Password reset successful. Please log in.');
        res.redirect('/login');
    });
});
// ------------------Message-----------------------------------
app.get('/requests/:id/conversation', checkAuthenticated, (req, res) => {
    const requestId = req.params.id;

    const requestSql = 'SELECT * FROM requests WHERE id = ?';
    const messageSql = 'SELECT * FROM messages WHERE request_id = ? ORDER BY created_at ASC';

    db.query(requestSql, [requestId], (err, requestResult) => {
        if (err || requestResult.length === 0) return res.status(404).send('Request not found');

        db.query(messageSql, [requestId], (err2, messages) => {
            if (err2) return res.status(500).send('Error fetching messages');

            res.render('conversation', {
                request: requestResult[0],
                messages,
                user: req.session.user
            });
        });
    });
});

app.post('/requests/:id/conversation', checkAuthenticated, (req, res) => {
    const requestId = req.params.id;
    const { message } = req.body;
    const sender = req.session.user.username;

    const insertSql = 'INSERT INTO messages (request_id, sender, message) VALUES (?, ?, ?)';
    db.query(insertSql, [requestId, sender, message], (err) => {
        if (err) return res.status(500).send('Error saving message');
        res.redirect(`/requests/${requestId}/conversation`);
    });
});

// --------------------------------profile---------------------------------------
app.get('/profile', checkAuthenticated, (req, res) => {
  const user = req.session.user;
  res.render('profile', { user: user, messages: req.flash('success') });
});

app.post('/profile', checkAuthenticated, (req, res) => {
  const { email, contact, address, password } = req.body;
  const userId = req.session.user.id;

  if (!email || !contact || !address) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/profile');
  }

  let updateQuery = 'UPDATE users SET email = ?, contact = ?, address = ?';
  let updateParams = [email, contact, address];

  if (password) {
    updateQuery += ', password = SHA1(?)';
    updateParams.push(password);
  }

  updateQuery += ' WHERE id = ?';
  updateParams.push(userId);

  db.query(updateQuery, updateParams, (err, result) => {
    if (err) {
      req.flash('error', 'Error updating profile.');
      return res.redirect('/profile');
    }

    req.session.user.email = email; 
    req.session.user.contact = contact; 
    req.session.user.address = address; 

    req.flash('success', 'Profile updated successfully!');
    res.redirect('/profile');
  });
});

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
      res.redirect('/profile'); 
    } else {
      req.flash('error', 'Invalid email or password.');
      res.redirect('/login');
    }
  });
});

//******** TODO: Start the server ********//
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
