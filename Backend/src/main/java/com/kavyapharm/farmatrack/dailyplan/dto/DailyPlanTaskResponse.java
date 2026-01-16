package com.kavyapharm.farmatrack.dailyplan.dto;

public record DailyPlanTaskResponse(
        Long id,
        String type,
        String clinic,
        String doctor,
        String status,
        String date
) {
}
