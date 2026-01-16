package com.kavyapharm.farmatrack.doctor.service;

import com.kavyapharm.farmatrack.doctor.dto.CreateDoctorRequest;
import com.kavyapharm.farmatrack.doctor.dto.DoctorResponse;
import com.kavyapharm.farmatrack.doctor.dto.UpdateDoctorRequest;
import com.kavyapharm.farmatrack.doctor.model.Doctor;
import com.kavyapharm.farmatrack.doctor.repository.DoctorRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    public List<DoctorResponse> list() {
        return doctorRepository.findAll(Sort.by(Sort.Direction.ASC, "name").and(Sort.by(Sort.Direction.ASC, "id")))
                .stream().map(DoctorService::toResponse).toList();
    }

    public DoctorResponse get(Long id) {
        Objects.requireNonNull(id, "id is required");
        return toResponse(getEntity(id));
    }

    public DoctorResponse create(CreateDoctorRequest request) {
        Doctor doctor = new Doctor();
        doctor.setName(request.name());
        doctor.setType(request.type());
        doctor.setSpecialty(request.specialty());
        doctor.setPhone(request.phone());
        doctor.setEmail(request.email());
        doctor.setClinicName(request.clinicName());
        doctor.setAddress(request.address());
        doctor.setCity(request.city());
        doctor.setAssignedMR(request.assignedMR());
        doctor.setNotes(request.notes());
        doctor.setStatus(request.status());
        return toResponse(doctorRepository.save(doctor));
    }

    public DoctorResponse update(Long id, UpdateDoctorRequest request) {
        Objects.requireNonNull(id, "id is required");
        Doctor doctor = getEntity(id);
        doctor.setName(request.name());
        doctor.setType(request.type());
        doctor.setSpecialty(request.specialty());
        doctor.setPhone(request.phone());
        doctor.setEmail(request.email());
        doctor.setClinicName(request.clinicName());
        doctor.setAddress(request.address());
        doctor.setCity(request.city());
        doctor.setAssignedMR(request.assignedMR());
        doctor.setNotes(request.notes());
        doctor.setStatus(request.status());
        return toResponse(doctorRepository.save(doctor));
    }

    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        if (!doctorRepository.existsById(id)) {
            return;
        }
        doctorRepository.deleteById(id);
    }

    private Doctor getEntity(Long id) {
        Objects.requireNonNull(id, "id is required");
        return doctorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));
    }

    public static DoctorResponse toResponse(Doctor doctor) {
        return new DoctorResponse(
                doctor.getId(),
                doctor.getName(),
                doctor.getType(),
                doctor.getSpecialty(),
                doctor.getPhone(),
                doctor.getEmail(),
                doctor.getClinicName(),
                doctor.getAddress(),
                doctor.getCity(),
                doctor.getAssignedMR(),
                doctor.getNotes(),
                doctor.getStatus()
        );
    }
}

