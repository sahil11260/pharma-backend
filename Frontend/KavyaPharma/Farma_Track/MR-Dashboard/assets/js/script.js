document.addEventListener("DOMContentLoaded", () => {
    
    // --- MOCK DATA: Tasks assigned by the Manager ---
    // All initial statuses set to 'Pending' as required.
    const mockManagerTasks = [
        { id: 101, type: "Doctor", clinic: "Care Clinic", doctor: "Dr. Anjali Sharma", status: "Pending" },
        { id: 102, type: "Chemist", clinic: "City Chemist", doctor: "N/A (Chemist Visit)", status: "Pending" },
        { id: 103, type: "Doctor", clinic: "Global Hospital", doctor: "Dr. Vikram Singh", status: "Pending" },
        { id: 104, type: "Chemist", clinic: "Apollo Pharmacy", doctor: "N/A (Chemist Visit)", status: "Pending" },
        { id: 105, type: "Other", clinic: "Office/Virtual", doctor: "Regional Meeting", status: "Pending" },
    ];

    // Elements
    const taskListBody = document.getElementById("taskListBody");
    
    // Counters
    const totalCountEl = document.getElementById("totalTasksCount");
    const completedCountEl = document.getElementById("completedTasksCount");
    const pendingCountEl = document.getElementById("pendingTasksCount");

    // Initialize Tasks from Local Storage (or use mock data if local storage is empty)
    let tasks = JSON.parse(localStorage.getItem("dailyPlanTasks")) || [];
    
    // If local storage is empty or tasks haven't been initialized yet, use mock data
    if (tasks.length === 0 || tasks.some(t => !t.clinic || !t.doctor)) {
        tasks = mockManagerTasks;
        saveTasks();
    }


    // --- HELPER FUNCTIONS ---

    function saveTasks() {
        localStorage.setItem("dailyPlanTasks", JSON.stringify(tasks));
    }

    function updateSummary() {
        // Added a check to prevent errors if elements aren't loaded
        if (!totalCountEl || !completedCountEl || !pendingCountEl) return; 
        
        const total = tasks.length;
        const completed = tasks.filter(task => task.status === "Completed").length;
        // Adjusted logic to include 'In Progress' in the pending count for accuracy
        const pending = tasks.filter(task => task.status === "Pending" || task.status === "In Progress").length; 

        totalCountEl.textContent = total;
        completedCountEl.textContent = completed;
        pendingCountEl.textContent = pending;
    }

    // Get status badge class
    function getStatusClass(status) {
        switch (status) {
            case 'Completed': return 'bg-success';
            case 'In Progress': return 'bg-primary';
            case 'Pending': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }
    
    // --- RENDER TASKS (in Table Format) ---

    function renderTasks() {
        if (!taskListBody) return; 
        
        taskListBody.innerHTML = ''; // Clear existing table rows

        if (tasks.length === 0) {
            taskListBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted p-4">No tasks assigned for today.</td></tr>`;
            updateSummary();
            return;
        }

        tasks.forEach((task, index) => {
            const statusClass = getStatusClass(task.status);
            
            const row = document.createElement('tr');
            row.dataset.taskId = task.id;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><span class="fw-bold">${task.type}</span></td>
                <td>${task.clinic}</td>
                <td>${task.doctor}</td>
                <td><span class="badge ${statusClass} task-status-badge">${task.status}</span></td>
                <td>
                    <button 
                        class="btn btn-sm btn-outline-primary btn-update-status" 
                        data-task-id="${task.id}"
                        data-current-status="${task.status}"
                        data-bs-toggle="modal" 
                        data-bs-target="#statusUpdateModal">
                        Update
                    </button>
                </td>
            `;

            taskListBody.appendChild(row);
        });

        updateSummary();
    }

    // --- MODAL AND STATUS UPDATE LOGIC ---
    
    // ⚠️ IMPORTANT: We now assume the 'statusUpdateModal' HTML exists statically in the main HTML file.
    
    const statusUpdateModal = document.getElementById('statusUpdateModal');
    const saveStatusBtn = document.getElementById('saveStatusBtn');
    const newStatusSelect = document.getElementById('newStatus');
    const modalTaskTarget = document.getElementById('modalTaskTarget');
    const modalTaskIdInput = document.getElementById('modalTaskId');
    
    // Check if the modal elements exist before adding listeners
    if (statusUpdateModal && saveStatusBtn) {
        
        // Event listener when the modal is about to open
        statusUpdateModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const taskId = parseInt(button.dataset.taskId);
            const task = tasks.find(t => t.id === taskId);
            
            if (task) {
                // Display Doctor/Clinic name in modal title
                modalTaskTarget.textContent = task.type === 'Doctor' ? task.doctor : task.clinic; 
                modalTaskIdInput.value = taskId;
                newStatusSelect.value = task.status; // Set the current status
            }
        });
        
        // Event listener for saving the new status
        saveStatusBtn.addEventListener('click', () => {
            const taskId = parseInt(modalTaskIdInput.value);
            const newStatus = newStatusSelect.value;
            
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].status = newStatus;
                saveTasks();
                renderTasks();
                
                // Close the modal
                const modalInstance = bootstrap.Modal.getInstance(statusUpdateModal);
                modalInstance.hide();
            }
        });
    }

    // Initial render
    renderTasks();
});
