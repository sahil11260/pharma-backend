document.addEventListener("DOMContentLoaded", () => {
    
    // --- MOCK DATA: Assigned Doctors for the MR ---
    const mockAssignedDoctors = [
        { 
            id: 1, 
            name: "Dr. Anjali Sharma", 
            clinic: "Care Clinic", 
            specialization: "General Physician", 
            City:"South Mumbai"
        },
        { 
            id: 2, 
            name: "Dr. Vikram Singh", 
            clinic: "Global Hospital", 
            specialization: "Cardiology", 
            City:"NAvi Mumbai"
            
        },
        { 
            id: 3, 
            name: "Dr. Rohit Patel", 
            clinic: "City Medical Center", 
            specialization: "Pediatrics", 
            City:"Thane"
             
        },
        { 
            id: 4, 
            name: "Dr. Evelyn Reed", 
            clinic: "Central Office Practice", 
            specialization: "Gastroenterology", 
            City:"Panvel"
        },
        { 
            id: 5, 
            name: "Dr. Ben Carter", 
            clinic: "Westside Clinic", 
            specialization: "Dermatology", 
            City:"Kurla"

        }
    ];

    // Elements
    const doctorListBody = document.getElementById("doctorListBody");
    const totalDoctorsCountEl = document.getElementById("totalDoctorsCount");

    // Initialize Doctors List (Using mock data directly for simplicity on this page)
    let assignedDoctors = mockAssignedDoctors;
    
    // --- RENDERING FUNCTION ---

    function renderDoctorList() {
        doctorListBody.innerHTML = ''; // Clear existing table rows

        if (assignedDoctors.length === 0) {
            doctorListBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted p-4">No doctors are currently assigned to your territory.</td></tr>`;
            totalDoctorsCountEl.textContent = 0;
            return;
        }

        assignedDoctors.forEach((doctor, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><span class="fw-bold text-primary">${doctor.name}</span></td>
                <td>${doctor.clinic}</td>
                <td>${doctor.specialization}</td>
                <td>${doctor.City}</td>

            `;

            doctorListBody.appendChild(row);
        });

        // Update the summary card
        totalDoctorsCountEl.textContent = assignedDoctors.length;
    }

    // Initial render
    renderDoctorList();
});