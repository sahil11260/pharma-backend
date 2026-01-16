package com.kavyapharm.farmatrack.expense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

public record CreateExpenseRequest(
        @NotBlank(message = "MR name is required") String mrName,
        @NotBlank(message = "Category is required") String category,
        @NotNull(message = "Amount is required") @Positive(message = "Amount must be positive") Double amount,
        LocalDate expenseDate,
        String description,
        List<String> attachments
) {
}
