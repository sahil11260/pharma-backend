package com.kavyapharm.farmatrack.dcr.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record UpdateDcrRequest(
        @NotBlank(message = "Visit title is required") String visitTitle,
        @NotBlank(message = "Visit type is required") String visitType,
        @NotBlank(message = "Doctor ID is required") String doctorId,
        @NotBlank(message = "Doctor name is required") String doctorName,
        @NotBlank(message = "Clinic location is required") String clinicLocation,
        @NotBlank(message = "DateTime is required") String dateTime,
        @NotBlank(message = "Rating is required") String rating,
        String remarks,
        @Valid List<DcrSampleItemRequest> samplesGiven
) {
}
