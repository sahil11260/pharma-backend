package com.kavyapharm.farmatrack.region.service;

import com.kavyapharm.farmatrack.region.dto.CreateTerritoryRequest;
import com.kavyapharm.farmatrack.region.dto.TerritoryResponse;
import com.kavyapharm.farmatrack.region.dto.UpdateTerritoryRequest;
import com.kavyapharm.farmatrack.region.model.Territory;
import com.kavyapharm.farmatrack.region.repository.TerritoryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class TerritoryService {

    private final TerritoryRepository territoryRepository;

    public TerritoryService(TerritoryRepository territoryRepository) {
        this.territoryRepository = territoryRepository;
    }

    public List<TerritoryResponse> list() {
        return territoryRepository.findAll(
                        Sort.by(Sort.Direction.ASC, "zone")
                                .and(Sort.by(Sort.Direction.ASC, "name"))
                                .and(Sort.by(Sort.Direction.ASC, "id"))
                )
                .stream().map(TerritoryService::toResponse).toList();
    }

    public TerritoryResponse get(Long id) {
        Objects.requireNonNull(id, "id is required");
        return toResponse(getEntity(id));
    }

    public TerritoryResponse create(CreateTerritoryRequest request) {
        Territory territory = new Territory();
        territory.setName(request.name());
        territory.setZone(request.zone());
        return toResponse(territoryRepository.save(territory));
    }

    public TerritoryResponse update(Long id, UpdateTerritoryRequest request) {
        Objects.requireNonNull(id, "id is required");
        Territory territory = getEntity(id);
        territory.setName(request.name());
        territory.setZone(request.zone());
        return toResponse(territoryRepository.save(territory));
    }

    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        if (!territoryRepository.existsById(id)) {
            return;
        }
        territoryRepository.deleteById(id);
    }

    private Territory getEntity(Long id) {
        Objects.requireNonNull(id, "id is required");
        return territoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Territory not found"));
    }

    public static TerritoryResponse toResponse(Territory territory) {
        return new TerritoryResponse(territory.getId(), territory.getName(), territory.getZone());
    }
}
