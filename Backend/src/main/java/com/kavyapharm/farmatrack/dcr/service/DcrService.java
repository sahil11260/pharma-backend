package com.kavyapharm.farmatrack.dcr.service;

import com.kavyapharm.farmatrack.dcr.dto.CreateDcrRequest;
import com.kavyapharm.farmatrack.dcr.dto.DcrResponse;
import com.kavyapharm.farmatrack.dcr.dto.DcrSampleItemRequest;
import com.kavyapharm.farmatrack.dcr.dto.DcrSampleItemResponse;
import com.kavyapharm.farmatrack.dcr.dto.UpdateDcrRequest;
import com.kavyapharm.farmatrack.dcr.model.DcrReport;
import com.kavyapharm.farmatrack.dcr.model.DcrSampleItem;
import com.kavyapharm.farmatrack.dcr.repository.DcrRepository;
import com.kavyapharm.farmatrack.mrstock.service.MrStockService;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class DcrService {

    private final DcrRepository dcrRepository;
    private final MrStockService mrStockService;

    public DcrService(DcrRepository dcrRepository, MrStockService mrStockService) {
        this.dcrRepository = dcrRepository;
        this.mrStockService = mrStockService;
    }

    public List<DcrResponse> list() {
        return dcrRepository.findAll(Sort.by(Sort.Direction.DESC, "reportId"))
                .stream().map(DcrService::toResponse).toList();
    }

    public DcrResponse get(Long reportId) {
        Objects.requireNonNull(reportId, "reportId is required");
        return toResponse(getEntity(reportId));
    }

    @Transactional
    public DcrResponse create(CreateDcrRequest request) {
        long reportId = System.currentTimeMillis();

        DcrReport report = new DcrReport();
        report.setReportId(reportId);
        applyFields(report, request.visitTitle(), request.visitType(), request.doctorId(), request.doctorName(), request.clinicLocation(), request.dateTime(), request.rating(), request.remarks(), request.samplesGiven());
        report.setSubmissionTime(Instant.now().toString());

        deductStock(report.getSamplesGiven());

        return toResponse(dcrRepository.save(report));
    }

    @Transactional
    public DcrResponse update(Long reportId, UpdateDcrRequest request) {
        Objects.requireNonNull(reportId, "reportId is required");
        DcrReport existing = getEntity(reportId);

        refundStock(existing.getSamplesGiven());

        applyFields(existing, request.visitTitle(), request.visitType(), request.doctorId(), request.doctorName(), request.clinicLocation(), request.dateTime(), request.rating(), request.remarks(), request.samplesGiven());
        existing.setSubmissionTime(Instant.now().toString());

        deductStock(existing.getSamplesGiven());

        return toResponse(dcrRepository.save(existing));
    }

    @Transactional
    public void delete(Long reportId) {
        Objects.requireNonNull(reportId, "reportId is required");
        if (!dcrRepository.existsById(reportId)) {
            return;
        }

        DcrReport existing = getEntity(reportId);
        refundStock(existing.getSamplesGiven());
        dcrRepository.deleteById(reportId);
    }

    private void refundStock(List<DcrSampleItem> items) {
        if (items == null) {
            return;
        }
        for (DcrSampleItem item : items) {
            if (item == null || item.getQuantity() == null) {
                continue;
            }
            int qty = item.getQuantity();
            if (qty <= 0) {
                continue;
            }
            mrStockService.adjustStockOrThrow(item.getProductId(), qty);
        }
    }

    private void deductStock(List<DcrSampleItem> items) {
        if (items == null) {
            return;
        }
        for (DcrSampleItem item : items) {
            if (item == null || item.getQuantity() == null) {
                continue;
            }
            int qty = item.getQuantity();
            if (qty <= 0) {
                continue;
            }
            mrStockService.adjustStockOrThrow(item.getProductId(), -qty);
        }
    }

    private void applyFields(
            DcrReport report,
            String visitTitle,
            String visitType,
            String doctorId,
            String doctorName,
            String clinicLocation,
            String dateTime,
            String rating,
            String remarks,
            List<DcrSampleItemRequest> samplesGiven
    ) {
        report.setVisitTitle(visitTitle);
        report.setVisitType(visitType);
        report.setDoctorId(doctorId);
        report.setDoctorName(doctorName);
        report.setClinicLocation(clinicLocation);
        report.setDateTime(dateTime);
        report.setRating(rating);
        report.setRemarks(remarks);

        List<DcrSampleItem> mapped = new ArrayList<>();
        if (samplesGiven != null) {
            for (DcrSampleItemRequest req : samplesGiven) {
                if (req == null) {
                    continue;
                }
                DcrSampleItem item = new DcrSampleItem();
                item.setProductId(req.productId());
                item.setProductName(req.productName());
                item.setQuantity(req.quantity() == null ? 0 : req.quantity());
                mapped.add(item);
            }
        }
        report.setSamplesGiven(mapped);
    }

    private DcrReport getEntity(Long reportId) {
        Objects.requireNonNull(reportId, "reportId is required");
        return dcrRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("DCR not found"));
    }

    public static DcrResponse toResponse(DcrReport report) {
        List<DcrSampleItemResponse> samples = report.getSamplesGiven() == null
                ? List.of()
                : report.getSamplesGiven().stream().filter(Objects::nonNull).map(i -> new DcrSampleItemResponse(i.getProductId(), i.getProductName(), i.getQuantity())).toList();

        return new DcrResponse(
                report.getReportId(),
                report.getVisitTitle(),
                report.getVisitType(),
                report.getDoctorId(),
                report.getDoctorName(),
                report.getClinicLocation(),
                report.getDateTime(),
                report.getRating(),
                report.getRemarks(),
                samples,
                report.getSubmissionTime()
        );
    }
}
