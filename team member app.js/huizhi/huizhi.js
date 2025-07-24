//heheconst express = require('express');
const app = express();
const path = require('path');

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
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
