package com.kavyapharm.farmatrack.target.controller;

import com.kavyapharm.farmatrack.target.dto.CreateTargetRequest;
import com.kavyapharm.farmatrack.target.dto.TargetResponse;
import com.kavyapharm.farmatrack.target.dto.UpdateTargetRequest;
import com.kavyapharm.farmatrack.target.service.TargetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/targets")
public class TargetController {

    private final TargetService targetService;

    public TargetController(TargetService targetService) {
        this.targetService = targetService;
    }

    @GetMapping
    public List<TargetResponse> list() {
        return targetService.list();
    }

    @GetMapping("/{id}")
    public TargetResponse get(@PathVariable Long id) {
        return targetService.get(id);
    }

    @PostMapping
    public ResponseEntity<TargetResponse> create(@Valid @RequestBody CreateTargetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(targetService.create(request));
    }

    @PutMapping("/{id}")
    public TargetResponse update(@PathVariable Long id, @Valid @RequestBody UpdateTargetRequest request) {
        return targetService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        targetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
