package com.kavyapharm.farmatrack.expense.repository;

import com.kavyapharm.farmatrack.expense.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
}
