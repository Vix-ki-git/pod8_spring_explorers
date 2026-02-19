const taskInput = document.getElementById('taskInput');
const dateInput = document.getElementById('dateInput');
const startTimeInput = document.getElementById('startTimeInput');
const hoursInput = document.getElementById('hoursInput');
const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');
const addBtn = document.getElementById('addBtn');
const calcBtn = document.getElementById('calcBtn');
const taskList = document.getElementById('taskList');
const totalDuration = document.getElementById('totalDuration');
const countdownInfo = document.getElementById('countdownInfo');
const priorityInput = document.getElementById('priorityInput');
const repeatInput = document.getElementById('repeatInput'); // optional recurrence select
const routineInput = document.getElementById('routineInput'); // <-- add this
 
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let editIndex = null;
 
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
 
function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}
 
function renderTasks() {
  taskList.innerHTML = '';
  const priorityOrder = { High: 3, Medium: 2, Low: 1 };
 
  tasks.sort((a, b) => {
    const startA = new Date(`${a.date}T${a.start}`);
    const startB = new Date(`${b.date}T${b.start}`);
    if (startA.getTime() === startB.getTime()) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return startA - startB;
  });
 
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="${task.completed ? 'completed' : ''}">
        <strong>${task.name}</strong>
        <span style="opacity:0.7;">• PRIORITY: ${task.priority}</span>
        ${task.routine ? '<span class="routine-badge">Routine</span>' : ''}
        <br>
        <span style="font-size:13px; color:#555;">
          ⏱ ${formatTime(task.time)} | ${task.date} • ${task.start}
        </span>
        <div class="progress-bar"><div class="progress-fill"></div></div>
      </span>
      <div class="icons">
        <i class="fas fa-edit" onclick="startEdit(${index})"></i>
        <i class="fas fa-check" onclick="toggleComplete(${index})"></i>
        <i class="fas fa-trash" onclick="deleteTask(${index})"></i>
      </div>
    `;
    taskList.appendChild(li);
  });
 
  addBtn.textContent = editIndex !== null ? "Update Task" : "Add Task";
}
 
function addOrUpdateTask() {
  const name = taskInput.value.trim();
  const date = dateInput.value;
  const start = startTimeInput.value;
  const h = parseInt(hoursInput.value) || 0;
  const m = parseInt(minutesInput.value) || 0;
  const s = parseInt(secondsInput.value) || 0;
  const totalSeconds = h * 3600 + m * 60 + s;
 
  if (!name || !date || !start) {
    alert('Please enter task name, date, and start time.');
    return;
  }
  if (totalSeconds <= 0) {
    alert('Please enter a valid duration.');
    return;
  }
 
  const taskData = {
    name,
    date,
    start,
    time: totalSeconds,
    completed: editIndex !== null ? tasks[editIndex].completed : false,
    priority: priorityInput.value,
    repeat: repeatInput ? repeatInput.value : "None",
    routine: routineInput.checked // <-- store routine flag
  };
 
  if (editIndex !== null) {
    tasks[editIndex] = taskData;
    editIndex = null;
  } else {
    if (taskData.repeat === "None" && !taskData.routine) {
      // duplicate check only for non-routine, non-recurring
      const existingIndex = tasks.findIndex(
        task => task.name.toLowerCase() === name.toLowerCase()
      );
      if (existingIndex !== -1) {
        const confirmUpdate = confirm(
          `Task "${name}" already exists. Do you want to update it instead?`
        );
        if (confirmUpdate) {
          tasks[existingIndex] = { ...tasks[existingIndex], ...taskData };
        }
      } else {
        tasks.push(taskData);
      }
    } else {
      // always allow routine or recurring tasks
      tasks.push(taskData);
    }
  }
 
  saveTasks();
  renderTasks();
 
  // clear form
  taskInput.value = '';
  dateInput.value = '';
  startTimeInput.value = '';
  hoursInput.value = '';
  minutesInput.value = '';
  secondsInput.value = '';
  priorityInput.value = 'Medium';
  if (repeatInput) repeatInput.value = 'None';
  routineInput.checked = false; // reset checkbox
}
 
function startEdit(index) {
  const task = tasks[index];
  taskInput.value = task.name;
  dateInput.value = task.date;
  startTimeInput.value = task.start;
  hoursInput.value = Math.floor(task.time / 3600);
  minutesInput.value = Math.floor((task.time % 3600) / 60);
  secondsInput.value = task.time % 60;
  priorityInput.value = task.priority;
  if (repeatInput) repeatInput.value = task.repeat || 'None';
  routineInput.checked = task.routine; // restore checkbox state
  editIndex = index;
  renderTasks();
}
 
function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
 
  if (tasks[index].completed && (tasks[index].repeat !== "None" || tasks[index].routine)) {
    const oldDate = new Date(tasks[index].date);
    if (tasks[index].repeat === "Daily" || tasks[index].routine) {
      oldDate.setDate(oldDate.getDate() + 1);
    } else if (tasks[index].repeat === "Weekly") {
      oldDate.setDate(oldDate.getDate() + 7);
    }
    const newTask = { ...tasks[index], date: oldDate.toISOString().split("T")[0], completed: false };
    tasks.push(newTask);
  }
 
  saveTasks();
  renderTasks();
}
 
function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}
 
function calculateTotal() {
  const totalSeconds = tasks.reduce((sum, task) => sum + task.time, 0);
  totalDuration.value = formatTime(totalSeconds);
}
 
function updateCountdown() {
  if (tasks.length === 0) {
    countdownInfo.textContent = "No tasks scheduled";
    return;
  }
 
  const now = new Date();
  const activeTasks = tasks.filter(task => !task.completed);
 
  if (activeTasks.length === 0) {
    countdownInfo.textContent = "No upcoming tasks";
    return;
  }
 
  const priorityOrder = { High: 3, Medium: 2, Low: 1 };
  activeTasks.sort((a, b) => {
    const startA = new Date(`${a.date}T${a.start}`);
    const startB = new Date(`${b.date}T${b.start}`);
    if (startA.getTime() === startB.getTime()) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return startA - startB;
  });
 
  const nextTask = activeTasks[0];
  const nextStart = new Date(`${nextTask.date}T${nextTask.start}`);
  const nextEnd = new Date(nextStart.getTime() + nextTask.time * 1000);
 
  const startDiff = Math.floor((nextStart - now) / 1000);
  const endDiff = Math.floor((nextEnd - now) / 1000);
 
  [...taskList.children].forEach(li => li.classList.remove("active-task"));
  const activeIndex = tasks.indexOf(nextTask);
  if (activeIndex !== -1) {
    taskList.children[activeIndex].classList.add("active-task");
    const progressFill = taskList.children[activeIndex].querySelector(".progress-fill");
    if (endDiff > 0 && startDiff <= 0) {
      const elapsed = (now - nextStart) / 1000;
      const percent = Math.min(100, (elapsed / nextTask.time) * 100);
      progressFill.style.width = percent + "%";
    } else {
      progressFill.style.width = "0%";
    }
  }
 
if (startDiff > 0) {
    countdownInfo.textContent = `Next task "${nextTask.name}" starts in ${formatTime(startDiff)}`;
  } else if (endDiff > 0)
   {
    countdownInfo.textContent = `Task "${nextTask.name}" ends in ${formatTime(endDiff)}`;
  } else {
    countdownInfo.textContent = `Task "${nextTask.name}" deadline passed`;
  }
}
 
addBtn.addEventListener('click', addOrUpdateTask);
calcBtn.addEventListener('click', calculateTotal);
 
setInterval(updateCountdown, 1000);
 
renderTasks();
updateCountdown();