package com.kavyapharm.farmatrack.region.controller;

import com.kavyapharm.farmatrack.region.dto.CreateTerritoryRequest;
import com.kavyapharm.farmatrack.region.dto.TerritoryResponse;
import com.kavyapharm.farmatrack.region.dto.UpdateTerritoryRequest;
import com.kavyapharm.farmatrack.region.service.TerritoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/territories")
public class TerritoryController {

    private final TerritoryService territoryService;

    public TerritoryController(TerritoryService territoryService) {
        this.territoryService = territoryService;
    }

    @GetMapping
    public List<TerritoryResponse> list() {
        return territoryService.list();
    }

    @GetMapping("/{id}")
    public TerritoryResponse get(@PathVariable Long id) {
        return territoryService.get(id);
    }

    @PostMapping
    public ResponseEntity<TerritoryResponse> create(@Valid @RequestBody CreateTerritoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(territoryService.create(request));
    }

    @PutMapping("/{id}")
    public TerritoryResponse update(@PathVariable Long id, @Valid @RequestBody UpdateTerritoryRequest request) {
        return territoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        territoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
