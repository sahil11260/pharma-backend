package com.kavyapharm.farmatrack.dailyplan.controller;

import com.kavyapharm.farmatrack.dailyplan.dto.DailyPlanTaskResponse;
import com.kavyapharm.farmatrack.dailyplan.dto.UpdateDailyPlanTaskStatusRequest;
import com.kavyapharm.farmatrack.dailyplan.service.DailyPlanTaskService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/daily-plan/tasks")
public class DailyPlanTaskController {

    private final DailyPlanTaskService dailyPlanTaskService;

    public DailyPlanTaskController(DailyPlanTaskService dailyPlanTaskService) {
        this.dailyPlanTaskService = dailyPlanTaskService;
    }

    @GetMapping
    public List<DailyPlanTaskResponse> list(@RequestParam(required = false) String date) {
        return dailyPlanTaskService.list(date);
    }

    @PutMapping("/{id}/status")
    public DailyPlanTaskResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateDailyPlanTaskStatusRequest request) {
        return dailyPlanTaskService.updateStatus(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        dailyPlanTaskService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
