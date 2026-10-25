package com.expensetracker.dto;

import com.expensetracker.entity.Expense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExpenseResponse(
        Long id,
        String title,
        BigDecimal amount,
        String type,
        String category,
        LocalDate transactionDate,
        String description,
        LocalDateTime createdAt
) {
    public static ExpenseResponse from(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getTitle(),
                expense.getAmount(),
                expense.getType(),
                expense.getCategory(),
                expense.getTransactionDate(),
                expense.getDescription(),
                expense.getCreatedAt()
        );
    }
}
