package com.expensetracker.dto;

import com.expensetracker.entity.RecurringExpense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RecurringExpenseResponse(
        Long id,
        BigDecimal amount,
        String category,
        String description,
        LocalDate startDate,
        String frequency,
        LocalDate nextDueDate,
        boolean paused,
        LocalDate lastPaidDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static RecurringExpenseResponse from(RecurringExpense recurringExpense) {
        return new RecurringExpenseResponse(
                recurringExpense.getId(),
                recurringExpense.getAmount(),
                recurringExpense.getCategory(),
                recurringExpense.getDescription(),
                recurringExpense.getStartDate(),
                recurringExpense.getFrequency(),
                recurringExpense.getNextDueDate(),
                recurringExpense.isPaused(),
                recurringExpense.getLastPaidDate(),
                recurringExpense.getCreatedAt(),
                recurringExpense.getUpdatedAt()
        );
    }
}
