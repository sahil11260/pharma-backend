package com.kavyapharm.farmatrack.target.dto;

import java.time.LocalDate;

public record TargetResponse(
        Long id,
        String mrName,
        String period,
        Integer salesTarget,
        Integer salesAchievement,
        Integer visitsTarget,
        Integer visitsAchievement,
        LocalDate startDate,
        LocalDate endDate,
        Integer achievementPercentage,
        String status,
        LocalDate lastUpdated
) {
}
