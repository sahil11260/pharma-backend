package com.kavyapharm.farmatrack.region.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateZoneRequest(
        @NotBlank(message = "Zone name is required") String name
) {
}
