package com.expensetracker.controller;

import com.expensetracker.dto.AnalyticsResponse;
import com.expensetracker.dto.ExpenseRequest;
import com.expensetracker.dto.ExpenseResponse;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {
    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> getAllExpenses(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category
    ) {
        Long ownerId = principal.getId();
        List<ExpenseResponse> expenses;

        if (type != null && category != null) {
            expenses = expenseService.getExpensesByTypeAndCategory(ownerId, type, category);
        } else if (type != null) {
            expenses = expenseService.getExpensesByType(ownerId, type);
        } else if (category != null) {
            expenses = expenseService.getExpensesByCategory(ownerId, category);
        } else {
            expenses = expenseService.getAllExpenses(ownerId);
        }

        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> getExpenseById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return expenseService.getExpenseById(id, principal.getId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ExpenseRequest request
    ) {
        ExpenseResponse created = expenseService.createExpense(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request
    ) {
        return expenseService.updateExpense(id, principal.getId(), request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        if (expenseService.deleteExpense(id, principal.getId())) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ExpenseResponse>> getRecentExpenses(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(expenseService.getRecentExpenses(principal.getId(), limit));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, BigDecimal>> getSummary(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(expenseService.getSummary(principal.getId()));
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "12") int months
    ) {
        return ResponseEntity.ok(expenseService.getAnalytics(principal.getId(), months));
    }
}
