package com.expensetracker.service;

import com.expensetracker.dto.AuthResponse;
import com.expensetracker.dto.LoginRequest;
import com.expensetracker.dto.ProfileUpdateRequest;
import com.expensetracker.dto.RegisterRequest;
import com.expensetracker.dto.UserResponse;
import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ApiException;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtService;
import com.expensetracker.security.TokenBlacklistService;
import com.expensetracker.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            TokenBlacklistService tokenBlacklistService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists."
            );
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        user.setActive(true);

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists."
            );
        }

        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password())
            );
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findByEmailIgnoreCase(principal.getEmail())
                    .orElseThrow(() -> new ApiException(
                            HttpStatus.UNAUTHORIZED,
                            "Invalid email or password."
                    ));
            return buildAuthResponse(user);
        } catch (DisabledException exception) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "This account is deactivated. Contact an administrator."
            );
        } catch (AuthenticationException exception) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password."
            );
        }
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "The authenticated account no longer exists."
                ));
        return UserResponse.from(user);
    }

    @Transactional
    public AuthResponse updateProfile(UserPrincipal principal, ProfileUpdateRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "The authenticated account no longer exists."
                ));

        String email = normalizeEmail(request.email());
        if (!email.equalsIgnoreCase(user.getEmail())
                && userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists."
            );
        }

        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhoneNumber(trimToNull(request.phoneNumber()));
        user.setDateOfBirth(request.dateOfBirth());
        user.setGender(trimToNull(request.gender()));
        user.setAddress(trimToNull(request.address()));

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists."
            );
        }

        // A token is tied to the account email, so return a fresh one when the email changes.
        return buildAuthResponse(user);
    }

    public void logout(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return;
        }

        String token = authorizationHeader.substring("Bearer ".length()).trim();
        try {
            Claims claims = jwtService.parseClaims(token);
            tokenBlacklistService.revoke(claims.getId(), claims.getExpiration().toInstant());
        } catch (JwtException | IllegalArgumentException ignored) {
            // An invalid or expired token is already unusable, so logout remains idempotent.
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                UserResponse.from(user)
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
