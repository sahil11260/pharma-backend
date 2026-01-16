package com.kavyapharm.farmatrack.doctor.dto;

public record DoctorResponse(
        Long id,
        String name,
        String type,
        String specialty,
        String phone,
        String email,
        String clinicName,
        String address,
        String city,
        String assignedMR,
        String notes,
        String status
) {
}
