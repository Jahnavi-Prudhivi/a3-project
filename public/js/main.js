const submit = async function(event) {
    event.preventDefault();

    const taskData = {
        task: document.querySelector("#task").value,
        priority: document.querySelector("#priority").value,
        info: document.querySelector("#info").value,
        date: document.querySelector("#date").value
    };

    const response = await fetch("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
    });

    updateTaskTable(await response.json());
};

const updateTaskTable = (tasks) => {
    const taskTableBody = document.querySelector("#taskTableBody");
    taskTableBody.innerHTML = "";

    tasks.forEach(task => {
        const row = document.createElement("tr");

        ["task", "info", "priority", "date"].forEach(field => {
            const cell = document.createElement("td");
            cell.textContent = task[field];
            row.appendChild(cell);
        });

        const editCell = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.onclick = () => editTask(task._id, task);
        editCell.appendChild(editButton);
        row.appendChild(editCell);

        const deleteCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => deleteTask(task._id);
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        taskTableBody.appendChild(row);
    });
};

const editTask = (id, task) => {
    document.querySelector("#editTask").style.display = "block";
    document.querySelector("#editTaskName").value = task.task;
    document.querySelector("#editPriority").value = task.priority;
    document.querySelector("#editInfo").value = task.info;
    document.querySelector("#editDate").value = task.date;
    document.querySelector("#editIndex").value = id;
};

const saveEdit = async function(event) {
    event.preventDefault();

    const id = document.querySelector("#editIndex").value;
    const updatedTask = {
        task: document.querySelector("#editTaskName").value,
        priority: document.querySelector("#editPriority").value,
        info: document.querySelector("#editInfo").value,
        date: document.querySelector("#editDate").value
    };

    const response = await fetch(`/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask)
    });

    updateTaskTable(await response.json());
    document.querySelector("#editTask").style.display = "none";
};

const deleteTask = async (id) => {
    const response = await fetch(`/tasks/${id}`, { method: "DELETE" });
    updateTaskTable(await response.json());
};

window.onload = async function() {
    const response = await fetch("/tasks");
    updateTaskTable(await response.json());

    document.querySelector("#listForm").onsubmit = submit;
    document.querySelector("#editForm").onsubmit = saveEdit;
};
