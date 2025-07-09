require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve frontend files

// Helper function to read the database
const readDB = () => {
  try {
    const dbData = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(dbData);
  } catch (error) {
    // If the file doesn't exist or is empty, return a default structure
    return { tasks: [] };
  }
};

// Helper function to write to the database
const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Initialize DB if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  writeDB({ tasks: [] });
}

// Routes
// GET /api/tasks - Get all tasks with optional status filter
app.get('/api/tasks', (req, res) => {
  const { status } = req.query;
  let tasks = readDB().tasks;

  if (status) {
    tasks = tasks.filter(task => task.status === status);
  }

  res.json(tasks);
});

// POST /api/tasks - Create a new task
app.post('/api/tasks', (req, res) => {
  const { title, description, status, priority } = req.body;
  const validStatuses = ['pending', 'in progress', 'completed'];
  const validPriorities = ['low', 'medium', 'high'];

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  const db = readDB();
  const newTask = {
    id: uuidv4(),
    title,
    description,
    status: validStatuses.includes(status) ? status : 'pending', // Default to pending if status is invalid
    priority: validPriorities.includes(priority) ? priority : 'medium' // Default to medium if priority is invalid
  };

  db.tasks.push(newTask);
  writeDB(db);

  res.status(201).json(newTask);
});

// PATCH /api/tasks/:id - Update a task's status
app.patch('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'in progress', 'completed'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'A valid status is required.' });
  }

  const db = readDB();
  const taskIndex = db.tasks.findIndex(task => task.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  db.tasks[taskIndex].status = status;
  writeDB(db);

  res.json(db.tasks[taskIndex]);
});

// DELETE /api/tasks/:id - Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const filteredTasks = db.tasks.filter(task => task.id !== id);

  if (db.tasks.length === filteredTasks.length) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  db.tasks = filteredTasks;
  writeDB(db);

  res.status(204).send(); // No content
});

// POST /api/tasks/summarize - Summarize pending tasks
app.post('/api/tasks/summarize', async (req, res) => {
  try {
    const tasks = readDB().tasks.filter(t => t.status === 'pending');

    if (tasks.length === 0) {
      return res.json({ summary: 'No pending tasks to summarize.' });
    }

    const tasklist = tasks.map(t => `- ${t.title}: ${t.description}`).join('\n');
    const prompt = `Por favor, proporciona un resumen breve e inteligente de las siguientes tareas pendientes en formato markdown. Agrupalas por prioridad o temas comunes si es posible, usando encabezados y viñetas de markdown:\n\n${tasklist}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    res.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ message: 'Failed to generate summary.' });
  }
});

// POST /api/tasks/suggest-priority - Suggest priority based on description
app.post('/api/tasks/suggest-priority', async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ message: 'Description is required to suggest priority.' });
  }

  try {
    const prompt = `Given the following task description, suggest a priority (high, medium, or low). Respond with only the suggested priority word (e.g., "high", "medium", "low").\n\nDescription: "${description}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const priority = response.text().trim().toLowerCase();

    // Basic validation to ensure the response is one of the expected priorities
    const validPriorities = ['high', 'medium', 'low'];
    if (validPriorities.includes(priority)) {
      res.json({ priority });
    } else {
      // If the model returns something unexpected, default to medium
      res.json({ priority: 'medium' });
    }

  } catch (error) {
    console.error('Error suggesting priority:', error);
    res.status(500).json({ message: 'Failed to suggest priority.' });
  }
});

// POST /api/tasks/autocomplete-description - Autocomplete description based on title
app.post('/api/tasks/autocomplete-description', async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required to autocomplete description.' });
  }

  try {
    const prompt = `Generate a concise and relevant description for a task with the title: "${title}". The description should be a single sentence and in the language the title was provided.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text().trim();

    res.json({ description });
  } catch (error) {
    console.error('Error autocompleting description:', error);
    res.status(500).json({ message: 'Failed to autocomplete description.' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});