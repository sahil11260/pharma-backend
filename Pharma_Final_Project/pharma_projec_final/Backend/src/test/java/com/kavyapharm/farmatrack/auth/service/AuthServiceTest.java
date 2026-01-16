package com.kavyapharm.farmatrack.auth.service;

import com.kavyapharm.farmatrack.auth.dto.LoginRequest;
import com.kavyapharm.farmatrack.auth.dto.LoginResponse;
import com.kavyapharm.farmatrack.user.model.User;
import com.kavyapharm.farmatrack.user.model.UserRole;
import com.kavyapharm.farmatrack.user.model.UserStatus;
import com.kavyapharm.farmatrack.user.repository.UserRepository;
import com.kavyapharm.farmatrack.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void login_Success() {
        String email = "test@example.com";
        String password = "password";
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("encodedPassword");
        user.setId(1L);
        user.setName("Test User");
        user.setRole(UserRole.ADMIN);
        user.setStatus(UserStatus.ACTIVE);

        when(userRepository.findByEmailIgnoreCase(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(password, "encodedPassword")).thenReturn(true);
        when(jwtUtil.generateToken(any())).thenReturn("token");

        LoginRequest request = new LoginRequest(email, password);
        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("token", response.token());
        assertEquals(email, response.user().email());
    }

    @Test
    void login_InvalidPassword() {
        String email = "test@example.com";
        String password = "wrongpassword";
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("encodedPassword");

        when(userRepository.findByEmailIgnoreCase(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(password, "encodedPassword")).thenReturn(false);

        LoginRequest request = new LoginRequest(email, password);

        assertThrows(IllegalArgumentException.class, () -> authService.login(request));
    }
}
