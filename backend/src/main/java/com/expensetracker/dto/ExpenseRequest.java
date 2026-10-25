package com.expensetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must be 255 characters or fewer")
        String title,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Digits(integer = 8, fraction = 2, message = "Amount must have at most 8 digits and 2 decimals")
        BigDecimal amount,

        @NotBlank(message = "Type is required")
        @Pattern(regexp = "INCOME|EXPENSE", message = "Type must be INCOME or EXPENSE")
        String type,

        @NotBlank(message = "Category is required")
        @Size(max = 100, message = "Category must be 100 characters or fewer")
        String category,

        @NotNull(message = "Transaction date is required")
        LocalDate transactionDate,

        @Size(max = 2000, message = "Description must be 2000 characters or fewer")
        String description
) {
}
