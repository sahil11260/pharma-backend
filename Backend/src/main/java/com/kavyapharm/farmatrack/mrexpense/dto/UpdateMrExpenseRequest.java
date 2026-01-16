package com.kavyapharm.farmatrack.mrexpense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record UpdateMrExpenseRequest(
        @NotBlank(message = "Category is required") String category,
        @NotNull(message = "Amount is required") @Positive(message = "Amount must be > 0") Double amount,
        @NotBlank(message = "Date is required") String date,
        @NotBlank(message = "Description is required") String desc,
        String attachment,
        @NotBlank(message = "Status is required") String status
) {
}
