document.addEventListener("DOMContentLoaded", () => {
    
    // --- CONFIGURATION ---
    const PAGE_SIZE = 3;

    const API = {
        DCRS: '/api/dcrs',
        MR_STOCK: '/api/mr-stock'
    };

    let apiMode = true;

    async function apiJson(url, options) {
        const res = await fetch(url, Object.assign({
            headers: { 'Content-Type': 'application/json' }
        }, options || {}));
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
        }
        if (res.status === 204) {
            return null;
        }
        return await res.json();
    }
    
    // --- MOCK DATA ---
    const assignedDoctors = [
        { id: 101, name: "Dr. Anjali Sharma", clinic: "Care Clinic" },
        { id: 103, name: "Dr. Vikram Singh", clinic: "Global Hospital" },
        { id: 201, name: "Dr. Ben Carter", clinic: "Westside Clinic" },
        { id: 106, name: "Dr. Rohit Patel", clinic: "City Medical" },
        { id: 202, name: "Dr. Lisa Ray", clinic: "Main City Hosp." },
        { id: 301, name: "Dr. Sanjay Rao", clinic: "Apex Centre" },
        { id: 302, name: "Dr. Fatima Khan", clinic: "Health Plus" },
        { id: 303, name: "Dr. Kenji Tanaka", clinic: "East Clinic" },
        { id: 304, name: "Dr. Mia Lopez", clinic: "City General" },
        { id: 305, name: "Dr. Chris Lee", clinic: "Family Care" },
        { id: 306, name: "Dr. Nina George", clinic: "Star Health" },
    ];
    
    let mrStock = JSON.parse(localStorage.getItem('mrProductStock')) || [
        { id: 'P001', name: 'Product X (500mg)', stock: 100 },
        { id: 'P002', name: 'Product Y Syrup (100ml)', stock: 100 },
        { id: 'P003', name: 'Product Z Cream', stock: 100 },
        { id: 'P004', name: 'Sample Kit A', stock: 100 },
    ];

    // --- STATE MANAGEMENT ---
    let tempSamples = []; 
    let sampleEntryIdCounter = 1;
    let submittedDCRs = JSON.parse(localStorage.getItem('submittedDCRs')) || [];
    let currentPage = 1;

    // Ensure we have at least 4 mock entries for initial display if storage is empty
    if (submittedDCRs.length === 0) {
        submittedDCRs = [
            { reportId: 1700000000004, visitTitle: "Sample Kit Delivery", visitType: "Promotion", doctorId: "202", doctorName: "Dr. Lisa Ray", clinicLocation: "Main City Hosp.", dateTime: "2025-11-27T10:00", rating: "3", remarks: "Handed over marketing materials. Follow-up scheduled.", samplesGiven: [{productId: "P004", productName: "Sample Kit A", quantity: 3}], submissionTime: "2025-11-27T10:15:00.000Z" },
            { reportId: 1700000000003, visitTitle: "New Product Launch Detailing", visitType: "Doctor Visit", doctorId: "201", doctorName: "Dr. Ben Carter", clinicLocation: "Westside Clinic", dateTime: "2025-11-26T16:00", rating: "5", remarks: "Enthusiastic about X. Will prescribe immediately.", samplesGiven: [{productId: "P001", productName: "Product X (500mg)", quantity: 10}, {productId: "P002", productName: "Product Y Syrup (100ml)", quantity: 5}], submissionTime: "2025-11-26T16:15:00.000Z" },
            { reportId: 1700000000002, visitTitle: "Follow-up on Product Z", visitType: "Follow-up", doctorId: "103", doctorName: "Dr. Vikram Singh", clinicLocation: "Global Hospital", dateTime: "2025-11-26T14:00", rating: "4", remarks: "Very satisfied. Requested a full sample kit.", samplesGiven: [{productId: "P004", productName: "Sample Kit A", quantity: 1}], submissionTime: "2025-11-26T14:15:00.000Z" },
            { reportId: 1700000000001, visitTitle: "Initial Detailing of Product X", visitType: "Doctor Visit", doctorId: "101", doctorName: "Dr. Anjali Sharma", clinicLocation: "Care Clinic", dateTime: "2025-11-25T10:30", rating: "3", remarks: "Receptive but cautious. Needs more data.", samplesGiven: [{productId: "P001", productName: "Product X (500mg)", quantity: 5}], submissionTime: "2025-11-25T10:45:00.000Z" }
        ];
    }


    // --- ELEMENTS ---
    const dcrModal = new bootstrap.Modal(document.getElementById('dcrModal'));
    const dcrModalElement = document.getElementById('dcrModal');
    const dcrForm = document.getElementById('dcrForm');
    const dcrModalLabel = document.getElementById('dcrModalLabel');
    const reportIdField = document.getElementById('reportIdField');
    const doctorSelect = document.getElementById('doctorSelect');
    const clinicLocationInput = document.getElementById('clinicLocation');
    const sampleProductSelect = document.getElementById('sampleProductSelect');
    const sampleQuantityInput = document.getElementById('sampleQuantityInput');
    const addSampleBtn = document.getElementById('addSampleBtn');
    const samplesTableBody = document.getElementById('samplesTableBody');
    const submittedDCRTableBody = document.getElementById('submittedDCRTableBody');
    let dcrPaginationFooter = document.getElementById('dcrPaginationFooter');
    
    // Assuming you have a toast container structure ready in your HTML, let's target it
    // For this example, we'll assume the Toast structure is available and has the ID 'liveToast'
    const liveToastElement = document.getElementById('liveToast');
    let liveToast;
    if (liveToastElement) {
        liveToast = new bootstrap.Toast(liveToastElement);
    } else {
        console.warn("Bootstrap Toast element with ID 'liveToast' not found. Success message will be logged to console.");
    }


    // --- PERSISTENCE/STOCK FUNCTIONS ---

    function saveStock() {
        localStorage.setItem('mrProductStock', JSON.stringify(mrStock));
    }
    
    function saveDCRs() {
        localStorage.setItem('submittedDCRs', JSON.stringify(submittedDCRs));
    }

    async function refreshFromApiOrFallback() {
        try {
            const [stockItems, dcrs] = await Promise.all([
                apiJson(API.MR_STOCK),
                apiJson(API.DCRS)
            ]);

            if (Array.isArray(stockItems)) {
                mrStock = stockItems.map(p => ({ id: p.id, name: p.name, stock: Number(p.stock) || 0 }));
                saveStock();
            }
            if (Array.isArray(dcrs)) {
                submittedDCRs = dcrs;
                saveDCRs();
            }
            apiMode = true;
        } catch (e) {
            console.warn('Failed to load visit report data from API. Falling back to localStorage.', e);
            apiMode = false;
            // keep existing localStorage data
        }
    }
    
    function getProductStock(productId) {
        const product = mrStock.find(p => p.id === productId);
        let effectiveStock = product ? product.stock : 0;
        
        const committedQuantity = tempSamples
            .filter(s => s.productId === productId)
            .reduce((sum, s) => sum + s.quantity, 0);

        return effectiveStock - committedQuantity;
    }
    
    function updateStock(productId, quantityUsed) {
        const productIndex = mrStock.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            mrStock[productIndex].stock -= quantityUsed;
        }
    }
    
    // --- INITIALIZATION FUNCTIONS ---

    function populateDoctors() {
        doctorSelect.innerHTML = '<option value="">Select Doctor</option>'; 
        assignedDoctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = doctor.name;
            option.dataset.clinic = doctor.clinic; 
            doctorSelect.appendChild(option);
        });
    }

    function populateProductSelect(selectElement) {
        selectElement.innerHTML = '<option value="">Select Product</option>';
        
        mrStock.forEach(product => {
            const effectiveStock = getProductStock(product.id);
            
            if (product.stock > 0 || tempSamples.some(s => s.productId === product.id)) { 
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (Available: ${effectiveStock})`; 
                
                if (effectiveStock <= 0) {
                     option.disabled = true;
                }

                selectElement.appendChild(option);
            }
        });
    }

    // --- TEMPORARY SAMPLES TABLE MANAGEMENT (for the form) ---

    function renderSamplesTable() {
        samplesTableBody.innerHTML = '';
        
        if (tempSamples.length === 0) {
            samplesTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No samples added yet.</td></tr>';
        } else {
            tempSamples.forEach(sample => {
                const row = document.createElement('tr');
                row.dataset.id = sample.id;
                
                row.innerHTML = `
                    <td>${sample.productName}</td>
                    <td class="text-center">${sample.quantity}</td>
                    <td class="text-center">
                        <div class="btn-group action-btn-group">
                            <button type="button" class="btn btn-sm btn-outline-info edit-sample-btn" data-id="${sample.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger delete-sample-btn" data-id="${sample.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                samplesTableBody.appendChild(row);
            });
        }
        
        populateProductSelect(sampleProductSelect);
    }
    
    // --- PAGINATION & DCR TABLE MANAGEMENT ---

    function renderPaginationControls(totalRecords) {
        // Defensive: ensure footer exists
        if (!dcrPaginationFooter) {
            dcrPaginationFooter = document.getElementById('dcrPaginationFooter');
            if (!dcrPaginationFooter) {
                console.warn("Pagination footer element not found (#dcrPaginationFooter). Pagination won't render.");
                return;
            }
        }

        // Compute pages (ensure at least 1 page so UI renders consistently)
        const totalPages = Math.max(1, Math.ceil((totalRecords || 0) / PAGE_SIZE));

        // Debug: log values so you can inspect in browser console
        console.debug('[Pagination] totalRecords=', totalRecords, 'PAGE_SIZE=', PAGE_SIZE, 'totalPages=', totalPages, 'currentPage=', currentPage);

        // Clear the previous pagination control area
        dcrPaginationFooter.innerHTML = '';

        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Page navigation');
        
        const ul = document.createElement('ul');
        ul.className = 'pagination pagination-sm mb-0';
        ul.addEventListener('click', handlePaginationClick);

        // Previous Button
        ul.innerHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${Math.max(1, currentPage - 1)}">Previous</a>
            </li>
        `;

        // Page Numbers (smart windowing: show up to 7 page numbers centered on current)
        const maxPageButtons = 7;
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = startPage + maxPageButtons - 1;
        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        if (startPage > 1) {
            ul.innerHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="1">1</a>
                </li>
                <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
            `;
        }

        for (let i = startPage; i <= endPage; i++) {
            ul.innerHTML += `
                <li class="page-item ${currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            ul.innerHTML += `
                <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                </li>
            `;
        }

        // Next Button
        ul.innerHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${Math.min(totalPages, currentPage + 1)}">Next</a>
            </li>
        `;
        
        nav.appendChild(ul);
        // Append the controls wrapped in the <nav> element
        dcrPaginationFooter.appendChild(nav);
    }
    
    function handlePaginationClick(event) {
        const target = event.target.closest('a.page-link');
        if (!target) return;
        event.preventDefault();
        
        const page = parseInt(target.dataset.page);
        const totalPages = Math.max(1, Math.ceil(submittedDCRs.length / PAGE_SIZE));

        if (page >= 1 && page <= totalPages && page !== currentPage) {
            currentPage = page;
            renderSubmittedDCRTable();
        }
    }


    function renderSubmittedDCRTable() {
        submittedDCRs.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        
        // Pagination logic: Slice the array based on currentPage and PAGE_SIZE
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const recordsToDisplay = submittedDCRs.slice(startIndex, endIndex);

        submittedDCRTableBody.innerHTML = '';
        
        if (submittedDCRs.length === 0) {
            submittedDCRTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No DCRs have been submitted yet.</td></tr>';
            if (dcrPaginationFooter) dcrPaginationFooter.innerHTML = '';
            return;
        }

        if (recordsToDisplay.length === 0 && currentPage > 1) {
             // Handle case where last record of a page is deleted, move back one page
             currentPage--;
             renderSubmittedDCRTable();
             return;
        }
        
        recordsToDisplay.forEach(dcr => {
            const row = document.createElement('tr');
            row.dataset.id = dcr.reportId;
            
            // Product name rendering (no bolding)
            const samples = Array.isArray(dcr.samplesGiven) ? dcr.samplesGiven : [];
            const samplesSummary = samples.length > 0
                ? samples.map(s => {
                    const name = s && s.productName ? String(s.productName) : '';
                    const qty = s && s.quantity != null ? s.quantity : 0;
                    const base = name.includes('(') ? name.split('(')[0].trim() : name.trim();
                    return `${base} (${qty})`;
                }).join('<br>')
                : '—';
            
            const formattedDate = new Date(dcr.dateTime).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });
            
            const ratingText = `${dcr.rating} ⭐`;

            const remarks = dcr.remarks == null ? '' : String(dcr.remarks);

            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>
                    <span class="fw-bold">${dcr.doctorName}</span><br>
                    <span class="text-muted small">${dcr.clinicLocation}</span>
                </td>
                <td>${dcr.visitType}</td>
                <td class="text-center">${ratingText}</td>
                <td class="small">${samplesSummary}</td>
                <td class="small">${remarks.substring(0, 50)}${remarks.length > 50 ? '...' : ''}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-info edit-dcr-btn" data-id="${dcr.reportId}" data-bs-toggle="modal" data-bs-target="#dcrModal">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button type="button" class="btn btn-outline-danger delete-dcr-btn" data-id="${dcr.reportId}">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;

            submittedDCRTableBody.appendChild(row);
        });

        renderPaginationControls(submittedDCRs.length);
    }

    // Function to Reset the Form
    function resetFormState() {
        dcrForm.reset();
        dcrModalLabel.textContent = 'Add New Visit Report';
        reportIdField.value = '';
        tempSamples = [];
        renderSamplesTable();
        // Reset the 'Select Rating' to the default '3' for new entries
        document.getElementById('doctorRating').value = '3'; 
    }
    
    // Function to Load a DCR for Editing
    function loadDCRForEdit(reportId) {
        const dcr = submittedDCRs.find(d => d.reportId === reportId);
        if (!dcr) return;

        // 1. Set Modal Title and Hidden ID
        dcrModalLabel.textContent = `Edit Visit Report (ID: ${reportId})`;
        reportIdField.value = reportId;

        // 2. Populate Form Fields
        document.getElementById('visitTitle').value = dcr.visitTitle;
        document.getElementById('visitType').value = dcr.visitType;
        doctorSelect.value = dcr.doctorId;
        clinicLocationInput.value = dcr.clinicLocation;
        document.getElementById('visitDate').value = dcr.dateTime;
        document.getElementById('doctorRating').value = dcr.rating;
        document.getElementById('mrRemarks').value = dcr.remarks == null ? '' : dcr.remarks;

        // 3. Populate Temporary Samples Array
        const samples = Array.isArray(dcr.samplesGiven) ? dcr.samplesGiven : [];
        tempSamples = samples.map(s => ({
            ...s,
            id: sampleEntryIdCounter++, 
        }));

        // 4. Render Samples Table
        renderSamplesTable();
    }

    // Handle Modal Show Event (for Edit button)
    dcrModalElement.addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        if (button && button.classList.contains('edit-dcr-btn')) {
            const reportId = parseInt(button.dataset.id);
            loadDCRForEdit(reportId);
        } else {
            resetFormState();
        }
    });

    // Handle Modal Hide Event (cleanup)
    dcrModalElement.addEventListener('hidden.bs.modal', () => {
        // Clear temporary success message inside the modal
        const successMessage = document.getElementById('successMessage');
        if (successMessage) successMessage.classList.add('d-none');
    });


    // --- DCR ACTIONS (EDIT/DELETE) ---

    submittedDCRTableBody.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        
        const reportId = parseInt(target.dataset.id);

        if (target.classList.contains('delete-dcr-btn')) {
            if (!confirm("Are you sure you want to delete this submitted DCR? Stock will be refunded.")) return;
            
            const dcrIndex = submittedDCRs.findIndex(d => d.reportId === reportId);
            if (dcrIndex === -1) return;

            (async function () {
                if (apiMode) {
                    try {
                        await apiJson(`${API.DCRS}/${reportId}`, { method: 'DELETE' });
                        await refreshFromApiOrFallback();
                        currentPage = 1;
                        renderSubmittedDCRTable();
                        return;
                    } catch (e) {
                        console.warn('Delete DCR API failed. Falling back to localStorage.', e);
                        apiMode = false;
                    }
                }

                // Fallback: local stock refund + remove DCR
                const dcr = submittedDCRs[dcrIndex];
                const samples = Array.isArray(dcr.samplesGiven) ? dcr.samplesGiven : [];
                samples.forEach(item => {
                    const product = mrStock.find(p => p.id === item.productId);
                    if (product) {
                        product.stock += (Number(item.quantity) || 0);
                    }
                });

                submittedDCRs.splice(dcrIndex, 1);
                saveStock();
                saveDCRs();
                renderSubmittedDCRTable();
            })();
        } 
    });


    // --- SAMPLES ENTRY HANDLERS (inside modal) ---
    
    doctorSelect.addEventListener('change', () => {
        const selectedOption = doctorSelect.options[doctorSelect.selectedIndex];
        if (clinicLocationInput) {
            const clinic = selectedOption.dataset.clinic || '';
            clinicLocationInput.value = clinic;
        }
    });

    sampleProductSelect.addEventListener('change', () => {
        const productId = sampleProductSelect.value;
        const maxStock = getProductStock(productId); 
        
        sampleQuantityInput.value = '';
        if (productId) {
            sampleQuantityInput.setAttribute('max', maxStock);
            sampleQuantityInput.placeholder = `Qty (Max ${maxStock})`;
            sampleQuantityInput.disabled = (maxStock <= 0);
        } else {
            sampleQuantityInput.removeAttribute('max');
            sampleQuantityInput.placeholder = 'Quantity';
            sampleQuantityInput.disabled = false;
        }
    });

    addSampleBtn.addEventListener('click', () => {
        const productId = sampleProductSelect.value;
        const quantity = parseInt(sampleQuantityInput.value);
        const maxStock = getProductStock(productId);
        
        if (!productId || isNaN(quantity) || quantity <= 0) {
            alert("Please select a product and enter a positive quantity.");
            return;
        }
        
        if (quantity > maxStock) {
            alert(`Quantity exceeds available stock. Max available: ${maxStock}`);
            return;
        }

        const existingSample = tempSamples.find(s => s.productId === productId);
        const productName = mrStock.find(p => p.id === productId).name; 

        if (existingSample) {
            existingSample.quantity += quantity;
        } else {
            tempSamples.push({
                id: sampleEntryIdCounter++,
                productId: productId,
                productName: productName, 
                quantity: quantity
            });
        }
        
        renderSamplesTable();
        sampleProductSelect.value = '';
        sampleQuantityInput.value = '';
        sampleQuantityInput.removeAttribute('max');
        sampleQuantityInput.placeholder = 'Quantity';
        sampleQuantityInput.disabled = false;
    });

    samplesTableBody.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        
        const sampleId = parseInt(target.dataset.id);
        const sampleIndex = tempSamples.findIndex(s => s.id === sampleId);
        if (sampleIndex === -1) return;

        if (target.classList.contains('delete-sample-btn')) {
            tempSamples.splice(sampleIndex, 1);
            renderSamplesTable();
        } else if (target.classList.contains('edit-sample-btn')) {
            const sample = tempSamples[sampleIndex];
            const max = getProductStock(sample.productId) + sample.quantity; 
            
            let newQuantity = prompt(`Enter new quantity for ${sample.productName} (Max: ${max}):`, sample.quantity);
            
            if (newQuantity !== null) {
                newQuantity = parseInt(newQuantity);
                if (isNaN(newQuantity) || newQuantity < 0) {
                    alert("Invalid quantity. Must be a non-negative number.");
                    return;
                }
                if (newQuantity > max) {
                    alert(`Quantity exceeds max available stock: ${max}`);
                    return;
                }
                
                sample.quantity = newQuantity;
                if (sample.quantity === 0) {
                    tempSamples.splice(sampleIndex, 1);
                }
                renderSamplesTable();
            }
        }
    });


    // --- FORM SUBMISSION (Add/Edit Logic) ---
    dcrForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const isEditing = reportIdField.value !== '';
        const reportId = isEditing ? parseInt(reportIdField.value) : Date.now();
        
        if (tempSamples.length === 0 && !confirm("No samples added. Submit report anyway?")) {
            return;
        }

        const newReportData = {
            reportId: reportId,
            visitTitle: document.getElementById('visitTitle').value.trim(),
            visitType: document.getElementById('visitType').value,
            doctorId: doctorSelect.value,
            doctorName: doctorSelect.options[doctorSelect.selectedIndex].text,
            clinicLocation: clinicLocationInput.value.trim(),
            dateTime: document.getElementById('visitDate').value,
            rating: document.getElementById('doctorRating').value,
            remarks: document.getElementById('mrRemarks').value.trim(),
            samplesGiven: tempSamples.map(s => ({
                productId: s.productId,
                productName: s.productName,
                quantity: s.quantity
            })),
            submissionTime: new Date().toISOString()
        };

        (async function () {
            if (apiMode) {
                try {
                    const payload = {
                        visitTitle: newReportData.visitTitle,
                        visitType: newReportData.visitType,
                        doctorId: newReportData.doctorId,
                        doctorName: newReportData.doctorName,
                        clinicLocation: newReportData.clinicLocation,
                        dateTime: newReportData.dateTime,
                        rating: newReportData.rating,
                        remarks: newReportData.remarks,
                        samplesGiven: newReportData.samplesGiven
                    };

                    if (isEditing) {
                        await apiJson(`${API.DCRS}/${reportId}`, { method: 'PUT', body: JSON.stringify(payload) });
                    } else {
                        await apiJson(API.DCRS, { method: 'POST', body: JSON.stringify(payload) });
                        currentPage = 1; // Always go to the first page for new entry
                    }

                    await refreshFromApiOrFallback();
                    // Hide modal
                    dcrModal.hide();

                    // Show Toast Notification
                    if (liveToast) {
                        // Update toast body content (requires you to add this element to your HTML)
                        document.getElementById('toastBody').textContent = `Your DCR submitted successfully for ${newReportData.doctorName}.`;
                        liveToast.show();
                    } else {
                        console.log(`✅ Success: Your DCR submitted successfully for ${newReportData.doctorName}.`);
                    }

                    renderSubmittedDCRTable();
                    return;
                } catch (e) {
                    console.warn('DCR submit API failed. Falling back to localStorage.', e);
                    apiMode = false;
                }
            }

            // Fallback mode: preserve existing local behavior with local stock updates
            if (isEditing) {
                // EDIT LOGIC
                const oldDCRIndex = submittedDCRs.findIndex(d => d.reportId === reportId);
                if (oldDCRIndex === -1) return;

                const oldDCR = submittedDCRs[oldDCRIndex];
                const oldSamples = Array.isArray(oldDCR.samplesGiven) ? oldDCR.samplesGiven : [];
                const newSamples = Array.isArray(newReportData.samplesGiven) ? newReportData.samplesGiven : [];
                
                // 1. Refund Old Stock
                oldSamples.forEach(item => {
                    const product = mrStock.find(p => p.id === item.productId);
                    if (product) {
                        product.stock += (Number(item.quantity) || 0);
                    }
                });
                
                // 2. Re-deduct New Stock
                newSamples.forEach(item => {
                    updateStock(item.productId, item.quantity);
                });
                
                // 3. Update the DCR in the array
                submittedDCRs[oldDCRIndex] = newReportData;

            } else {
                // ADD LOGIC
                // 1. Deduct Stock
                newReportData.samplesGiven.forEach(item => {
                    updateStock(item.productId, item.quantity);
                });
                // 2. Add to Submitted DCRs
                submittedDCRs.unshift(newReportData); // Add to the top
                currentPage = 1; // Always go to the first page for new entry
            }

            // --- FINAL COMMIT & UI UPDATE ---
            saveStock();
            saveDCRs();
            
            // Hide modal
            dcrModal.hide();

            // Show Toast Notification
            if (liveToast) {
                // Update toast body content (requires you to add this element to your HTML)
                document.getElementById('toastBody').textContent = `Your DCR submitted successfully for ${newReportData.doctorName}.`;
                liveToast.show();
            } else {
                console.log(`✅ Success: Your DCR submitted successfully for ${newReportData.doctorName}.`);
            }
            
            // Refresh table with pagination
            renderSubmittedDCRTable();
        })();
    });


    // --- EXECUTE INITIALIZATION ---
    if (!localStorage.getItem('mrProductStock')) {
        saveStock();
    }
    populateDoctors();
    (async function () {
        await refreshFromApiOrFallback();
        renderSubmittedDCRTable();
        populateProductSelect(sampleProductSelect);
    })();
});
