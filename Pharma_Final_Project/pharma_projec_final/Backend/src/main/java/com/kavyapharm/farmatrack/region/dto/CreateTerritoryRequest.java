package com.kavyapharm.farmatrack.region.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTerritoryRequest(
        @NotBlank(message = "Territory name is required") String name,
        @NotBlank(message = "Zone is required") String zone
) {
}
