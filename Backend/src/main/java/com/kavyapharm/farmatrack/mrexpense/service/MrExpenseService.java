package com.kavyapharm.farmatrack.mrexpense.service;

import com.kavyapharm.farmatrack.mrexpense.dto.CreateMrExpenseRequest;
import com.kavyapharm.farmatrack.mrexpense.dto.MrExpenseResponse;
import com.kavyapharm.farmatrack.mrexpense.dto.UpdateMrExpenseRequest;
import com.kavyapharm.farmatrack.mrexpense.model.MrExpense;
import com.kavyapharm.farmatrack.mrexpense.repository.MrExpenseRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class MrExpenseService {

    private final MrExpenseRepository repository;

    public MrExpenseService(MrExpenseRepository repository) {
        this.repository = repository;
    }

    public List<MrExpenseResponse> list() {
        ensureInitialized();
        return repository.findAll(Sort.by(Sort.Direction.DESC, "date").and(Sort.by(Sort.Direction.DESC, "id")))
                .stream().map(MrExpenseService::toResponse).toList();
    }

    public MrExpenseResponse get(Long id) {
        Objects.requireNonNull(id, "id is required");
        ensureInitialized();
        return toResponse(getEntity(id));
    }

    public MrExpenseResponse create(CreateMrExpenseRequest request) {
        ensureInitialized();
        long id = request.id() == null ? System.currentTimeMillis() : request.id();
        if (repository.existsById(id)) {
            id = System.currentTimeMillis();
        }

        MrExpense expense = new MrExpense();
        expense.setId(id);
        expense.setCategory(request.category());
        expense.setAmount(request.amount());
        expense.setDate(request.date());
        expense.setDesc(request.desc());
        expense.setAttachment(request.attachment());
        expense.setStatus("Pending");

        return toResponse(repository.save(expense));
    }

    public MrExpenseResponse update(Long id, UpdateMrExpenseRequest request) {
        Objects.requireNonNull(id, "id is required");
        ensureInitialized();
        MrExpense expense = getEntity(id);

        expense.setCategory(request.category());
        expense.setAmount(request.amount());
        expense.setDate(request.date());
        expense.setDesc(request.desc());
        expense.setAttachment(request.attachment());
        expense.setStatus(request.status());

        return toResponse(repository.save(expense));
    }

    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        if (!repository.existsById(id)) {
            return;
        }
        repository.deleteById(id);
    }

    private MrExpense getEntity(Long id) {
        Objects.requireNonNull(id, "id is required");
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("MR expense not found"));
    }

    private void ensureInitialized() {
        if (repository.count() > 0) {
            return;
        }

        List<MrExpense> seed = List.of(
                seed(1700000001L, "Travel", 750.50, "2025-11-25", "Local conveyance for client meetings in Zone A and surrounding areas for three days, covering 150 km. This is a detailed note to test wrapping.", "cab_receipt_25Nov.pdf", "Approved"),
                seed(1700000002L, "Meals", 350.00, "2025-11-26", "Lunch with Dr. Sharma to discuss new product launch and distribution strategy.", "lunch_bill_26Nov.jpg", "Pending"),
                seed(1700000003L, "Accommodation", 4500.00, "2025-11-24", "One night stay for out-of-city visit to meet regional doctors and hospitals.", "hotel_receipt_24Nov.pdf", "Rejected"),
                seed(1700000004L, "Samples", 1200.00, "2025-11-23", "Courier charges for dispatching new product samples to five different clinics.", "courier_slip_23Nov.png", "Approved"),
                seed(1700000005L, "Other", 200.00, "2025-11-22", "Printing material for doctor presentations and informational flyers.", "print_bill_22Nov.pdf", "Pending"),
                seed(1700000006L, "Travel", 50.00, "2025-11-21", "Bus fare for office trip to regional head quarters.", "bus_ticket.jpg", "Pending"),
                seed(1700000007L, "Meals", 850.00, "2025-11-20", "Dinner meeting with hospital staff to build rapport.", "dinner_receipt_20.pdf", "Approved")
        );
        repository.saveAll(seed);
    }

    private MrExpense seed(Long id, String category, Double amount, String date, String desc, String attachment, String status) {
        MrExpense e = new MrExpense();
        e.setId(id);
        e.setCategory(category);
        e.setAmount(amount);
        e.setDate(date);
        e.setDesc(desc);
        e.setAttachment(attachment);
        e.setStatus(status);
        return e;
    }

    public static MrExpenseResponse toResponse(MrExpense expense) {
        return new MrExpenseResponse(
                expense.getId(),
                expense.getCategory(),
                expense.getAmount(),
                expense.getDate(),
                expense.getDesc(),
                expense.getAttachment(),
                expense.getStatus()
        );
    }
}
