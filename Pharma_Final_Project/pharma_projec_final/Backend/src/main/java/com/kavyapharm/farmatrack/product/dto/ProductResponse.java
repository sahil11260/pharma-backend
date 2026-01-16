package com.kavyapharm.farmatrack.product.dto;

public record ProductResponse(
        Long id,
        String name,
        String category,
        String price,
        Integer stock
) {
}
