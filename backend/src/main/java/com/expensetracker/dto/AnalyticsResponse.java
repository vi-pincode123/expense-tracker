package com.expensetracker.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Aggregated data used by the dashboard charts.
 * Kept separate from the Expense entity so the existing API payloads stay unchanged.
 */
public record AnalyticsResponse(
        List<MonthlyPoint> monthlyExpenses,
        List<MonthlyPoint> monthlyIncome,
        List<CategoryPoint> categoryExpenses
) {
    public record MonthlyPoint(String month, String label, BigDecimal total) {}

    public record CategoryPoint(String category, BigDecimal total, long count) {}
}
