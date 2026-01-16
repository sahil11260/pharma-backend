document.addEventListener("DOMContentLoaded", () => {

    // --- MOCK DATA: Product Targets (Quantities/Units) ---
    const productTargetsData = [
        {
            id: 1,
            product: "Pain Relief Tablets (P-Max)",
            type: "Monthly",
            target: 5000,
            achieved: 4850,
            assignedDate: "2025-11-01", // New Data Field
            remark: "On track for month end." // New Data Field
        },
        {
            id: 2,
            product: "Vitamin C Supplements (Vita-Boost)",
            type: "Weekly",
            target: 1200,
            achieved: 1150,
            assignedDate: "2025-11-25",
            remark: ""
        },
        {
            id: 3,
            product: "Cough Syrup (Kof-Soothe)",
            type: "Quarterly",
            target: 15000,
            achieved: 9500,
            assignedDate: "2025-10-01",
            remark: "Needs strong push in December."
        },
        {
            id: 4,
            product: "Antibiotic (Clarith-A)",
            type: "Monthly",
            target: 3500,
            achieved: 3600,
            assignedDate: "2025-11-05",
            remark: "Exceeded target!"
        },
        {
            id: 5,
            product: "Fever Reducer (Temp-Down)",
            type: "Weekly",
            target: 800,
            achieved: 300, // Reduced achieved amount for 'Poor' example
            assignedDate: "2025-11-27",
            remark: "Facing stock shortage."
        }
    ];

    // --- MOCK DATA: Doctor Visit Targets (Visits) ---
    const visitTargetsData = [
        {
            id: 1,
            category: "Total Daily Calls",
            type: "Daily",
            target: 10,
            achieved: 10,
            assignedDate: "2025-11-27", // New Data Field
            remark: "" // New Data Field
        },
        {
            id: 2,
            category: "High-Value (A-Class) Visits",
            type: "Weekly",
            target: 5,
            achieved: 5,
            assignedDate: "2025-11-24",
            remark: "Completed all A-class calls."
        },
        {
            id: 3,
            category: "New Doctor Registrations",
            type: "Monthly",
            target: 20,
            achieved: 14,
            assignedDate: "2025-11-01",
            remark: ""
        },
        {
            id: 4,
            category: "Hospital Visits",
            type: "Monthly",
            target: 15,
            achieved: 18,
            assignedDate: "2025-11-01",
            remark: "Over-achieved target."
        },
    ];
    // --- END MOCK DATA ---

    // --- ELEMENTS ---
    const productBody = document.getElementById("salesTargetTableBody");
    const doctorVisitBody = document.getElementById("doctorVisitTargetBody");

    // --- HELPER FUNCTIONS ---

    function getAchievementStatus(percentage) {
        let status = '';
        let colorClass = '';

        if (percentage >= 100) {
            status = 'Completed';
            colorClass = 'bg-success';
        } else if (percentage >= 90) {
            status = 'Outstanding';
            colorClass = 'bg-info';
        } else if (percentage >= 70) {
            status = 'Average';
            colorClass = 'bg-warning text-dark';
        } else {
            status = 'Poor';
            colorClass = 'bg-danger';
        }

        return `<span class="badge ${colorClass}">${status}</span>`;
    }

    function calculateAndRenderProducts() {
        productBody.innerHTML = "";
        
        productTargetsData.forEach((item, index) => {
            const achievementPercentage = ((item.achieved / item.target) * 100).toFixed(1);
            const statusBadge = getAchievementStatus(parseFloat(achievementPercentage));
            
            const row = document.createElement('tr');
            
            // Highlight successful achievement in green
            const percentageColor = (parseFloat(achievementPercentage) >= 100) ? 'text-success fw-bold' : '';

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${new Date(item.assignedDate).toLocaleDateString('en-IN')}</td>
                <td class="fw-medium">${item.product}</td>
                <td><span class="badge bg-secondary">${item.type}</span></td>
                <td>${item.target.toLocaleString()}</td>
                <td>${item.achieved.toLocaleString()}</td>
                <td class="${percentageColor}">${achievementPercentage}%</td>
                <td>${statusBadge}</td>
                <td class="small text-muted">${item.remark || '-'}</td>
            `;
            productBody.appendChild(row);
        });

        if (productTargetsData.length === 0) {
            productBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No product targets defined yet.</td></tr>';
        }
    }

    function calculateAndRenderVisits() {
        doctorVisitBody.innerHTML = "";
        
        visitTargetsData.forEach((item, index) => {
            const achievementPercentage = ((item.achieved / item.target) * 100).toFixed(1);
            const statusBadge = getAchievementStatus(parseFloat(achievementPercentage));
            
            const row = document.createElement('tr');
            
            // Highlight successful achievement in green
            const percentageColor = (parseFloat(achievementPercentage) >= 100) ? 'text-success fw-bold' : '';

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${new Date(item.assignedDate).toLocaleDateString('en-IN')}</td>
                <td class="fw-medium">${item.category}</td>
                <td><span class="badge bg-primary">${item.type}</span></td>
                <td>${item.target.toLocaleString()}</td>
                <td>${item.achieved.toLocaleString()}</td>
                <td class="${percentageColor}">${achievementPercentage}%</td>
                <td>${statusBadge}</td>
                <td class="small text-muted">${item.remark || '-'}</td>
            `;
            doctorVisitBody.appendChild(row);
        });

        if (visitTargetsData.length === 0) {
            doctorVisitBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No doctor visit targets defined yet.</td></tr>';
        }
    }

    // --- INITIALIZATION ---
    calculateAndRenderProducts();
    calculateAndRenderVisits();
});
