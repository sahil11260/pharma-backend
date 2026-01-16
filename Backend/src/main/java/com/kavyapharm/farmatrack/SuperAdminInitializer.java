package com.kavyapharm.farmatrack;
import com.kavyapharm.farmatrack.user.model.UserRole;
import com.kavyapharm.farmatrack.user.model.UserStatus;
import com.kavyapharm.farmatrack.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class SuperAdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public SuperAdminInitializer(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        var existing = userRepository.findByEmailIgnoreCase("superadmin@kavyapharm.com");

        if (existing.isEmpty()) {
            var superadmin = new com.kavyapharm.farmatrack.user.model.User();
            superadmin.setName("SuperAdmin");
            superadmin.setEmail("superadmin@kavyapharm.com");
            superadmin.setPasswordHash(passwordEncoder.encode("Superadmin@123"));
            superadmin.setRole(UserRole.SUPERADMIN);
            superadmin.setStatus(UserStatus.ACTIVE);
            superadmin.setTerritory("Head Office");
            superadmin.setPhone("0000000000");
            userRepository.save(superadmin);
            return;
        }

        var superadmin = existing.get();
        superadmin.setPasswordHash(passwordEncoder.encode("Superadmin@123"));
        superadmin.setRole(UserRole.SUPERADMIN);
        superadmin.setStatus(UserStatus.ACTIVE);
        userRepository.save(superadmin);
    }
}