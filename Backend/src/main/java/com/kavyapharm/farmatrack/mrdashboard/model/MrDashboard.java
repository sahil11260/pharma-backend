package com.kavyapharm.farmatrack.mrdashboard.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_mr_dashboard")
public class MrDashboard {

    @Id
    private Long id;

    @Column(nullable = false)
    private Double sales;

    @Column(nullable = false)
    private Integer targetPercent;

    @Column(nullable = false)
    private Integer visits;

    @Column(nullable = false)
    private Double expensesPending;

    @Column(nullable = false)
    private Double expensesApproved;

    public MrDashboard() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getSales() {
        return sales;
    }

    public void setSales(Double sales) {
        this.sales = sales;
    }

    public Integer getTargetPercent() {
        return targetPercent;
    }

    public void setTargetPercent(Integer targetPercent) {
        this.targetPercent = targetPercent;
    }

    public Integer getVisits() {
        return visits;
    }

    public void setVisits(Integer visits) {
        this.visits = visits;
    }

    public Double getExpensesPending() {
        return expensesPending;
    }

    public void setExpensesPending(Double expensesPending) {
        this.expensesPending = expensesPending;
    }

    public Double getExpensesApproved() {
        return expensesApproved;
    }

    public void setExpensesApproved(Double expensesApproved) {
        this.expensesApproved = expensesApproved;
    }
}
