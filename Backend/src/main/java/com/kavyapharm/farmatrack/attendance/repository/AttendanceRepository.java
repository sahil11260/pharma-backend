package com.kavyapharm.farmatrack.attendance.repository;

import com.kavyapharm.farmatrack.attendance.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    Optional<AttendanceRecord> findByDate(String date);
}
