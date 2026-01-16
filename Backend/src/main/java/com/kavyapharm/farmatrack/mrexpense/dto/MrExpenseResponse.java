package com.kavyapharm.farmatrack.mrexpense.dto;

public record MrExpenseResponse(
        Long id,
        String category,
        Double amount,
        String date,
        String desc,
        String attachment,
        String status
) {
}
