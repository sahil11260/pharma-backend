package com.kavyapharm.farmatrack.region.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateZoneRequest(
        @NotBlank(message = "Zone name is required") String name
) {
}
