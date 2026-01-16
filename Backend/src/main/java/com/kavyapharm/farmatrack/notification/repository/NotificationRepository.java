package com.kavyapharm.farmatrack.notification.repository;

import com.kavyapharm.farmatrack.notification.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, String> {
}
