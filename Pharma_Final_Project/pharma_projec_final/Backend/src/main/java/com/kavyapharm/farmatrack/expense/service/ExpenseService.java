package com.kavyapharm.farmatrack.expense.service;

import com.kavyapharm.farmatrack.expense.dto.CreateExpenseRequest;
import com.kavyapharm.farmatrack.expense.dto.ExpenseResponse;
import com.kavyapharm.farmatrack.expense.dto.UpdateExpenseRequest;
import com.kavyapharm.farmatrack.expense.model.Expense;
import com.kavyapharm.farmatrack.expense.repository.ExpenseRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    public List<ExpenseResponse> list() {
        return expenseRepository.findAll(Sort.by(Sort.Direction.DESC, "submittedDate").and(Sort.by(Sort.Direction.DESC, "id")))
                .stream().map(ExpenseService::toResponse).toList();
    }

    public ExpenseResponse get(Long id) {
        Objects.requireNonNull(id, "id is required");
        return toResponse(getEntity(id));
    }

    public ExpenseResponse create(CreateExpenseRequest request) {
        LocalDate expenseDate = request.expenseDate() == null ? LocalDate.now() : request.expenseDate();

        Expense expense = new Expense();
        expense.setMrName(request.mrName());
        expense.setCategory(request.category());
        expense.setAmount(request.amount());
        expense.setDescription(request.description());
        expense.setStatus("pending");
        expense.setSubmittedDate(LocalDate.now());
        expense.setExpenseDate(expenseDate);
        expense.setAttachments(request.attachments() == null ? new ArrayList<>() : new ArrayList<>(request.attachments()));

        return toResponse(expenseRepository.save(expense));
    }

    public ExpenseResponse update(Long id, UpdateExpenseRequest request) {
        Expense expense = getEntity(id);

        expense.setMrName(request.mrName());
        expense.setCategory(request.category());
        expense.setAmount(request.amount());
        expense.setStatus(request.status());
        expense.setExpenseDate(request.expenseDate() == null ? expense.getExpenseDate() : request.expenseDate());
        expense.setDescription(request.description());
        expense.setApprovedBy(request.approvedBy());
        expense.setApprovedDate(request.approvedDate());
        expense.setRejectionReason(request.rejectionReason());

        expense.setAttachments(request.attachments() == null ? new ArrayList<>() : new ArrayList<>(request.attachments()));

        return toResponse(expenseRepository.save(expense));
    }

    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        if (!expenseRepository.existsById(id)) {
            return;
        }
        expenseRepository.deleteById(id);
    }

    private Expense getEntity(Long id) {
        Objects.requireNonNull(id, "id is required");
        return expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));
    }

    public static ExpenseResponse toResponse(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getMrName(),
                expense.getCategory(),
                expense.getAmount(),
                expense.getDescription(),
                expense.getStatus(),
                expense.getSubmittedDate(),
                expense.getExpenseDate(),
                expense.getAttachments(),
                expense.getApprovedBy(),
                expense.getApprovedDate(),
                expense.getRejectionReason()
        );
    }
}
