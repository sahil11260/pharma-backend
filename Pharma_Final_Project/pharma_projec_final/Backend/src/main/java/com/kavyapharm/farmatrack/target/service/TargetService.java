package com.kavyapharm.farmatrack.target.service;

import com.kavyapharm.farmatrack.target.dto.CreateTargetRequest;
import com.kavyapharm.farmatrack.target.dto.TargetResponse;
import com.kavyapharm.farmatrack.target.dto.UpdateTargetRequest;
import com.kavyapharm.farmatrack.target.model.Target;
import com.kavyapharm.farmatrack.target.repository.TargetRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class TargetService {

    private final TargetRepository targetRepository;

    public TargetService(TargetRepository targetRepository) {
        this.targetRepository = targetRepository;
    }

    public List<TargetResponse> list() {
        return targetRepository.findAll(Sort.by(Sort.Direction.DESC, "lastUpdated").and(Sort.by(Sort.Direction.DESC, "id")))
                .stream().map(TargetService::toResponse).toList();
    }

    public TargetResponse get(Long id) {
        Objects.requireNonNull(id, "id is required");
        return toResponse(getEntity(id));
    }

    public TargetResponse create(CreateTargetRequest request) {
        Target target = new Target();
        target.setMrName(request.mrName());
        target.setPeriod(request.period());
        target.setSalesTarget(request.salesTarget());
        target.setSalesAchievement(0);
        target.setVisitsTarget(request.visitsTarget());
        target.setVisitsAchievement(0);
        target.setStartDate(request.startDate());
        target.setEndDate(request.endDate());
        target.setAchievementPercentage(0);
        target.setStatus("poor");
        target.setLastUpdated(LocalDate.now());

        return toResponse(targetRepository.save(target));
    }

    public TargetResponse update(Long id, UpdateTargetRequest request) {
        Objects.requireNonNull(id, "id is required");
        Target target = getEntity(id);

        target.setMrName(request.mrName());
        target.setPeriod(request.period());
        target.setSalesTarget(request.salesTarget());
        target.setSalesAchievement(request.salesAchievement());
        target.setVisitsTarget(request.visitsTarget());
        target.setVisitsAchievement(request.visitsAchievement());
        target.setStartDate(request.startDate());
        target.setEndDate(request.endDate());
        target.setAchievementPercentage(calculateAchievementPercentage(request.salesTarget(), request.salesAchievement()));
        target.setStatus(request.status());
        target.setLastUpdated(LocalDate.now());

        return toResponse(targetRepository.save(target));
    }

    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        if (!targetRepository.existsById(id)) {
            return;
        }
        targetRepository.deleteById(id);
    }

    private Target getEntity(Long id) {
        Objects.requireNonNull(id, "id is required");
        return targetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Target not found"));
    }

    private static int calculateAchievementPercentage(Integer salesTarget, Integer salesAchievement) {
        int target = salesTarget == null ? 0 : salesTarget;
        int achievement = salesAchievement == null ? 0 : salesAchievement;
        if (target <= 0) {
            return 0;
        }
        return (int) Math.round((achievement * 100.0) / target);
    }

    public static TargetResponse toResponse(Target target) {
        return new TargetResponse(
                target.getId(),
                target.getMrName(),
                target.getPeriod(),
                target.getSalesTarget(),
                target.getSalesAchievement(),
                target.getVisitsTarget(),
                target.getVisitsAchievement(),
                target.getStartDate(),
                target.getEndDate(),
                target.getAchievementPercentage(),
                target.getStatus(),
                target.getLastUpdated()
        );
    }
}
