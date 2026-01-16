package com.kavyapharm.farmatrack.stockreceived.service;

import com.kavyapharm.farmatrack.mrstock.service.MrStockService;
import com.kavyapharm.farmatrack.stockreceived.dto.CreateStockReceivedEntryRequest;
import com.kavyapharm.farmatrack.stockreceived.dto.StockReceivedEntryResponse;
import com.kavyapharm.farmatrack.stockreceived.model.StockReceivedEntry;
import com.kavyapharm.farmatrack.stockreceived.repository.StockReceivedRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class StockReceivedService {

    private final StockReceivedRepository repository;
    private final MrStockService mrStockService;

    public StockReceivedService(StockReceivedRepository repository, MrStockService mrStockService) {
        this.repository = repository;
        this.mrStockService = mrStockService;
    }

    public List<StockReceivedEntryResponse> list(String productId) {
        ensureInitialized();
        if (productId != null && !productId.isBlank()) {
            return repository.findAllByProductId(productId).stream().map(StockReceivedService::toResponse).toList();
        }
        return repository.findAll(Sort.by(Sort.Direction.DESC, "date"))
                .stream().map(StockReceivedService::toResponse).toList();
    }

    @Transactional
    public StockReceivedEntryResponse create(CreateStockReceivedEntryRequest request) {
        ensureInitialized();
        StockReceivedEntry entry = new StockReceivedEntry();
        entry.setProductId(request.productId());
        entry.setQuantity(request.quantity());
        entry.setDate(request.date());
        entry.setNotes(request.notes());

        StockReceivedEntry saved = repository.save(entry);
        mrStockService.adjustStockOrThrow(request.productId(), request.quantity());

        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        if (!repository.existsById(id)) {
            return;
        }
        StockReceivedEntry entry = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Stock received entry not found"));

        Integer qty = entry.getQuantity() == null ? 0 : entry.getQuantity();
        if (qty > 0) {
            mrStockService.adjustStockOrThrow(entry.getProductId(), -qty);
        }
        repository.deleteById(id);
    }

    private void ensureInitialized() {
        if (repository.count() > 0) {
            return;
        }

        List<StockReceivedEntry> seed = List.of(
                seed("P001", 100, "2025-11-01T09:00:00.000Z", "Initial batch Q4"),
                seed("P002", 100, "2025-11-01T09:00:00.000Z", "Initial batch Q4"),
                seed("P003", 100, "2025-11-01T09:00:00.000Z", "Initial batch Q4"),
                seed("P004", 100, "2025-11-01T09:00:00.000Z", "Initial batch Q4")
        );
        repository.saveAll(seed);
    }

    private StockReceivedEntry seed(String productId, int quantity, String date, String notes) {
        StockReceivedEntry e = new StockReceivedEntry();
        e.setProductId(productId);
        e.setQuantity(quantity);
        e.setDate(date);
        e.setNotes(notes);
        return e;
    }

    public static StockReceivedEntryResponse toResponse(StockReceivedEntry entry) {
        return new StockReceivedEntryResponse(entry.getId(), entry.getProductId(), entry.getQuantity(), entry.getDate(), entry.getNotes());
    }
}
