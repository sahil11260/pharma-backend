package com.kavyapharm.farmatrack.region.service;

import com.kavyapharm.farmatrack.region.dto.CreateZoneRequest;
import com.kavyapharm.farmatrack.region.dto.UpdateZoneRequest;
import com.kavyapharm.farmatrack.region.dto.ZoneResponse;
import com.kavyapharm.farmatrack.region.model.Zone;
import com.kavyapharm.farmatrack.region.repository.ZoneRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class ZoneService {

    private final ZoneRepository zoneRepository;

    public ZoneService(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public List<ZoneResponse> list() {
        return zoneRepository.findAll(Sort.by(Sort.Direction.ASC, "name").and(Sort.by(Sort.Direction.ASC, "id")))
                .stream().map(ZoneService::toResponse).toList();
    }

    public ZoneResponse get(Long id) {
        Objects.requireNonNull(id, "id is required");
        return toResponse(getEntity(id));
    }

    public ZoneResponse create(CreateZoneRequest request) {
        Zone zone = new Zone();
        zone.setName(request.name());
        return toResponse(zoneRepository.save(zone));
    }

    public ZoneResponse update(Long id, UpdateZoneRequest request) {
        Objects.requireNonNull(id, "id is required");
        Zone zone = getEntity(id);
        zone.setName(request.name());
        return toResponse(zoneRepository.save(zone));
    }

    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        if (!zoneRepository.existsById(id)) {
            return;
        }
        zoneRepository.deleteById(id);
    }

    private Zone getEntity(Long id) {
        Objects.requireNonNull(id, "id is required");
        return zoneRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Zone not found"));
    }

    public static ZoneResponse toResponse(Zone zone) {
        return new ZoneResponse(zone.getId(), zone.getName());
    }
}
