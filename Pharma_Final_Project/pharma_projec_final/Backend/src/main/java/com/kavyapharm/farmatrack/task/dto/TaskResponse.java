package com.kavyapharm.farmatrack.task.dto;

import java.time.LocalDate;

public record TaskResponse(
        Long id,
        String title,
        String type,
        String assignedTo,
        String priority,
        String status,
        LocalDate dueDate,
        String location,
        String description,
        LocalDate createdDate
) {
}
