package com.kavyapharm.farmatrack.task.repository;

import com.kavyapharm.farmatrack.task.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
}
