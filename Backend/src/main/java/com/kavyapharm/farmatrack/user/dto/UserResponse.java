package com.kavyapharm.farmatrack.user.dto;

import com.kavyapharm.farmatrack.user.model.UserRole;
import com.kavyapharm.farmatrack.user.model.UserStatus;

import java.time.LocalDate;

public record UserResponse(
        Long id,
        String name,
        String email,
        UserRole role,
        String phone,
        String territory,
        UserStatus status,
        LocalDate lastLogin,
        String assignedManager
) {}
