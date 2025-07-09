# Task Manager Application

This is a simple Task Manager application with AI-powered features, including AI summary of pending tasks, AI-suggested task priorities, and AI-autocompleted task descriptions.

## Project Structure

The project is divided into two main parts:

-   `backend/`: Contains the Node.js server that handles API requests and serves the frontend.
-   `frontend/`: Contains the static HTML, CSS, and JavaScript files for the user interface.

## Setup

Follow these steps to set up and run the application locally.

### 1. Clone the Repository (if you haven't already)

```bash
git clone <repository_url>
cd Lezat-test # Or whatever your project directory is named
```

### 2. Backend Setup

Navigate to the `backend` directory and install the necessary Node.js dependencies.

```bash
cd backend
npm install
```

### 3. Environment Variables (`.env`)

The backend requires an API key for the Google Gemini model to enable AI functionalities.

Create a file named `.env` in the `backend/` directory (at the same level as `server.js` and `package.json`). Add your Gemini API key to this file:

```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

**Important:** Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key. You can obtain one from the Google AI Studio.

### 4. Running the Application

Once the backend dependencies are installed and the `.env` file is configured, you can start the server from the `backend` directory:

```bash
cd backend
node server.js
```

The server will typically run on `http://localhost:3000` (or another port if specified in your environment).

The frontend files are served directly by the backend, so once the server is running, you can access the application by opening your web browser and navigating to `http://localhost:3000`.

## Features

-   **Task Management:** Add, view, update, and delete tasks.
-   **Task Filtering:** Filter tasks by status (All, Pending, In Progress, Completed).
-   **AI Summary:** Generate an AI-powered summary of all pending tasks.
-   **AI Priority Suggestion:** Get AI-suggested priority (high, medium, low) for tasks based on their description.
-   **AI Description Autocomplete:** Automatically generate a task description based on the task title.
