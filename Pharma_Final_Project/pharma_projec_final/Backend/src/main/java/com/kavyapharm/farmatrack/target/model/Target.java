package com.kavyapharm.farmatrack.target.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

 import java.time.LocalDate;

@Entity
@Table(name = "app_target")
public class Target {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String mrName;

    @Column(nullable = false)
    private String period;

    @Column(nullable = false)
    private Integer salesTarget;

    @Column(nullable = false)
    private Integer salesAchievement;

    @Column(nullable = false)
    private Integer visitsTarget;

    @Column(nullable = false)
    private Integer visitsAchievement;

    private LocalDate startDate;

    private LocalDate endDate;

    @Column(nullable = false)
    private Integer achievementPercentage;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private LocalDate lastUpdated;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMrName() { return mrName; }
    public void setMrName(String mrName) { this.mrName = mrName; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public Integer getSalesTarget() { return salesTarget; }
    public void setSalesTarget(Integer salesTarget) { this.salesTarget = salesTarget; }

    public Integer getSalesAchievement() { return salesAchievement; }
    public void setSalesAchievement(Integer salesAchievement) { this.salesAchievement = salesAchievement; }

    public Integer getVisitsTarget() { return visitsTarget; }
    public void setVisitsTarget(Integer visitsTarget) { this.visitsTarget = visitsTarget; }

    public Integer getVisitsAchievement() { return visitsAchievement; }
    public void setVisitsAchievement(Integer visitsAchievement) { this.visitsAchievement = visitsAchievement; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Integer getAchievementPercentage() { return achievementPercentage; }
    public void setAchievementPercentage(Integer achievementPercentage) { this.achievementPercentage = achievementPercentage; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDate lastUpdated) { this.lastUpdated = lastUpdated; }
}
