package com.expensetracker.service;

import com.expensetracker.dto.AnalyticsResponse;
import com.expensetracker.dto.ExpenseRequest;
import com.expensetracker.dto.ExpenseResponse;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ApiException;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public ExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getAllExpenses(Long ownerId) {
        return expenseRepository.findByOwner_Id(ownerId).stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<ExpenseResponse> getExpenseById(Long id, Long ownerId) {
        return expenseRepository.findByIdAndOwner_Id(id, ownerId)
                .map(ExpenseResponse::from);
    }

    @Transactional
    public ExpenseResponse createExpense(Long ownerId, ExpenseRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "The authenticated account no longer exists."
                ));

        Expense expense = new Expense();
        applyRequest(expense, request);
        expense.setOwner(owner);
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    @Transactional
    public Optional<ExpenseResponse> updateExpense(Long id, Long ownerId, ExpenseRequest request) {
        return expenseRepository.findByIdAndOwner_Id(id, ownerId)
                .map(expense -> {
                    applyRequest(expense, request);
                    return ExpenseResponse.from(expenseRepository.save(expense));
                });
    }

    @Transactional
    public boolean deleteExpense(Long id, Long ownerId) {
        Optional<Expense> expense = expenseRepository.findByIdAndOwner_Id(id, ownerId);
        if (expense.isEmpty()) {
            return false;
        }
        expenseRepository.delete(expense.get());
        return true;
    }

    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getSummary(Long ownerId) {
        YearMonth currentMonth = YearMonth.now();
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();

        BigDecimal totalIncome = expenseRepository.getTotalIncomeByOwnerId(ownerId);
        BigDecimal totalExpenses = expenseRepository.getTotalExpensesByOwnerId(ownerId);
        BigDecimal balance = totalIncome.subtract(totalExpenses);

        Map<String, BigDecimal> summary = new LinkedHashMap<>();
        summary.put("totalIncome", totalIncome);
        summary.put("totalExpenses", totalExpenses);
        summary.put("currentMonthIncome", expenseRepository.getTotalIncomeBetweenByOwnerId(
                ownerId, startOfMonth, endOfMonth));
        summary.put("currentMonthExpenses", expenseRepository.getTotalExpensesBetweenByOwnerId(
                ownerId, startOfMonth, endOfMonth));
        summary.put("balance", balance);
        return summary;
    }

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(Long ownerId, int months) {
        int safeMonths = Math.min(Math.max(months, 1), 24);
        YearMonth currentMonth = YearMonth.now();
        YearMonth firstMonth = currentMonth.minusMonths(safeMonths - 1L);
        LocalDate startDate = firstMonth.atDay(1);

        DateTimeFormatter labelFormatter = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
        List<AnalyticsResponse.MonthlyPoint> monthlyExpenses = buildMonthlyPoints(
                expenseRepository.getMonthlyExpenseTotalsByOwnerId(ownerId, startDate),
                firstMonth,
                safeMonths,
                labelFormatter
        );
        List<AnalyticsResponse.MonthlyPoint> monthlyIncome = buildMonthlyPoints(
                expenseRepository.getMonthlyIncomeTotalsByOwnerId(ownerId, startDate),
                firstMonth,
                safeMonths,
                labelFormatter
        );

        List<AnalyticsResponse.CategoryPoint> categoryExpenses =
                expenseRepository.getCategoryExpenseTotalsByOwnerId(ownerId)
                        .stream()
                        .map(row -> new AnalyticsResponse.CategoryPoint(
                                String.valueOf(row[0]),
                                toBigDecimal(row[1]),
                                row[2] == null ? 0L : ((Number) row[2]).longValue()
                        ))
                        .toList();

        return new AnalyticsResponse(monthlyExpenses, monthlyIncome, categoryExpenses);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getRecentExpenses(Long ownerId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 20);
        return expenseRepository.findRecentByOwnerId(ownerId, PageRequest.of(0, safeLimit))
                .stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpensesByType(Long ownerId, String type) {
        return expenseRepository.findByOwner_IdAndType(ownerId, type).stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpensesByCategory(Long ownerId, String category) {
        return expenseRepository.findByOwner_IdAndCategory(ownerId, category).stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpensesByTypeAndCategory(Long ownerId, String type, String category) {
        return expenseRepository.findByOwner_IdAndTypeAndCategory(ownerId, type, category).stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    private void applyRequest(Expense expense, ExpenseRequest request) {
        expense.setTitle(request.title().trim());
        expense.setAmount(request.amount());
        expense.setType(request.type());
        expense.setCategory(request.category().trim());
        expense.setTransactionDate(request.transactionDate());
        String description = request.description();
        expense.setDescription(description == null || description.isBlank() ? null : description.trim());
    }

    private List<AnalyticsResponse.MonthlyPoint> buildMonthlyPoints(
            List<Object[]> rows,
            YearMonth firstMonth,
            int months,
            DateTimeFormatter labelFormatter
    ) {
        Map<String, BigDecimal> totalsByMonth = new HashMap<>();
        for (Object[] row : rows) {
            totalsByMonth.put(String.valueOf(row[0]), toBigDecimal(row[1]));
        }

        List<AnalyticsResponse.MonthlyPoint> points = new ArrayList<>(months);
        for (int i = 0; i < months; i++) {
            YearMonth yearMonth = firstMonth.plusMonths(i);
            String key = yearMonth.toString();
            points.add(new AnalyticsResponse.MonthlyPoint(
                    key,
                    yearMonth.atDay(1).format(labelFormatter),
                    totalsByMonth.getOrDefault(key, BigDecimal.ZERO)
            ));
        }
        return points;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        return new BigDecimal(value.toString());
    }
}
