document.addEventListener("DOMContentLoaded", async () => {

    // --- MOCK DATA ---
    const initialExpenses = [
        {
            id: 1700000001,
            category: "Travel",
            amount: 750.50,
            date: "2025-11-25",
            desc: "Local conveyance for client meetings in Zone A and surrounding areas for three days, covering 150 km. This is a detailed note to test wrapping.",
            attachment: "cab_receipt_25Nov.pdf",
            status: "Approved"
        },
        {
            id: 1700000002,
            category: "Meals",
            amount: 350.00,
            date: "2025-11-26",
            desc: "Lunch with Dr. Sharma to discuss new product launch and distribution strategy.",
            attachment: "lunch_bill_26Nov.jpg",
            status: "Pending"
        },
        {
            id: 1700000003,
            category: "Accommodation",
            amount: 4500.00,
            date: "2025-11-24",
            desc: "One night stay for out-of-city visit to meet regional doctors and hospitals.",
            attachment: "hotel_receipt_24Nov.pdf",
            status: "Rejected"
        },
        {
            id: 1700000004,
            category: "Samples",
            amount: 1200.00,
            date: "2025-11-23",
            desc: "Courier charges for dispatching new product samples to five different clinics.",
            attachment: "courier_slip_23Nov.png",
            status: "Approved"
        },
        {
            id: 1700000005,
            category: "Other",
            amount: 200.00,
            date: "2025-11-22",
            desc: "Printing material for doctor presentations and informational flyers.",
            attachment: "print_bill_22Nov.pdf",
            status: "Pending"
        },
        {
            id: 1700000006,
            category: "Travel",
            amount: 50.00,
            date: "2025-11-21",
            desc: "Bus fare for office trip to regional head quarters.",
            attachment: "bus_ticket.jpg",
            status: "Pending"
        },
        {
            id: 1700000007,
            category: "Meals",
            amount: 850.00,
            date: "2025-11-20",
            desc: "Dinner meeting with hospital staff to build rapport.",
            attachment: "dinner_receipt_20.pdf",
            status: "Approved"
        },
    ];
    // --- END MOCK DATA ---

    // --- CONFIGURATION ---
    const PAGE_SIZE = 5; // Expenses per page
    let currentPage = 1;
    const API_BASE = "https://pharma-backend-hxf9.onrender.com/api/mr-expenses";
    let expenseList = [];

    // --- ELEMENTS & MODALS ---
    const body = document.getElementById("expenseTableBody");

    const btnSave = document.getElementById("saveExpenseBtn");

    const addExpenseModalEl = document.getElementById("addExpenseModal");
    const addExpenseModal = new bootstrap.Modal(addExpenseModalEl);

    const btnUpdate = document.getElementById("updateExpenseBtn");
    const editExpenseModalEl = document.getElementById("editExpenseModal");
    const editExpenseModal = new bootstrap.Modal(editExpenseModalEl);

    const paginationUl = document.getElementById("expensePagination");
    const paginationInfo = document.getElementById("paginationInfo");


    // --- HELPER FUNCTIONS ---

    function showToast(message, type = 'success') {
        // Placeholder for toast functionality (requires toast HTML)
        console.log(`✅ ${message}`);
    }

    function getAuthHeader() {
        const token = localStorage.getItem("kavya_auth_token");
        return token ? { "Authorization": `Bearer ${token}` } : {};
    }

    async function apiJson(url, options) {
        const headers = Object.assign({ "Content-Type": "application/json" }, getAuthHeader());
        if (options && options.headers) Object.assign(headers, options.headers);

        const res = await fetch(url, Object.assign({}, options, { headers }));
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
        }
        if (res.status === 204) {
            return null;
        }
        return await res.json();
    }

    async function uploadFile(file) {
        if (!file) return "";
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch("https://pharma-backend-hxf9.onrender.com/api/uploads", {
                method: "POST",
                headers: getAuthHeader(),
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                return data.filename;
            }
        } catch (e) {
            console.error("Upload failed", e);
        }
        return file.name;
    }

    function loadFromLocalStorage() {
        try {
            return JSON.parse(localStorage.getItem("mr_expenses")) || [];
        } catch (e) {
            return [];
        }
    }

    function saveToLocalStorage() {
        localStorage.setItem("mr_expenses", JSON.stringify(expenseList));
    }

    async function loadExpenses() {
        try {
            const data = await apiJson(API_BASE);
            if (Array.isArray(data)) {
                return data;
            }
            return [];
        } catch (e) {
            console.warn("Failed to load MR expenses from API. Falling back to localStorage.", e);
            const local = loadFromLocalStorage();
            return local.length > 0 ? local : initialExpenses;
        }
    }

    function getStatusBadge(status) {
        switch (status) {
            case 'Approved':
                return '<span class="badge bg-success">Approved</span>';
            case 'Rejected':
                return '<span class="badge bg-danger">Rejected</span>';
            case 'Pending':
            default:
                return '<span class="badge bg-warning text-dark">Pending</span>';
        }
    }

    function getAttachmentLink(filename) {
        if (!filename) {
            return '<span class="text-muted small">No File</span>';
        }
        // Display only the file name
        return `<span class="small" style="max-width: 100px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${filename}">${filename}</span>`;
    }

    // --- RENDERING FUNCTIONS ---

    function renderPagination() {
        const totalPages = Math.ceil(expenseList.length / PAGE_SIZE);
        paginationUl.innerHTML = '';

        if (expenseList.length === 0) {
            paginationInfo.textContent = `Showing 0 to 0 of 0 entries`;
            return;
        }

        const infoText = `Showing ${Math.min(expenseList.length, (currentPage - 1) * PAGE_SIZE + 1)} to ${Math.min(currentPage * PAGE_SIZE, expenseList.length)} of ${expenseList.length} entries`;
        paginationInfo.textContent = infoText;


        if (totalPages <= 1) {
            return;
        }

        const createPageItem = (page, text, disabled = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${page === currentPage ? 'active' : ''} ${disabled ? 'disabled' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
            if (!disabled) {
                li.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (page !== currentPage) {
                        currentPage = page;
                        render();
                    }
                });
            }
            return li;
        };

        // Previous button
        paginationUl.appendChild(createPageItem(currentPage - 1, 'Previous', currentPage === 1));

        // Page number buttons
        for (let i = 1; i <= totalPages; i++) {
            paginationUl.appendChild(createPageItem(i, i));
        }

        // Next button
        paginationUl.appendChild(createPageItem(currentPage + 1, 'Next', currentPage === totalPages));

    }

    function render() {
        body.innerHTML = "";

        // Sort by date (most recent first) before paginating
        const sortedList = expenseList.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const pagedList = sortedList.slice(startIndex, startIndex + PAGE_SIZE);

        if (pagedList.length === 0 && currentPage > 1) {
            currentPage--;
            render();
            return;
        }

        if (expenseList.length === 0) {
            body.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No expenses logged yet. Click "Add Expense" to start.</td></tr>';
            renderPagination();
            return;
        }

        pagedList.forEach((e, index) => {
            // Calculate Sr. No. based on page and index
            const srNo = startIndex + index + 1;

            // Find the original index from the UNSORTED list for persistent ID reference
            const originalIndex = expenseList.findIndex(item => item.id === e.id);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${srNo}</td>
                <td>${new Date(e.date).toLocaleDateString('en-IN')}</td>
                <td>${e.category}</td>
                <td class="fw-bold">₹${e.amount.toFixed(2)}</td>
                <td>${getAttachmentLink(e.attachment)}</td>
                
                <td class="small" style="word-wrap: break-word; white-space: normal; max-width: 350px;" title="${e.desc}">
                    ${e.desc}
                </td>
                
                <td>${getStatusBadge(e.status)}</td>

                <td class="d-flex justify-content-start"> 
                    <button class="btn btn-sm btn-outline-primary me-1" data-index="${originalIndex}" data-bs-toggle="modal" data-bs-target="#editExpenseModal" title="Edit Expense">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${originalIndex})" title="Delete Expense">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            body.appendChild(row);
        });

        renderPagination();
    }

    // --- EVENT HANDLERS ---

    function validateAddInputs() {
        const amount = document.getElementById("expAmount").value;
        const date = document.getElementById("expDate").value;

        if (!document.getElementById("expCategory").value || !amount || !date || !document.getElementById("expDesc").value || parseFloat(amount) <= 0) {
            alert("Please fill in all required fields (Category, Amount, Date, Description) and ensure the Amount is valid.");
            return false;
        }
        return true;
    }

    // 1. Save new expense
    btnSave.addEventListener("click", () => {
        (async function () {
            if (!validateAddInputs()) {
                return;
            }

            const fileInput = document.getElementById("expAttachmentFile");
            const file = fileInput.files.length > 0 ? fileInput.files[0] : null;
            const attachmentName = await uploadFile(file);

            const newExp = {
                id: Date.now(),
                category: document.getElementById("expCategory").value,
                amount: parseFloat(document.getElementById("expAmount").value),
                date: document.getElementById("expDate").value,
                desc: document.getElementById("expDesc").value,
                attachment: attachmentName
            };

            try {
                const created = await apiJson(API_BASE, {
                    method: "POST",
                    body: JSON.stringify(newExp)
                });
                if (created) {
                    expenseList.push(created);
                }
            } catch (e) {
                console.warn("Expense create API failed. Falling back to localStorage.", e);
                expenseList.push({ ...newExp, status: "Pending" });
            }

            saveToLocalStorage();

            // Reset inputs and close modal
            document.getElementById("expCategory").value = document.getElementById("expCategory").options[0].value;
            document.getElementById("expAmount").value = '';
            document.getElementById("expDate").value = '';
            document.getElementById("expDesc").value = '';
            fileInput.value = '';

            addExpenseModal.hide();

            currentPage = 1;
            render();
            showToast("Expense submitted successfully!");
        })();
    });

    // 2. Delete
    window.deleteExpense = (i) => {
        if (confirm("Are you sure you want to delete this expense? This action cannot be undone.")) {
            (async function () {
                const exp = expenseList[i];
                try {
                    if (exp && exp.id != null) {
                        await apiJson(`${API_BASE}/${exp.id}`, { method: "DELETE" });
                    }
                } catch (e) {
                    console.warn("Expense delete API failed. Falling back to localStorage.", e);
                }

                expenseList.splice(i, 1);
                saveToLocalStorage();
                render();
                showToast("Expense deleted successfully!");
            })();
        }
    };

    // 3. Populate Edit Modal
    editExpenseModalEl.addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        const index = button.getAttribute('data-index');
        const expense = expenseList[index];

        document.getElementById("editExpenseModal").setAttribute('data-expense-index', index);

        document.getElementById("editCategory").value = expense.category;
        document.getElementById("editAmount").value = expense.amount;
        document.getElementById("editDate").value = expense.date;
        document.getElementById("editDesc").value = expense.desc;

        document.getElementById("editAttachmentFile").value = '';
    });

    function validateEditInputs() {
        const amount = document.getElementById("editAmount").value;
        const date = document.getElementById("editDate").value;

        if (!document.getElementById("editCategory").value || !amount || !date || !document.getElementById("editDesc").value || parseFloat(amount) <= 0) {
            alert("Please fill in all required fields (Category, Amount, Date, Description) and ensure the Amount is valid.");
            return false;
        }
        return true;
    }

    // 4. Update
    btnUpdate.addEventListener("click", () => {
        (async function () {
            if (!validateEditInputs()) {
                return;
            }

            const index = editExpenseModalEl.getAttribute('data-expense-index');
            const fileInput = document.getElementById("editAttachmentFile");
            const existingAttachment = expenseList[index].attachment;

            let newAttachmentName = existingAttachment;
            if (fileInput.files.length > 0) {
                newAttachmentName = await uploadFile(fileInput.files[0]);
            }

            const updated = {
                ...expenseList[index],
                category: document.getElementById("editCategory").value,
                amount: parseFloat(document.getElementById("editAmount").value),
                date: document.getElementById("editDate").value,
                desc: document.getElementById("editDesc").value,
                attachment: newAttachmentName,
                status: "Pending" // Reset status if expense is edited
            };

            try {
                const saved = await apiJson(`${API_BASE}/${updated.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        category: updated.category,
                        amount: updated.amount,
                        date: updated.date,
                        desc: updated.desc,
                        attachment: updated.attachment,
                        status: updated.status
                    })
                });
                expenseList[index] = saved || updated;
            } catch (e) {
                console.warn("Expense update API failed. Falling back to localStorage.", e);
                expenseList[index] = updated;
            }

            saveToLocalStorage();
            editExpenseModal.hide();
            render();
            showToast("Expense updated successfully!");
        })();
    });

    // --- INITIALIZATION ---
    expenseList = await loadExpenses();
    if (!Array.isArray(expenseList) || expenseList.length === 0) {
        expenseList = initialExpenses;
    }
    saveToLocalStorage();
    render();
});
