package com.kavyapharm.farmatrack.notification.dto;

import java.time.LocalDate;

public record NotificationResponse(
        String id,
        String title,
        String message,
        String type,
        LocalDate date,
        String status,
        String priority
) {
}
