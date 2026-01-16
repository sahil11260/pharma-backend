package com.kavyapharm.farmatrack.auth.dto;

import com.kavyapharm.farmatrack.user.dto.UserResponse;

public record LoginResponse(
        String token,
        UserResponse user
) {}
