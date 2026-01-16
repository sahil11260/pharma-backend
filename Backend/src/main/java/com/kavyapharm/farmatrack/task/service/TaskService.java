package com.kavyapharm.farmatrack.task.service;

import com.kavyapharm.farmatrack.task.dto.CreateTaskRequest;
import com.kavyapharm.farmatrack.task.dto.TaskResponse;
import com.kavyapharm.farmatrack.task.dto.UpdateTaskRequest;
import com.kavyapharm.farmatrack.task.model.Task;
import com.kavyapharm.farmatrack.task.repository.TaskRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<TaskResponse> list() {
        return taskRepository.findAll(Sort.by(Sort.Direction.DESC, "createdDate").and(Sort.by(Sort.Direction.DESC, "id")))
                .stream().map(TaskService::toResponse).toList();
    }

    public TaskResponse get(Long id) {
        Objects.requireNonNull(id, "id is required");
        return toResponse(getEntity(id));
    }

    public TaskResponse create(CreateTaskRequest request) {
        Task task = new Task();
        task.setTitle(request.title());
        task.setType(request.type());
        task.setAssignedTo(request.assignedTo());
        task.setPriority(request.priority());
        task.setStatus("pending");
        task.setDueDate(request.dueDate());
        task.setLocation(request.location());
        task.setDescription(request.description());
        task.setCreatedDate(LocalDate.now());

        return toResponse(taskRepository.save(task));
    }

    public TaskResponse update(Long id, UpdateTaskRequest request) {
        Objects.requireNonNull(id, "id is required");
        Task task = getEntity(id);

        task.setTitle(request.title());
        task.setType(request.type());
        task.setAssignedTo(request.assignedTo());
        task.setPriority(request.priority());
        task.setStatus(request.status());
        task.setDueDate(request.dueDate());
        task.setLocation(request.location());
        task.setDescription(request.description());

        return toResponse(taskRepository.save(task));
    }

    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        if (!taskRepository.existsById(id)) {
            return;
        }
        taskRepository.deleteById(id);
    }

    private Task getEntity(Long id) {
        Objects.requireNonNull(id, "id is required");
        return taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
    }

    public static TaskResponse toResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getType(),
                task.getAssignedTo(),
                task.getPriority(),
                task.getStatus(),
                task.getDueDate(),
                task.getLocation(),
                task.getDescription(),
                task.getCreatedDate()
        );
    }
}
