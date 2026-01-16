package com.kavyapharm.farmatrack.mrstock.service;

import com.kavyapharm.farmatrack.mrstock.dto.MrStockItemResponse;
import com.kavyapharm.farmatrack.mrstock.dto.UpdateMrStockItemRequest;
import com.kavyapharm.farmatrack.mrstock.model.MrStockItem;
import com.kavyapharm.farmatrack.mrstock.repository.MrStockRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class MrStockService {

    private final MrStockRepository mrStockRepository;

    public MrStockService(MrStockRepository mrStockRepository) {
        this.mrStockRepository = mrStockRepository;
    }

    public List<MrStockItemResponse> list() {
        ensureInitialized();
        return mrStockRepository.findAll(Sort.by(Sort.Direction.ASC, "id"))
                .stream().map(MrStockService::toResponse).toList();
    }

    public MrStockItemResponse get(String id) {
        Objects.requireNonNull(id, "id is required");
        ensureInitialized();
        return toResponse(getEntity(id));
    }

    public MrStockItemResponse update(String id, UpdateMrStockItemRequest request) {
        Objects.requireNonNull(id, "id is required");
        ensureInitialized();
        MrStockItem item = getEntity(id);
        item.setName(request.name());
        item.setStock(request.stock());
        return toResponse(mrStockRepository.save(item));
    }

    public void adjustStockOrThrow(String productId, int delta) {
        Objects.requireNonNull(productId, "productId is required");
        ensureInitialized();
        MrStockItem item = getEntity(productId);

        int current = item.getStock() == null ? 0 : item.getStock();
        int next = current + delta;
        if (next < 0) {
            throw new IllegalArgumentException("Insufficient stock for product " + productId);
        }
        item.setStock(next);
        mrStockRepository.save(item);
    }

    private MrStockItem getEntity(String id) {
        Objects.requireNonNull(id, "id is required");
        return mrStockRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Stock item not found"));
    }

    private void ensureInitialized() {
        if (mrStockRepository.count() > 0) {
            return;
        }

        MrStockItem p1 = new MrStockItem();
        p1.setId("P001");
        p1.setName("Product X (500mg)");
        p1.setStock(100);

        MrStockItem p2 = new MrStockItem();
        p2.setId("P002");
        p2.setName("Product Y Syrup (100ml)");
        p2.setStock(100);

        MrStockItem p3 = new MrStockItem();
        p3.setId("P003");
        p3.setName("Product Z Cream");
        p3.setStock(100);

        MrStockItem p4 = new MrStockItem();
        p4.setId("P004");
        p4.setName("Sample Kit A");
        p4.setStock(100);

        List<MrStockItem> seed = List.of(p1, p2, p3, p4);
        mrStockRepository.saveAll(seed);
    }

    public static MrStockItemResponse toResponse(MrStockItem item) {
        return new MrStockItemResponse(item.getId(), item.getName(), item.getStock());
    }
}
