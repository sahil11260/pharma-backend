document.addEventListener("DOMContentLoaded", async () => {
    
    // --- MOCK DATA SETUP ---
    const API = {
        MR_STOCK: '/api/mr-stock',
        STOCK_RECEIVED: '/api/stock-received',
        DCRS: '/api/dcrs'
    };

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

    function loadLocalJson(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || null;
        } catch (e) {
            return null;
        }
    }

    // 3. Stock Received History (Used to calculate Total Received Stock)
    let stockReceivedHistory = loadLocalJson('stockReceivedHistory') || [
        { productId: 'P001', quantity: 100, date: '2025-11-01T09:00:00.000Z', notes: 'Initial batch Q4' },
        { productId: 'P002', quantity: 100, date: '2025-11-01T09:00:00.000Z', notes: 'Initial batch Q4' },
        { productId: 'P003', quantity: 100, date: '2025-11-01T09:00:00.000Z', notes: 'Initial batch Q4' },
        { productId: 'P004', quantity: 100, date: '2025-11-01T09:00:00.000Z', notes: 'Initial batch Q4' },
    ];
    
    // 2. DCR History (used to calculate Total Distributed Stock)
    let submittedDCRs = loadLocalJson('submittedDCRs') || [
        // Mock data demonstrating samples given
        { reportId: 1700000000004, doctorName: "Dr. Lisa Ray", clinicLocation: "Main City Hosp.", dateTime: "2025-11-27T10:00", remarks: "Handed over materials.", samplesGiven: [{productId: "P004", productName: "Sample Kit A", quantity: 3}] },
        { reportId: 1700000000003, doctorName: "Dr. Ben Carter", clinicLocation: "Westside Clinic", dateTime: "2025-11-26T16:00", remarks: "Enthusiastic about X.", samplesGiven: [{productId: "P001", productName: "Product X (500mg)", quantity: 10}, {productId: "P002", productName: "Product Y Syrup (100ml)", quantity: 5}] },
        { reportId: 1700000000002, doctorName: "Dr. Vikram Singh", clinicLocation: "Global Hospital", dateTime: "2025-11-26T14:00", remarks: "Requested a full sample kit.", samplesGiven: [{productId: "P004", productName: "Sample Kit A", quantity: 1}] },
        { reportId: 1700000000001, doctorName: "Dr. Anjali Sharma", clinicLocation: "Care Clinic", dateTime: "2025-11-25T10:30", remarks: "Needs more data.", samplesGiven: [{productId: "P001", productName: "Product X (500mg)", quantity: 5}] }
    ];


    // 1. Current Stock 
    // This value MUST be calculated based on the difference: Total Received - Total Distributed.
    // For simplicity and dynamic calculation, we will now rely ONLY on the functions,
    // and initialize this array with zero stock. The actual remaining stock displayed
    // will be the difference between received and distributed.
    let productsList = [
        { id: 'P001', name: 'Product X (500mg)' },
        { id: 'P002', name: 'Product Y Syrup (100ml)' },
        { id: 'P003', name: 'Product Z Cream' },
        { id: 'P004', name: 'Sample Kit A' },
    ];
    
    // In a real app, this list is often fetched separately. We'll use this list
    // and calculate the remaining stock dynamically during rendering.


    // --- ELEMENTS & MODALS ---
    const productStockTableBody = document.getElementById('productStockTableBody');
    const distributionModal = new bootstrap.Modal(document.getElementById('distributionModal'));
    const modalProductName = document.getElementById('modalProductName');
    const modalTotalDistributed = document.getElementById('modalTotalDistributed');
    const distributionDetailsTableBody = document.getElementById('distributionDetailsTableBody');


    // --- CALCULATION FUNCTIONS ---

    // Calculate the total quantity received for a product
    function calculateTotalReceived(productId) {
        return stockReceivedHistory
            .filter(item => item.productId === productId)
            .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }
    
    // Calculate the total quantity distributed (sold) for a product based on DCRs
    function calculateTotalDistributed(productId) {
        let distributed = 0;
        
        submittedDCRs.forEach(dcr => {
            if (!dcr || !Array.isArray(dcr.samplesGiven)) {
                return;
            }
            dcr.samplesGiven.forEach(s => {
                if (s && s.productId === productId) {
                    distributed += (Number(s.quantity) || 0);
                }
            });
        });
        
        return distributed;
    }
    
    // --- MAIN REPORT RENDERING FUNCTION ---

    function renderProductStockReport() {
        productStockTableBody.innerHTML = '';
        
        // Loop through the main product list
        productsList.forEach((product, index) => {
            const totalReceived = calculateTotalReceived(product.id);
            const totalDistributed = calculateTotalDistributed(product.id);
            // *** CRITICAL FIX: Calculate remaining stock as the difference ***
            const remainingStock = totalReceived - totalDistributed; 
            
            // Determine text color based on stock level (e.g., low if below 10)
            const stockClass = remainingStock <= 10 ? 'stock-low' : 'stock-ok'; 
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td><span class="fw-bold">${product.name}</span></td>
                <td class="text-center">${totalReceived}</td>
                <td class="text-center text-primary fw-bold">${totalDistributed}</td>
                <td class="text-center ${stockClass}">${remainingStock}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-info view-details-btn" data-id="${product.id}" data-name="${product.name}" data-bs-toggle="modal" data-bs-target="#distributionModal">
                        <i class="bi bi-eye"></i> View Details
                    </button>
                </td>
            `;
            
            productStockTableBody.appendChild(row);
        });
    }

    // --- MODAL RENDERING FUNCTION (Distribution Details) ---
    
    function populateDistributionModal(productId, productName) {
        // 1. Filter DCRs for the specific product distribution and map the data
        const distributionEntries = submittedDCRs
            .filter(dcr => dcr && Array.isArray(dcr.samplesGiven) && dcr.samplesGiven.some(s => s && s.productId === productId))
            .map(dcr => {
                const sample = dcr.samplesGiven.find(s => s && s.productId === productId);
                return {
                    quantity: sample ? (Number(sample.quantity) || 0) : 0,
                    doctorName: dcr.doctorName,
                    clinicLocation: dcr.clinicLocation,
                    dateTime: dcr.dateTime,
                    remarks: dcr.remarks
                };
            })
            // Sort by most recent DCR submission date
            .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
            
        // 2. Calculate totals and update modal header
        const totalDistributed = distributionEntries.reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0);
        modalProductName.textContent = productName;
        modalTotalDistributed.textContent = totalDistributed;
        
        distributionDetailsTableBody.innerHTML = '';
        
        // 3. Populate the detail table body
        if (distributionEntries.length === 0) {
            distributionDetailsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No distribution records found.</td></tr>';
            return;
        }

        distributionEntries.forEach(entry => {
            const formattedDate = new Date(entry.dateTime).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });

            const remarks = entry.remarks == null ? '' : String(entry.remarks);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td><span class="fw-bold">${entry.doctorName}</span><br><span class="small text-muted">${entry.clinicLocation}</span></td>
                <td class="text-center fw-bold text-primary">${entry.quantity}</td>
                <td class="small text-truncate">${remarks.substring(0, 50)}${remarks.length > 50 ? '...' : ''}</td>
            `;
            distributionDetailsTableBody.appendChild(row);
        });
    }

    // --- EVENT LISTENERS ---
    
    document.getElementById('distributionModal').addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        const productId = button.dataset.id;
        const productName = button.dataset.name;
        
        populateDistributionModal(productId, productName);
    });

    // --- EXECUTE INITIALIZATION ---

    async function loadProductsFromApiOrFallback() {
        try {
            const stockItems = await apiJson(API.MR_STOCK);
            if (Array.isArray(stockItems) && stockItems.length > 0) {
                return stockItems.map(p => ({ id: p.id, name: p.name }));
            }
            return productsList;
        } catch (e) {
            console.warn('Failed to load MR products from API. Falling back.', e);
            return productsList;
        }
    }

    async function loadStockReceivedFromApiOrFallback() {
        try {
            const received = await apiJson(API.STOCK_RECEIVED);
            if (Array.isArray(received)) {
                return received.map(r => ({
                    productId: r.productId,
                    quantity: Number(r.quantity) || 0,
                    date: r.date,
                    notes: r.notes
                }));
            }
            return stockReceivedHistory;
        } catch (e) {
            console.warn('Failed to load stock received history from API. Falling back.', e);
            return stockReceivedHistory;
        }
    }

    async function loadDcrsFromApiOrFallback() {
        try {
            const dcrs = await apiJson(API.DCRS);
            if (Array.isArray(dcrs)) {
                return dcrs;
            }
            return submittedDCRs;
        } catch (e) {
            console.warn('Failed to load DCRs from API. Falling back.', e);
            return submittedDCRs;
        }
    }

    productsList = await loadProductsFromApiOrFallback();
    stockReceivedHistory = await loadStockReceivedFromApiOrFallback();
    submittedDCRs = await loadDcrsFromApiOrFallback();

    // Save mock data for persistence across pages
    if (!localStorage.getItem('stockReceivedHistory')) {
         localStorage.setItem('stockReceivedHistory', JSON.stringify(stockReceivedHistory));
    }
    if (!localStorage.getItem('submittedDCRs')) {
         localStorage.setItem('submittedDCRs', JSON.stringify(submittedDCRs));
    }
    // Always keep localStorage in sync for fallback mode
    localStorage.setItem('stockReceivedHistory', JSON.stringify(stockReceivedHistory));
    localStorage.setItem('submittedDCRs', JSON.stringify(submittedDCRs));
    
    renderProductStockReport(); 
});