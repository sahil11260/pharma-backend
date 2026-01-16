package com.kavyapharm.farmatrack.dcr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record DcrSampleItemRequest(
        @NotBlank(message = "Product ID is required") String productId,
        @NotBlank(message = "Product name is required") String productName,
        @NotNull(message = "Quantity is required") @PositiveOrZero(message = "Quantity must be >= 0") Integer quantity
) {
}
