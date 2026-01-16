package com.kavyapharm.farmatrack.stockreceived.dto;

public record StockReceivedEntryResponse(
        Long id,
        String productId,
        Integer quantity,
        String date,
        String notes
) {
}
