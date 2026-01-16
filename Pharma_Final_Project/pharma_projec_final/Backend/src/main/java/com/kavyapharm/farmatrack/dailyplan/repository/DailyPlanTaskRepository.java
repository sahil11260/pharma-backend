package com.kavyapharm.farmatrack.dailyplan.repository;

import com.kavyapharm.farmatrack.dailyplan.model.DailyPlanTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DailyPlanTaskRepository extends JpaRepository<DailyPlanTask, Long> {
    List<DailyPlanTask> findAllByDate(String date);
}
