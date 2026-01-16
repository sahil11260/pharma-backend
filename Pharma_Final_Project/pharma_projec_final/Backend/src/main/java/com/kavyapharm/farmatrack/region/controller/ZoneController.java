package com.kavyapharm.farmatrack.region.controller;

import com.kavyapharm.farmatrack.region.dto.CreateZoneRequest;
import com.kavyapharm.farmatrack.region.dto.UpdateZoneRequest;
import com.kavyapharm.farmatrack.region.dto.ZoneResponse;
import com.kavyapharm.farmatrack.region.service.ZoneService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    private final ZoneService zoneService;

    public ZoneController(ZoneService zoneService) {
        this.zoneService = zoneService;
    }

    @GetMapping
    public List<ZoneResponse> list() {
        return zoneService.list();
    }

    @GetMapping("/{id}")
    public ZoneResponse get(@PathVariable Long id) {
        return zoneService.get(id);
    }

    @PostMapping
    public ResponseEntity<ZoneResponse> create(@Valid @RequestBody CreateZoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(zoneService.create(request));
    }

    @PutMapping("/{id}")
    public ZoneResponse update(@PathVariable Long id, @Valid @RequestBody UpdateZoneRequest request) {
        return zoneService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        zoneService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
