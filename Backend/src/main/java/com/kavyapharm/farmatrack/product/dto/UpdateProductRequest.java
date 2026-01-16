package com.kavyapharm.farmatrack.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateProductRequest(
        @NotBlank(message = "Name is required") String name,
        @NotBlank(message = "Category is required") String category,
        @NotBlank(message = "Price is required") String price,
        @NotNull(message = "Stock is required") @PositiveOrZero(message = "Stock must be >= 0") Integer stock
) {
}
