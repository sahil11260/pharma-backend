package com.kavyapharm.farmatrack.attendance.dto;

public record AttendanceRecordResponse(
        Long id,
        String date,
        Long checkIn,
        Long checkOut,
        Integer totalMinutes
) {
}
