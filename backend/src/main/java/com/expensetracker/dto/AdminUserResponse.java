package com.expensetracker.dto;

import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String name,
        String email,
        Role role,
        boolean active,
        LocalDateTime createdAt,
        long expenseCount
) {
    public static AdminUserResponse from(User user, long expenseCount) {
        return new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt(),
                expenseCount
        );
    }
}
