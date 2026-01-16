package com.kavyapharm.farmatrack.dcr.dto;

import java.util.List;

public record DcrResponse(
        Long reportId,
        String visitTitle,
        String visitType,
        String doctorId,
        String doctorName,
        String clinicLocation,
        String dateTime,
        String rating,
        String remarks,
        List<DcrSampleItemResponse> samplesGiven,
        String submissionTime
) {
}
