package com.kavyapharm.farmatrack.notification.service;

import com.kavyapharm.farmatrack.notification.dto.CreateNotificationRequest;
import com.kavyapharm.farmatrack.notification.dto.NotificationResponse;
import com.kavyapharm.farmatrack.notification.dto.UpdateNotificationRequest;
import com.kavyapharm.farmatrack.notification.model.Notification;
import com.kavyapharm.farmatrack.notification.repository.NotificationRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<NotificationResponse> list() {
        return notificationRepository.findAll(Sort.by(Sort.Direction.DESC, "date").and(Sort.by(Sort.Direction.DESC, "id")))
                .stream().map(NotificationService::toResponse).toList();
    }

    public NotificationResponse get(String id) {
        Objects.requireNonNull(id, "id is required");
        return toResponse(getEntity(id));
    }

    public NotificationResponse create(CreateNotificationRequest request) {
        String id = generateId();

        Notification notification = new Notification();
        notification.setId(id);
        notification.setTitle(request.title());
        notification.setMessage(request.message());
        notification.setType(request.type());
        notification.setDate(request.date() == null ? LocalDate.now() : request.date());
        notification.setStatus(request.status() == null || request.status().isBlank() ? "Unread" : request.status());
        notification.setPriority(request.priority() == null || request.priority().isBlank() ? "Normal" : request.priority());

        return toResponse(notificationRepository.save(notification));
    }

    public NotificationResponse update(String id, UpdateNotificationRequest request) {
        Objects.requireNonNull(id, "id is required");
        Notification notification = getEntity(id);

        notification.setTitle(request.title());
        notification.setMessage(request.message());
        notification.setType(request.type());
        notification.setDate(request.date() == null ? notification.getDate() : request.date());
        notification.setStatus(request.status());
        notification.setPriority(request.priority());

        return toResponse(notificationRepository.save(notification));
    }

    public void delete(String id) {
        Objects.requireNonNull(id, "id is required");
        if (!notificationRepository.existsById(id)) {
            return;
        }
        notificationRepository.deleteById(id);
    }

    private Notification getEntity(String id) {
        Objects.requireNonNull(id, "id is required");
        return notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
    }

    private String generateId() {
        String id;
        do {
            int n = (int) Math.floor(Math.random() * 1000);
            id = "N" + String.format("%03d", n);
        } while (notificationRepository.existsById(id));
        return id;
    }

    public static NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getDate(),
                notification.getStatus(),
                notification.getPriority()
        );
    }
}
