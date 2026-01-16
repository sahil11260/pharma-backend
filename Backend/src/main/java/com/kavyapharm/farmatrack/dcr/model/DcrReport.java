package com.kavyapharm.farmatrack.dcr.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "app_dcr")
public class DcrReport {

    @Id
    private Long reportId;

    @Column(nullable = false)
    private String visitTitle;

    @Column(nullable = false)
    private String visitType;

    @Column(nullable = false)
    private String doctorId;

    @Column(nullable = false)
    private String doctorName;

    @Column(nullable = false)
    private String clinicLocation;

    @Column(nullable = false)
    private String dateTime;

    @Column(nullable = false)
    private String rating;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @ElementCollection
    @CollectionTable(name = "app_dcr_sample_item", joinColumns = @JoinColumn(name = "report_id"))
    private List<DcrSampleItem> samplesGiven = new ArrayList<>();

    @Column(nullable = false)
    private String submissionTime;

    public DcrReport() {
    }

    public Long getReportId() {
        return reportId;
    }

    public void setReportId(Long reportId) {
        this.reportId = reportId;
    }

    public String getVisitTitle() {
        return visitTitle;
    }

    public void setVisitTitle(String visitTitle) {
        this.visitTitle = visitTitle;
    }

    public String getVisitType() {
        return visitType;
    }

    public void setVisitType(String visitType) {
        this.visitType = visitType;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getClinicLocation() {
        return clinicLocation;
    }

    public void setClinicLocation(String clinicLocation) {
        this.clinicLocation = clinicLocation;
    }

    public String getDateTime() {
        return dateTime;
    }

    public void setDateTime(String dateTime) {
        this.dateTime = dateTime;
    }

    public String getRating() {
        return rating;
    }

    public void setRating(String rating) {
        this.rating = rating;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public List<DcrSampleItem> getSamplesGiven() {
        return samplesGiven;
    }

    public void setSamplesGiven(List<DcrSampleItem> samplesGiven) {
        this.samplesGiven = samplesGiven;
    }

    public String getSubmissionTime() {
        return submissionTime;
    }

    public void setSubmissionTime(String submissionTime) {
        this.submissionTime = submissionTime;
    }
}
