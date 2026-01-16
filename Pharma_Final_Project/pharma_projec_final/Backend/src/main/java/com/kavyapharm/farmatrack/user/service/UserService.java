package com.kavyapharm.farmatrack.user.service;

import com.kavyapharm.farmatrack.user.dto.CreateUserRequest;
import com.kavyapharm.farmatrack.user.dto.UpdateUserRequest;
import com.kavyapharm.farmatrack.user.dto.UserResponse;
import com.kavyapharm.farmatrack.user.model.User;
import com.kavyapharm.farmatrack.user.model.UserRole;
import com.kavyapharm.farmatrack.user.model.UserStatus;
import com.kavyapharm.farmatrack.user.repository.UserRepository;
import com.kavyapharm.farmatrack.doctor.model.Doctor;
import com.kavyapharm.farmatrack.doctor.repository.DoctorRepository;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final DoctorRepository doctorRepository;

    public UserService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder, DoctorRepository doctorRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.doctorRepository = doctorRepository;
    }

    public List<UserResponse> list() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream().map(UserService::toResponse).toList();
    }

    public UserResponse get(Long id) {
        Objects.requireNonNull(id, "id is required");
        return toResponse(getEntity(id));
    }

    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        UserStatus status = request.status() == null ? UserStatus.ACTIVE : request.status();

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setPhone(request.phone());
        user.setTerritory(request.territory());
        user.setStatus(status);
        user.setAssignedManager(request.assignedManager());

        User saved = userRepository.save(user);

        // If the created user is a Doctor, create a matching Doctor entity so dashboard (which
        // reads /api/doctors) stays in sync with users created from the User Management UI.
        try {
            if (saved.getRole() == UserRole.DOCTOR) {
                // territory expected format from UI: Speciality|City|AssignedMR|DoctorType
                String territory = saved.getTerritory() == null ? "" : saved.getTerritory();
                String[] parts = territory.split("\\|");

                Doctor doctor = new Doctor();
                doctor.setName(saved.getName());
                doctor.setEmail(saved.getEmail());
                doctor.setType(parts.length > 3 ? parts[3] : "Doctor");
                doctor.setSpecialty(parts.length > 0 ? parts[0] : "");
                doctor.setPhone(saved.getPhone() == null ? "" : saved.getPhone());
                // clinicName is non-null in entity; use city or a placeholder
                doctor.setClinicName(parts.length > 1 && !parts[1].isBlank() ? parts[1] : "Clinic");
                doctor.setAddress("");
                doctor.setCity(parts.length > 1 ? parts[1] : "");
                doctor.setAssignedMR(parts.length > 2 ? parts[2] : "");
                doctor.setNotes("");
                doctor.setStatus(saved.getStatus() == null ? "ACTIVE" : String.valueOf(saved.getStatus()));

                doctorRepository.save(doctor);
            }
        } catch (Exception ignored) {
            // Do not fail user creation due to doctor-sync issues; log can be added if needed.
        }

        return toResponse(saved);
    }

    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = getEntity(id);

        user.setName(request.name());
        user.setRole(request.role());
        user.setPhone(request.phone());
        user.setTerritory(request.territory());
        user.setStatus(request.status());
        user.setAssignedManager(request.assignedManager());

        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        User saved = userRepository.save(user);

        // If updated user is a Doctor, ensure Doctor entity is created/updated to keep dashboard in sync
        try {
            if (saved.getRole() == UserRole.DOCTOR) {
                String territory = saved.getTerritory() == null ? "" : saved.getTerritory();
                String[] parts = territory.split("\\|");

                Doctor doctor = doctorRepository.findByEmailIgnoreCase(saved.getEmail())
                        .orElseGet(Doctor::new);

                doctor.setName(saved.getName());
                doctor.setEmail(saved.getEmail());
                doctor.setType(parts.length > 3 ? parts[3] : doctor.getType() != null ? doctor.getType() : "Doctor");
                doctor.setSpecialty(parts.length > 0 ? parts[0] : doctor.getSpecialty());
                doctor.setPhone(saved.getPhone() == null ? doctor.getPhone() : saved.getPhone());
                doctor.setClinicName(parts.length > 1 && !parts[1].isBlank() ? parts[1] : (doctor.getClinicName() == null ? "Clinic" : doctor.getClinicName()));
                doctor.setAddress(doctor.getAddress() == null ? "" : doctor.getAddress());
                doctor.setCity(parts.length > 1 ? parts[1] : doctor.getCity());
                doctor.setAssignedMR(parts.length > 2 ? parts[2] : doctor.getAssignedMR());
                doctor.setNotes(doctor.getNotes() == null ? "" : doctor.getNotes());
                doctor.setStatus(saved.getStatus() == null ? "ACTIVE" : String.valueOf(saved.getStatus()));

                doctorRepository.save(doctor);
            }
        } catch (Exception ignored) {
        }

        return toResponse(saved);
    }

    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        // Load the user first so we can sync related domain objects (e.g. Doctor) before deleting
        if (!userRepository.existsById(id)) {
            return;
        }

        User user = getEntity(id);

        try {
            if (user.getRole() == UserRole.DOCTOR) {
                // remove matching Doctor record so dashboard count decreases
                String email = user.getEmail();
                if (email != null && !email.isBlank()) {
                    doctorRepository.findByEmailIgnoreCase(email).ifPresent(d -> doctorRepository.deleteById(d.getId()));
                }
            }
        } catch (Exception ignored) {
            // Don't fail delete if doctor cleanup fails; log later if desired
        }

        userRepository.deleteById(id);
    }

    public User getByEmailOrThrow(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private User getEntity(Long id) {
        Objects.requireNonNull(id, "id is required");
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getPhone(),
                user.getTerritory(),
                user.getStatus(),
                user.getLastLogin(),
                user.getAssignedManager()
        );
    }
}
