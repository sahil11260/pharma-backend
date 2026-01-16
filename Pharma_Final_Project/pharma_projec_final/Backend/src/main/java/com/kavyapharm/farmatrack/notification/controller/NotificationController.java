package com.kavyapharm.farmatrack.notification.controller;

import com.kavyapharm.farmatrack.notification.dto.CreateNotificationRequest;
import com.kavyapharm.farmatrack.notification.dto.NotificationResponse;
import com.kavyapharm.farmatrack.notification.dto.UpdateNotificationRequest;
import com.kavyapharm.farmatrack.notification.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> list() {
        return notificationService.list();
    }

    @GetMapping("/{id}")
    public NotificationResponse get(@PathVariable String id) {
        return notificationService.get(id);
    }

    @PostMapping
    public ResponseEntity<NotificationResponse> create(@Valid @RequestBody CreateNotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.create(request));
    }

    @PutMapping("/{id}")
    public NotificationResponse update(@PathVariable String id, @Valid @RequestBody UpdateNotificationRequest request) {
        return notificationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
