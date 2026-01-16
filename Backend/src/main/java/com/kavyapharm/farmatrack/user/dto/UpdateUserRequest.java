package com.kavyapharm.farmatrack.user.dto;

import com.kavyapharm.farmatrack.user.model.UserRole;
import com.kavyapharm.farmatrack.user.model.UserStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRequest(
        @NotBlank(message = "Name is required") String name,
        @NotNull(message = "Role is required") UserRole role,
        String phone,
        String territory,
        @NotNull(message = "Status is required") UserStatus status,
        String assignedManager,
        String password
) {}
