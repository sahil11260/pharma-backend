package com.kavyapharm.farmatrack.dailyplan.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateDailyPlanTaskStatusRequest(
        @NotBlank(message = "Status is required") String status
) {
}
