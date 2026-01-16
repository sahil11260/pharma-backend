package com.kavyapharm.farmatrack.dcr.controller;

import com.kavyapharm.farmatrack.dcr.dto.CreateDcrRequest;
import com.kavyapharm.farmatrack.dcr.dto.DcrResponse;
import com.kavyapharm.farmatrack.dcr.dto.UpdateDcrRequest;
import com.kavyapharm.farmatrack.dcr.service.DcrService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dcrs")
public class DcrController {

    private final DcrService dcrService;

    public DcrController(DcrService dcrService) {
        this.dcrService = dcrService;
    }

    @GetMapping
    public List<DcrResponse> list() {
        return dcrService.list();
    }

    @GetMapping("/{reportId}")
    public DcrResponse get(@PathVariable Long reportId) {
        return dcrService.get(reportId);
    }

    @PostMapping
    public ResponseEntity<DcrResponse> create(@Valid @RequestBody CreateDcrRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dcrService.create(request));
    }

    @PutMapping("/{reportId}")
    public DcrResponse update(@PathVariable Long reportId, @Valid @RequestBody UpdateDcrRequest request) {
        return dcrService.update(reportId, request);
    }

    @DeleteMapping("/{reportId}")
    public ResponseEntity<Void> delete(@PathVariable Long reportId) {
        dcrService.delete(reportId);
        return ResponseEntity.noContent().build();
    }
}
