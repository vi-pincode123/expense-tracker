package com.expensetracker.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory denylist for tokens explicitly logged out during this application run.
 * It is intentionally small and self-cleaning; tokens still expire normally.
 */
@Service
public class TokenBlacklistService {
    private static final int CLEANUP_THRESHOLD = 1_000;

    private final Map<String, Instant> revokedTokens = new ConcurrentHashMap<>();

    public void revoke(String jwtId, Instant expiresAt) {
        if (jwtId == null || jwtId.isBlank() || expiresAt == null) {
            return;
        }
        revokedTokens.put(jwtId, expiresAt);
        if (revokedTokens.size() > CLEANUP_THRESHOLD) {
            cleanupExpired();
        }
    }

    public boolean isRevoked(String jwtId) {
        if (jwtId == null || jwtId.isBlank()) {
            return false;
        }
        Instant expiresAt = revokedTokens.get(jwtId);
        if (expiresAt == null) {
            return false;
        }
        if (expiresAt.isBefore(Instant.now())) {
            revokedTokens.remove(jwtId);
            return false;
        }
        return true;
    }

    private void cleanupExpired() {
        Instant now = Instant.now();
        revokedTokens.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
    }
}
