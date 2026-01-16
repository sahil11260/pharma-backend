package com.kavyapharm.farmatrack.mrstock.dto;

public record MrStockItemResponse(
        String id,
        String name,
        Integer stock
) {
}
