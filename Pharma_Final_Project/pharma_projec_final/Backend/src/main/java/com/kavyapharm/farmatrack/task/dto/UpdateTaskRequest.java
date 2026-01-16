package com.kavyapharm.farmatrack.task.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record UpdateTaskRequest(
        @NotBlank(message = "Title is required") String title,
        @NotBlank(message = "Type is required") String type,
        @NotBlank(message = "AssignedTo is required") String assignedTo,
        @NotBlank(message = "Priority is required") String priority,
        @NotBlank(message = "Status is required") String status,
        LocalDate dueDate,
        String location,
        String description
) {
}
