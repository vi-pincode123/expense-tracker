package com.expensetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringExpenseRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Digits(integer = 8, fraction = 2, message = "Amount must have at most 8 digits and 2 decimals")
        BigDecimal amount,

        @NotBlank(message = "Category is required")
        @Size(max = 100, message = "Category must be 100 characters or fewer")
        String category,

        @Size(max = 2000, message = "Description must be 2000 characters or fewer")
        String description,

        @NotNull(message = "Start date is required")
        LocalDate startDate,

        @NotBlank(message = "Frequency is required")
        @Pattern(regexp = "WEEKLY|MONTHLY|YEARLY", message = "Frequency must be WEEKLY, MONTHLY, or YEARLY")
        String frequency,

        LocalDate nextDueDate
) {
}
