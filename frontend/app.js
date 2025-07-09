
document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = '/api/tasks';
    const taskForm = document.getElementById('task-form');
    const titleInput = document.getElementById('title-input');
    const descriptionInput = document.getElementById('description-input');
    const statusInput = document.getElementById('status-input');
    const taskList = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const summarizeBtn = document.getElementById('summarize-btn');
    const summaryOutput = document.getElementById('summary-output');
    const suggestPriorityBtn = document.getElementById('suggest-priority-btn');
    const priorityInput = document.getElementById('priority-input');

    let currentFilter = 'all';

    // Fetch and render tasks
    const fetchTasks = async () => {
        let url = apiUrl;
        if (currentFilter !== 'all') {
            url += `?status=${currentFilter}`;
        }

        try {
            const response = await fetch(url);
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    // Render tasks in the list
    const renderTasks = (tasks) => {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item status-${task.status}`;
            taskItem.innerHTML = `
                <div class="details">
                    <h3>${task.title}</h3>
                    <p>${task.description}</p>
                    <span>Status: <strong>${task.status}</strong></span>
                    <span>Priority: <strong>${task.priority}</strong></span>
                </div>
                <div class="actions">
                    <select class="status-select" data-id="${task.id}">
                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in progress" ${task.status === 'in progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                    <button class="delete-btn" data-id="${task.id}">Delete</button>
                </div>
            `;
            taskList.prepend(taskItem);
        });
    };

    // Handle form submission to create a new task
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = titleInput.value;
        const description = descriptionInput.value;
        const status = statusInput.value;
        const priority = priorityInput.value;

        try {
            await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, status, priority })
            });
            titleInput.value = '';
            descriptionInput.value = '';
            priorityInput.value = 'low'; // Reset to default
            fetchTasks();
        } catch (error) {
            console.error('Error creating task:', error);
        }
    });

    // Handle suggest priority button click
    suggestPriorityBtn.addEventListener('click', async () => {
        const description = descriptionInput.value;
        if (!description) {
            alert('Please enter a description to suggest priority.');
            return;
        }

        try {
            const response = await fetch('/api/tasks/suggest-priority', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });
            const data = await response.json();
            priorityInput.value = data.priority;
        } catch (error) {
            console.error('Error suggesting priority:', error);
            alert('Failed to suggest priority.');
        }
    });

    // Handle autocomplete description on title input blur
    titleInput.addEventListener('blur', async () => {
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();

        if (title && !description) {
            descriptionInput.placeholder = 'Generating description...';
            descriptionInput.disabled = true;
            try {
                const response = await fetch('/api/tasks/autocomplete-description', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title })
                });
                const data = await response.json();
                descriptionInput.value = data.description;
            } catch (error) {
                console.error('Error autocompleting description:', error);
                descriptionInput.placeholder = 'Task description'; // Restore placeholder on error
            } finally {
                descriptionInput.disabled = false;
            }
        }
    });

    // Handle clicks on the task list for actions (delete/update status)
    taskList.addEventListener('click', async (e) => {
        const target = e.target;
        const id = target.dataset.id;

        // Delete task
        if (target.classList.contains('delete-btn')) {
            try {
                await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
                fetchTasks();
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    });
    
    // Handle status change
    taskList.addEventListener('change', async (e) => {
        if (e.target.classList.contains('status-select')) {
            const id = e.target.dataset.id;
            const status = e.target.value;

            try {
                await fetch(`${apiUrl}/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                fetchTasks();
            } catch (error) {
                console.error('Error updating status:', error);
            }
        }
    });


    // Handle filter button clicks
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.status;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            fetchTasks();
        });
    });

    // Initial fetch
    fetchTasks();

    // Handle AI summary generation
    summarizeBtn.addEventListener('click', async () => {
        summaryOutput.innerHTML = 'Generating summary...';
        try {
            const response = await fetch('/api/tasks/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            summaryOutput.innerHTML = marked.parse(data.summary);
        } catch (error) {
            console.error('Error generating AI summary:', error);
            summaryOutput.innerHTML = 'Failed to generate summary.';
        }
    });
});
