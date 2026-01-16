package com.kavyapharm.farmatrack.attendance.service;

import com.kavyapharm.farmatrack.attendance.dto.AttendanceRecordResponse;
import com.kavyapharm.farmatrack.attendance.model.AttendanceRecord;
import com.kavyapharm.farmatrack.attendance.repository.AttendanceRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;

    public AttendanceService(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    public List<AttendanceRecordResponse> list() {
        return attendanceRepository.findAll(Sort.by(Sort.Direction.DESC, "date"))
                .stream().map(AttendanceService::toResponse).toList();
    }

    public AttendanceRecordResponse getToday() {
        String today = LocalDate.now().toString();
        return attendanceRepository.findByDate(today)
                .map(AttendanceService::toResponse)
                .orElseGet(() -> new AttendanceRecordResponse(null, today, null, null, 0));
    }

    public AttendanceRecordResponse checkIn() {
        String today = LocalDate.now().toString();
        AttendanceRecord record = attendanceRepository.findByDate(today).orElseGet(() -> {
            AttendanceRecord r = new AttendanceRecord();
            r.setDate(today);
            r.setTotalMinutes(0);
            return r;
        });

        if (record.getCheckIn() != null && record.getCheckOut() == null) {
            return toResponse(attendanceRepository.save(record));
        }

        long now = Instant.now().toEpochMilli();
        record.setCheckIn(now);
        record.setCheckOut(null);
        record.setTotalMinutes(0);
        return toResponse(attendanceRepository.save(record));
    }

    public AttendanceRecordResponse checkOut() {
        String today = LocalDate.now().toString();
        AttendanceRecord record = attendanceRepository.findByDate(today)
                .orElseThrow(() -> new IllegalArgumentException("No check-in found for today"));

        if (record.getCheckIn() == null) {
            throw new IllegalArgumentException("No check-in found for today");
        }
        if (record.getCheckOut() != null) {
            return toResponse(attendanceRepository.save(record));
        }

        long now = Instant.now().toEpochMilli();
        record.setCheckOut(now);

        long start = record.getCheckIn();
        long diffMs = Math.max(0, now - start);
        int totalMinutes = (int) (diffMs / 60000);
        record.setTotalMinutes(totalMinutes);

        return toResponse(attendanceRepository.save(record));
    }

    public void clearToday() {
        String today = LocalDate.now().toString();
        attendanceRepository.findByDate(today).ifPresent(r -> {
            Long id = r.getId();
            if (id != null) {
                attendanceRepository.deleteById(id);
            }
        });
    }

    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        if (!attendanceRepository.existsById(id)) {
            return;
        }
        attendanceRepository.deleteById(id);
    }

    public static AttendanceRecordResponse toResponse(AttendanceRecord record) {
        Integer minutes = record.getTotalMinutes() == null ? 0 : record.getTotalMinutes();
        return new AttendanceRecordResponse(
                record.getId(),
                record.getDate(),
                record.getCheckIn(),
                record.getCheckOut(),
                minutes
        );
    }

    public static String toDateKey(Long ts) {
        if (ts == null) {
            return null;
        }
        return Instant.ofEpochMilli(ts).atZone(ZoneId.systemDefault()).toLocalDate().toString();
    }
}
