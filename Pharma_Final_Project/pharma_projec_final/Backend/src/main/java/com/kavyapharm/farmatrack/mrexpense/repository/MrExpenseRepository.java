package com.kavyapharm.farmatrack.mrexpense.repository;

import com.kavyapharm.farmatrack.mrexpense.model.MrExpense;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MrExpenseRepository extends JpaRepository<MrExpense, Long> {
}
