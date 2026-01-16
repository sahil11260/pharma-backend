package com.kavyapharm.farmatrack.mrdashboard.service;

import com.kavyapharm.farmatrack.mrdashboard.dto.MrDashboardResponse;
import com.kavyapharm.farmatrack.mrdashboard.dto.UpdateMrDashboardRequest;
import com.kavyapharm.farmatrack.mrdashboard.model.MrDashboard;
import com.kavyapharm.farmatrack.mrdashboard.repository.MrDashboardRepository;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class MrDashboardService {

    private static final long SINGLETON_ID = 1L;

    private final MrDashboardRepository repository;

    public MrDashboardService(MrDashboardRepository repository) {
        this.repository = repository;
    }

    public MrDashboardResponse get() {
        ensureInitialized();
        return toResponse(getEntity());
    }

    public MrDashboardResponse update(UpdateMrDashboardRequest request) {
        ensureInitialized();
        MrDashboard dashboard = getEntity();

        if (request.sales() != null) {
            dashboard.setSales(request.sales());
        }
        if (request.targetPercent() != null) {
            dashboard.setTargetPercent(request.targetPercent());
        }
        if (request.visits() != null) {
            dashboard.setVisits(request.visits());
        }
        if (request.expensesPending() != null) {
            dashboard.setExpensesPending(request.expensesPending());
        }
        if (request.expensesApproved() != null) {
            dashboard.setExpensesApproved(request.expensesApproved());
        }

        return toResponse(repository.save(Objects.requireNonNull(dashboard, "dashboard is required")));
    }

    private void ensureInitialized() {
        if (repository.existsById(SINGLETON_ID)) {
            return;
        }

        MrDashboard d = new MrDashboard();
        d.setId(SINGLETON_ID);
        d.setSales(85000.0);
        d.setTargetPercent(72);
        d.setVisits(18);
        d.setExpensesPending(2500.0);
        d.setExpensesApproved(9200.0);

        repository.save(d);
    }

    private MrDashboard getEntity() {
        return repository.findById(SINGLETON_ID)
                .orElseThrow(() -> new IllegalArgumentException("MR dashboard not found"));
    }

    public static MrDashboardResponse toResponse(MrDashboard dashboard) {
        return new MrDashboardResponse(
                dashboard.getSales(),
                dashboard.getTargetPercent(),
                dashboard.getVisits(),
                dashboard.getExpensesPending(),
                dashboard.getExpensesApproved()
        );
    }
}
