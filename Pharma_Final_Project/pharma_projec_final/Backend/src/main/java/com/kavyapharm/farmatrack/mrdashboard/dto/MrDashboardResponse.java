package com.kavyapharm.farmatrack.mrdashboard.dto;

public record MrDashboardResponse(
        Double sales,
        Integer targetPercent,
        Integer visits,
        Double expensesPending,
        Double expensesApproved
) {
}
