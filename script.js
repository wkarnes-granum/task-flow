/*
  JavaScript is all about BEHAVIOR. It makes things interactive.

  WHAT CHANGED: Instead of saving to localStorage (browser-only),
  this file now uses fetch() to talk to our Express server.
  The server stores tasks in a JSON file on disk.

  fetch() sends HTTP requests — the same kind your browser makes
  when you visit a website, but triggered by our code.
*/

// ===== STATE =====

let tasks = [];
let currentFilter = 'all';

// ===== DOM REFERENCES =====

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const emptyState = document.getElementById('empty-state');
const footer = document.getElementById('footer');
const clearCompletedBtn = document.getElementById('clear-completed');
const dateDisplay = document.getElementById('current-date');
const filterBtns = document.querySelectorAll('.filter-btn');

// ===== DISPLAY TODAY'S DATE =====

function showDate() {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString('en-US', options);
}

// ===== API FUNCTIONS =====
// These use fetch() to send requests to our Express server.
// Each one maps to a route defined in server.js.

async function fetchTasks() {
    const response = await fetch('/api/tasks');
    tasks = await response.json();
    render();
}

async function addTask(text) {
    const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
    });
    const newTask = await response.json();
    newTask.isNew = true;
    tasks.unshift(newTask);
    render();
}

async function toggleTask(id) {
    await fetch(`/api/tasks/${id}`, { method: 'PUT' });
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        render();
    }
}

async function deleteTask(id, element) {
    element.classList.add('removing');

    setTimeout(async () => {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        tasks = tasks.filter(t => t.id !== id);
        render();
    }, 300);
}

async function clearCompleted() {
    await fetch('/api/tasks', { method: 'DELETE' });
    tasks = tasks.filter(t => !t.completed);
    render();
}

// ===== RENDER (UPDATE THE UI) =====

function render() {
    const filtered = tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    taskList.innerHTML = '';

    filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''} ${task.isNew ? 'new' : ''}`;
        task.isNew = false;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTask(task.id));

        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', () => deleteTask(task.id, li));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });

    const activeTasks = tasks.filter(t => !t.completed).length;
    taskCount.textContent = `${activeTasks} ${activeTasks === 1 ? 'task' : 'tasks'} remaining`;

    const hasVisibleTasks = filtered.length > 0;
    emptyState.classList.toggle('visible', !hasVisibleTasks);
    footer.style.display = tasks.length > 0 ? 'flex' : 'none';
}

// ===== SET ACTIVE FILTER =====

function setFilter(filter) {
    currentFilter = filter;

    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    render();
}

// ===== EVENT LISTENERS =====

taskForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (text) {
        addTask(text);
        taskInput.value = '';
        taskInput.focus();
    }
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// ===== INITIALIZE =====
// Instead of reading from localStorage, we now fetch tasks from the server.

showDate();
fetchTasks();
