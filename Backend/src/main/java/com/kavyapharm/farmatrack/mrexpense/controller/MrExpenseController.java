package com.kavyapharm.farmatrack.mrexpense.controller;

import com.kavyapharm.farmatrack.mrexpense.dto.CreateMrExpenseRequest;
import com.kavyapharm.farmatrack.mrexpense.dto.MrExpenseResponse;
import com.kavyapharm.farmatrack.mrexpense.dto.UpdateMrExpenseRequest;
import com.kavyapharm.farmatrack.mrexpense.service.MrExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mr-expenses")
public class MrExpenseController {

    private final MrExpenseService service;

    public MrExpenseController(MrExpenseService service) {
        this.service = service;
    }

    @GetMapping
    public List<MrExpenseResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public MrExpenseResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<MrExpenseResponse> create(@Valid @RequestBody CreateMrExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public MrExpenseResponse update(@PathVariable Long id, @Valid @RequestBody UpdateMrExpenseRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
