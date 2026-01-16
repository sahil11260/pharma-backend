package com.kavyapharm.farmatrack.region.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTerritoryRequest(
        @NotBlank(message = "Territory name is required") String name,
        @NotBlank(message = "Zone is required") String zone
) {
}
