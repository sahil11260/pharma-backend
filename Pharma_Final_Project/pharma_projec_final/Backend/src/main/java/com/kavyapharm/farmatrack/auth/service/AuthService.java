package com.kavyapharm.farmatrack.auth.service;

import com.kavyapharm.farmatrack.auth.dto.LoginRequest;
import com.kavyapharm.farmatrack.auth.dto.LoginResponse;
import com.kavyapharm.farmatrack.auth.dto.SignupRequest;
import com.kavyapharm.farmatrack.user.dto.UserResponse;
import com.kavyapharm.farmatrack.user.model.User;
import com.kavyapharm.farmatrack.user.model.UserStatus;
import com.kavyapharm.farmatrack.user.repository.UserRepository;
import com.kavyapharm.farmatrack.user.service.UserService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final com.kavyapharm.farmatrack.security.JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder,
            com.kavyapharm.farmatrack.security.JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public UserResponse signup(SignupRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setStatus(UserStatus.ACTIVE);

        return UserService.toResponse(userRepository.save(user));
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        user.setLastLogin(LocalDate.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(new com.kavyapharm.farmatrack.security.CustomUserDetails(user));
        return new LoginResponse(token, UserService.toResponse(user));
    }
}
