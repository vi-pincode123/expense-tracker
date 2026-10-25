package com.expensetracker.dto;

import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        boolean active,
        String phoneNumber,
        LocalDate dateOfBirth,
        String gender,
        String address,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getPhoneNumber(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getAddress(),
                user.getCreatedAt()
        );
    }
}
