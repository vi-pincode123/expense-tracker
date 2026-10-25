package com.expensetracker.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ProfileUpdateRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be 100 characters or fewer")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 190, message = "Email must be 190 characters or fewer")
        String email,

        @Size(max = 30, message = "Phone number must be 30 characters or fewer")
        String phoneNumber,

        @Past(message = "Date of birth must be in the past")
        LocalDate dateOfBirth,

        @Size(max = 20, message = "Gender must be 20 characters or fewer")
        String gender,

        @Size(max = 500, message = "Address must be 500 characters or fewer")
        String address
) {
}
