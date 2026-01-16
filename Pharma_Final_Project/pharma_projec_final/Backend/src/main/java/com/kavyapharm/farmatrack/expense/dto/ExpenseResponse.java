package com.kavyapharm.farmatrack.expense.dto;

import java.time.LocalDate;
import java.util.List;

public record ExpenseResponse(
        Long id,
        String mrName,
        String category,
        Double amount,
        String description,
        String status,
        LocalDate submittedDate,
        LocalDate expenseDate,
        List<String> attachments,
        String approvedBy,
        LocalDate approvedDate,
        String rejectionReason
) {
}
