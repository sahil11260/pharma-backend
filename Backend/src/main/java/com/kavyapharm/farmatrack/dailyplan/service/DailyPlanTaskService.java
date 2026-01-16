package com.kavyapharm.farmatrack.dailyplan.service;

import com.kavyapharm.farmatrack.dailyplan.dto.DailyPlanTaskResponse;
import com.kavyapharm.farmatrack.dailyplan.dto.UpdateDailyPlanTaskStatusRequest;
import com.kavyapharm.farmatrack.dailyplan.model.DailyPlanTask;
import com.kavyapharm.farmatrack.dailyplan.repository.DailyPlanTaskRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class DailyPlanTaskService {

    private final DailyPlanTaskRepository repository;

    public DailyPlanTaskService(DailyPlanTaskRepository repository) {
        this.repository = repository;
    }

    public List<DailyPlanTaskResponse> list(String date) {
        ensureInitialized();
        if (date != null && !date.isBlank()) {
            return repository.findAllByDate(date).stream().map(DailyPlanTaskService::toResponse).toList();
        }
        return repository.findAll(Sort.by(Sort.Direction.ASC, "date").and(Sort.by(Sort.Direction.ASC, "id")))
                .stream().map(DailyPlanTaskService::toResponse).toList();
    }

    public DailyPlanTaskResponse updateStatus(Long id, UpdateDailyPlanTaskStatusRequest request) {
        Objects.requireNonNull(id, "id is required");
        ensureInitialized();
        DailyPlanTask task = getEntity(id);
        task.setStatus(request.status());
        return toResponse(repository.save(task));
    }

    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        if (!repository.existsById(id)) {
            return;
        }
        repository.deleteById(id);
    }

    private DailyPlanTask getEntity(Long id) {
        Objects.requireNonNull(id, "id is required");
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Daily plan task not found"));
    }

    private void ensureInitialized() {
        if (repository.count() > 0) {
            return;
        }

        String today = LocalDate.now().toString();
        String d1 = LocalDate.now().minusDays(1).toString();
        String d3 = LocalDate.now().minusDays(3).toString();
        String d7 = LocalDate.now().minusDays(7).toString();

        List<DailyPlanTask> seed = List.of(
                task(101L, "Doctor Visit", "Care Clinic", "Dr. Anjali Sharma", "Pending", today),
                task(103L, "Pramotion", "South Delhi Clinics", "Mr. R. K. Singh", "Pending", today),
                task(105L, "Other", "Office/Virtual", "Regional Meeting", "Pending", today),
                task(106L, "Doctor Visit", "City Medical", "Dr. Rohit Patel", "Pending", today),
                task(201L, "Doctor", "Westside Clinic", "Dr. Ben Carter", "Pending", d1),
                task(202L, "Meeting", "Main City Hosp.", "Dr. Jane Doe", "In Progress", d3),
                task(203L, "Doctor Visit", "Old Town Clinic", "Dr. Jane Doe", "Pending", d7)
        );
        repository.saveAll(seed);
    }

    private DailyPlanTask task(Long id, String type, String clinic, String doctor, String status, String date) {
        DailyPlanTask t = new DailyPlanTask();
        t.setId(id);
        t.setType(type);
        t.setClinic(clinic);
        t.setDoctor(doctor);
        t.setStatus(status);
        t.setDate(date);
        return t;
    }

    public static DailyPlanTaskResponse toResponse(DailyPlanTask task) {
        return new DailyPlanTaskResponse(task.getId(), task.getType(), task.getClinic(), task.getDoctor(), task.getStatus(), task.getDate());
    }
}
