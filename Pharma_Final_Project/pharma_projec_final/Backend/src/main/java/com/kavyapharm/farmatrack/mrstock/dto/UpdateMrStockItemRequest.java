package com.kavyapharm.farmatrack.mrstock.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateMrStockItemRequest(
        @NotBlank(message = "Name is required") String name,
        @NotNull(message = "Stock is required") @PositiveOrZero(message = "Stock must be >= 0") Integer stock
) {
}
