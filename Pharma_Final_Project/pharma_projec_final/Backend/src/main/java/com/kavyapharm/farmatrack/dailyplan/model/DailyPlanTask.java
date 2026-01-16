package com.kavyapharm.farmatrack.dailyplan.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_daily_plan_task")
public class DailyPlanTask {

    @Id
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String clinic;

    @Column(nullable = false)
    private String doctor;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String date;

    public DailyPlanTask() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getClinic() {
        return clinic;
    }

    public void setClinic(String clinic) {
        this.clinic = clinic;
    }

    public String getDoctor() {
        return doctor;
    }

    public void setDoctor(String doctor) {
        this.doctor = doctor;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }
}
