package com.kavyapharm.farmatrack.doctor.repository;

import com.kavyapharm.farmatrack.doctor.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
	Optional<Doctor> findByEmailIgnoreCase(String email);
}
