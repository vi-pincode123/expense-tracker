package com.expensetracker.controller;

import com.expensetracker.dto.RecurringExpenseRequest;
import com.expensetracker.dto.RecurringExpenseResponse;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.RecurringExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-expenses")
public class RecurringExpenseController {
    private final RecurringExpenseService recurringExpenseService;

    public RecurringExpenseController(RecurringExpenseService recurringExpenseService) {
        this.recurringExpenseService = recurringExpenseService;
    }

    @GetMapping
    public ResponseEntity<List<RecurringExpenseResponse>> getAllRecurringExpenses(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(
                recurringExpenseService.getAllRecurringExpenses(principal.getId())
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecurringExpenseResponse> getRecurringExpenseById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return recurringExpenseService.getRecurringExpenseById(id, principal.getId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RecurringExpenseResponse> createRecurringExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RecurringExpenseRequest request
    ) {
        RecurringExpenseResponse created =
                recurringExpenseService.createRecurringExpense(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringExpenseResponse> updateRecurringExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody RecurringExpenseRequest request
    ) {
        return recurringExpenseService.updateRecurringExpense(id, principal.getId(), request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecurringExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        if (recurringExpenseService.deleteRecurringExpense(id, principal.getId())) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/pause")
    public ResponseEntity<RecurringExpenseResponse> pauseRecurringExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return recurringExpenseService.setPaused(id, principal.getId(), true)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/resume")
    public ResponseEntity<RecurringExpenseResponse> resumeRecurringExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return recurringExpenseService.setPaused(id, principal.getId(), false)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<RecurringExpenseResponse> markRecurringExpensePaid(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return recurringExpenseService.markPaid(id, principal.getId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
