package com.kavyapharm.farmatrack.stockreceived.controller;

import com.kavyapharm.farmatrack.stockreceived.dto.CreateStockReceivedEntryRequest;
import com.kavyapharm.farmatrack.stockreceived.dto.StockReceivedEntryResponse;
import com.kavyapharm.farmatrack.stockreceived.service.StockReceivedService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-received")
public class StockReceivedController {

    private final StockReceivedService service;

    public StockReceivedController(StockReceivedService service) {
        this.service = service;
    }

    @GetMapping
    public List<StockReceivedEntryResponse> list(@RequestParam(required = false) String productId) {
        return service.list(productId);
    }

    @PostMapping
    public ResponseEntity<StockReceivedEntryResponse> create(@Valid @RequestBody CreateStockReceivedEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
