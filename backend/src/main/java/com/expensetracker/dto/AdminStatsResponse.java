package com.expensetracker.dto;

import java.math.BigDecimal;

public record AdminStatsResponse(
        long totalUsers,
        long activeUsers,
        long inactiveUsers,
        long adminUsers,
        long totalExpenses,
        BigDecimal totalIncome,
        BigDecimal totalExpenseAmount,
        BigDecimal balance
) {
}
