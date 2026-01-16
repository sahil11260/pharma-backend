package com.kavyapharm.farmatrack.stockreceived.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateStockReceivedEntryRequest(
        @NotBlank(message = "Product ID is required") String productId,
        @NotNull(message = "Quantity is required") @Positive(message = "Quantity must be > 0") Integer quantity,
        @NotBlank(message = "Date is required") String date,
        String notes
) {
}
