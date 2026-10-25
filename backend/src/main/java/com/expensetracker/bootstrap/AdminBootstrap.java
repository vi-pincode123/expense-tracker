package com.expensetracker.bootstrap;

import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Creates the first ADMIN through server-side environment variables only.
 * Public registration never receives a role, so this is the only bootstrap path.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin-name:Administrator}")
    private String adminName;

    @Value("${app.bootstrap.admin-email:}")
    private String adminEmail;

    @Value("${app.bootstrap.admin-password:}")
    private String adminPassword;

    @Value("${app.bootstrap.assign-legacy-expenses:false}")
    private boolean assignLegacyExpenses;

    public AdminBootstrap(
            UserRepository userRepository,
            ExpenseRepository expenseRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        User admin = ensureFirstAdmin();

        if (assignLegacyExpenses) {
            User owner = resolveAdminForLegacyExpenses(admin);
            if (owner == null) {
                log.warn("Legacy expenses were not assigned because no matching admin account was found.");
            } else {
                int assigned = expenseRepository.assignUnownedExpensesTo(owner);
                log.info("Assigned {} legacy expense(s) to admin {}.", assigned, owner.getEmail());
            }
        }

        long unowned = expenseRepository.countByOwnerIsNull();
        if (unowned > 0) {
            log.warn("{} expense(s) still have no owner. Set BOOTSTRAP_ADMIN_EMAIL and " +
                    "ASSIGN_LEGACY_EXPENSES=true once to assign them.", unowned);
        }
    }

    private User ensureFirstAdmin() {
        if (userRepository.countByRole(Role.ADMIN) > 0) {
            log.info("An administrator already exists; first-admin bootstrap skipped.");
            return findConfiguredAdmin();
        }

        if (isBlank(adminEmail) || isBlank(adminPassword)) {
            log.warn("No administrator exists. Set BOOTSTRAP_ADMIN_EMAIL and " +
                    "BOOTSTRAP_ADMIN_PASSWORD once to create the first admin.");
            return null;
        }

        if (adminPassword.length() < 8 || adminPassword.length() > 72) {
            log.error("BOOTSTRAP_ADMIN_PASSWORD must be between 8 and 72 characters. " +
                    "First-admin bootstrap skipped.");
            return null;
        }

        String normalizedEmail = normalizeEmail(adminEmail);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.error("BOOTSTRAP_ADMIN_EMAIL already belongs to an existing user. " +
                    "The existing account was not promoted. First-admin bootstrap skipped.");
            return null;
        }

        User admin = new User();
        admin.setName(isBlank(adminName) ? "Administrator" : adminName.trim());
        admin.setEmail(normalizedEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);
        admin = userRepository.save(admin);
        log.info("Created the first administrator account for {}.", normalizedEmail);
        return admin;
    }

    private User resolveAdminForLegacyExpenses(User createdAdmin) {
        if (createdAdmin != null) {
            return createdAdmin;
        }
        User configuredAdmin = findConfiguredAdmin();
        if (configuredAdmin != null) {
            return configuredAdmin;
        }

        List<User> admins = userRepository.findByRole(Role.ADMIN);
        if (admins.size() == 1) {
            return admins.get(0);
        }
        return null;
    }

    private User findConfiguredAdmin() {
        if (isBlank(adminEmail)) {
            return null;
        }
        return userRepository.findByEmailIgnoreCase(normalizeEmail(adminEmail))
                .filter(user -> user.getRole() == Role.ADMIN)
                .orElse(null);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
