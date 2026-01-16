package com.kavyapharm.farmatrack.notification.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record CreateNotificationRequest(
        @NotBlank(message = "Title is required") String title,
        @NotBlank(message = "Message is required") String message,
        @NotBlank(message = "Type is required") String type,
        LocalDate date,
        String status,
        String priority
) {
}
