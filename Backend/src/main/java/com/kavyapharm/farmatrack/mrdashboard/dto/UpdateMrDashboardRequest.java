package com.kavyapharm.farmatrack.mrdashboard.dto;

public record UpdateMrDashboardRequest(
        Double sales,
        Integer targetPercent,
        Integer visits,
        Double expensesPending,
        Double expensesApproved
) {
}
