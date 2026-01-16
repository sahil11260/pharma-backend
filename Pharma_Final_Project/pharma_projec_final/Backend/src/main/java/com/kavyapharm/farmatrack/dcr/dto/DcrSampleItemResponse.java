package com.kavyapharm.farmatrack.dcr.dto;

public record DcrSampleItemResponse(
        String productId,
        String productName,
        Integer quantity
) {
}
