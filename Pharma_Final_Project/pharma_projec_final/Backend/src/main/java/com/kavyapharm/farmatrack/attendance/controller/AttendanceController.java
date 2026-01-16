package com.kavyapharm.farmatrack.attendance.controller;

import com.kavyapharm.farmatrack.attendance.dto.AttendanceRecordResponse;
import com.kavyapharm.farmatrack.attendance.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public List<AttendanceRecordResponse> list() {
        return attendanceService.list();
    }

    @GetMapping("/today")
    public AttendanceRecordResponse getToday() {
        return attendanceService.getToday();
    }

    @PostMapping("/check-in")
    public AttendanceRecordResponse checkIn() {
        return attendanceService.checkIn();
    }

    @PostMapping("/check-out")
    public AttendanceRecordResponse checkOut() {
        return attendanceService.checkOut();
    }

    @PostMapping("/clear-today")
    public ResponseEntity<Void> clearToday() {
        attendanceService.clearToday();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        attendanceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
