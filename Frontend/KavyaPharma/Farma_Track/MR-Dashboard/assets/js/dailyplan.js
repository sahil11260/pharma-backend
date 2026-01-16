// assets/js/dailyplan.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("dailyplan.js loaded and DOM content is ready!");
    // --- Helper Functions ---
    const formatDateKey = (date) => date.toISOString().split('T')[0];
    const todayKey = formatDateKey(new Date()); 

    function getDateXDaysAgo(days) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return formatDateKey(d);
    }

    // --- MOCK DATA (All tasks initialized with "Pending" or "In Progress") ---
    const mockManagerTasks = [
        // TODAY'S Tasks (All start as Pending)
        { id: 101, type: "Doctor Visit", clinic: "Care Clinic", doctor: "Dr. Anjali Sharma", status: "Pending", date: todayKey },
        { id: 103, type: "Pramotion", clinic: "South Delhi Clinics", doctor: "Mr. R. K. Singh", status: "Pending", date: todayKey },
        { id: 105, type: "Other", clinic: "Office/Virtual", doctor: "Regional Meeting", status: "Pending", date: todayKey },
        { id: 106, type: "Doctor Visit", clinic: "City Medical", doctor: "Dr. Rohit Patel", status: "Pending", date: todayKey },
        
        // PAST DUE Tasks (Pending or In Progress, dated before today)
        { id: 201, type: "Doctor", clinic: "Westside Clinic", doctor: "Dr. Ben Carter", status: "Pending", date: getDateXDaysAgo(1) }, 
        { id: 202, type: "Meeting", clinic: "Main City Hosp.", doctor: "Dr. Jane Doe", status: "In Progress", date: getDateXDaysAgo(3) }, 
        { id: 203, type: "Doctor Visit", clinic: "Old Town Clinic", doctor: "Dr. Jane Doe", status: "Pending", date: getDateXDaysAgo(7) }, 
    ];

    // --- DOM Elements Selector ---
    const $id = id => document.getElementById(id);
    
    // Elements
    const todayTaskListBody = $id("todayTaskListBody");
    const pastDueTaskListBody = $id("pastDueTaskListBody");
    const pastDueTasksContainer = $id("pastDueTasksContainer");
    
    // Summary Card Elements (IDs are verified against your HTML)
    const totalCountEl = $id("totalTasksCount");
    const completedCountEl = $id("completedTasksCount");
    const pendingCountEl = $id("pendingTasksCount");

    // --- PERSISTENCE / INITIALIZATION LOGIC (Guaranteed Reset if today's data is missing) ---
    let tasks = [];
    const storedTasksRaw = localStorage.getItem("dailyPlanTasks");
    const storedTasks = storedTasksRaw ? JSON.parse(storedTasksRaw) : [];
    
    // Check if we have tasks for today. If not, reset to fresh mock data.
    const todayTasksInStorage = storedTasks.filter(task => task.date === todayKey);

    if (storedTasks.length === 0 || todayTasksInStorage.length === 0) {
        // Reset to fresh mock data, ensuring today's tasks are included with current date.
        tasks = mockManagerTasks;
        saveTasks();
    } else {
        // Otherwise, use the existing stored data (with user updates).
        tasks = storedTasks;
    }


    // --- CORE LOGIC ---

    function saveTasks() {
        localStorage.setItem("dailyPlanTasks", JSON.stringify(tasks));
    }

    function updateSummary() {
        // Calculate counts based on ALL tasks (today's and past due)
        const total = tasks.length;
        // Pending is defined as status NOT "Completed"
        const pendingOrInProgress = tasks.filter(task => task.status !== "Completed").length; 
        const completed = total - pendingOrInProgress; 
        
        // Update the card elements
        if (totalCountEl) totalCountEl.textContent = total;
        if (completedCountEl) completedCountEl.textContent = completed;
        if (pendingCountEl) pendingCountEl.textContent = pendingOrInProgress;
    }

    function getStatusClass(status) {
        switch (status) {
            case 'Completed': return 'bg-success';
            case 'In Progress': return 'bg-primary';
            case 'Pending': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }
    
    // --- TASK RENDERING ---

    function renderAllTasks() {
        // Filter tasks assigned for the current date
        const todayTasks = tasks.filter(task => task.date === todayKey);
        
        // Filter tasks that are old AND not completed
        const pastDueTasks = tasks.filter(task => 
            task.date < todayKey && 
            task.status !== "Completed"
        ).sort((a, b) => new Date(a.date) - new Date(b.date)); 
        
        renderTaskTable(todayTasks, todayTaskListBody, false);
        renderTaskTable(pastDueTasks, pastDueTaskListBody, true);
        
        updateSummary(); // Called here to ensure summary reflects filtered tables
    }
    
    function renderTaskTable(taskList, tableBodyElement, isPastDue) {
        if (!tableBodyElement) return;

        tableBodyElement.innerHTML = ''; 

        if (taskList.length === 0) {
            const emptyMessage = isPastDue 
                ? 'No pending tasks from previous days.' 
                : 'No visits assigned for today.';
            
            const colSpan = 6;
            tableBodyElement.innerHTML = `<tr><td colspan="${colSpan}" class="text-center text-muted p-4">${emptyMessage}</td></tr>`;
            
            if (isPastDue && pastDueTasksContainer) {
                // Only hide the entire section if it's the Past Due table and it's empty
                pastDueTasksContainer.style.display = 'none';
            }
            return;
        }
        
        if (isPastDue && pastDueTasksContainer) {
            pastDueTasksContainer.style.display = 'block';
        }


        taskList.forEach((task, index) => {
            const statusClass = getStatusClass(task.status);
            const row = document.createElement('tr');
            row.dataset.taskId = task.id;
            
            const firstColContent = isPastDue ? task.date : (index + 1);

            row.innerHTML = `
                <td>${firstColContent}</td>
                <td><span class="fw-bold">${task.type}</span></td>
                <td>${task.clinic}</td>
                <td>${task.doctor}</td>
                <td><span class="badge ${statusClass} task-status-badge">${task.status}</span></td>
                <td>
                    <button 
                        class="btn btn-sm btn-outline-primary btn-update-status" 
                        data-task-id="${task.id}"
                        data-bs-toggle="modal" 
                        data-bs-target="#statusUpdateModal"
                        ${task.status === 'Completed' ? 'disabled' : ''}>
                        ${task.status === 'Completed' ? 'Done' : 'Update'}
                    </button>
                </td>
            `;

            tableBodyElement.appendChild(row);
        });
    }

    // --- MODAL & STATUS UPDATE LOGIC ---
    
    // Dynamically inject the modal if it doesn't exist
    const modalId = 'statusUpdateModal';
    if (!$id(modalId)) {
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="statusUpdateModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="statusUpdateModalLabel">Update Task Status</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-3">Updating status for: <strong id="modalTaskTarget"></strong></p>
                            <input type="hidden" id="modalTaskId">
                            <div class="mb-3">
                                <label for="newStatus" class="form-label">New Status</label>
                                <select class="form-select" id="newStatus">
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveStatusBtn">Save Status</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Now reference the modal elements after ensuring they are in the DOM
    const statusUpdateModal = $id(modalId);
    const saveStatusBtn = $id('saveStatusBtn');
    const newStatusSelect = $id('newStatus');
    const modalTaskTarget = $id('modalTaskTarget');
    const modalTaskIdInput = $id('modalTaskId');
    
    // Listen for modal opening to populate data
    if(statusUpdateModal) {
        statusUpdateModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            if(!button) return; 
            
            const taskId = parseInt(button.dataset.taskId);
            const task = tasks.find(t => t.id === taskId);
            
            if (task) {
                modalTaskTarget.textContent = `${task.doctor} (${task.clinic})`; 
                modalTaskIdInput.value = taskId;
                newStatusSelect.value = task.status; 
            }
        });
    }
    
    // Listen for save button click
    if(saveStatusBtn) {
        saveStatusBtn.addEventListener('click', () => {
            const taskId = parseInt(modalTaskIdInput.value);
            const newStatus = newStatusSelect.value;
            
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].status = newStatus;
                saveTasks();
                renderAllTasks();
                
                // Close the modal
                const modalInstance = bootstrap.Modal.getInstance(statusUpdateModal) || new bootstrap.Modal(statusUpdateModal);
                modalInstance.hide();
            }
        });
    }

    // Initial render
    renderAllTasks();
});
