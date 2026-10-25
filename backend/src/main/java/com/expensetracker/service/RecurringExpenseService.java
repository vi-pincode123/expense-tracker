package com.expensetracker.service;

import com.expensetracker.dto.RecurringExpenseRequest;
import com.expensetracker.dto.RecurringExpenseResponse;
import com.expensetracker.entity.RecurringExpense;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ApiException;
import com.expensetracker.repository.RecurringExpenseRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class RecurringExpenseService {
    private final RecurringExpenseRepository recurringExpenseRepository;
    private final UserRepository userRepository;

    public RecurringExpenseService(
            RecurringExpenseRepository recurringExpenseRepository,
            UserRepository userRepository
    ) {
        this.recurringExpenseRepository = recurringExpenseRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<RecurringExpenseResponse> getAllRecurringExpenses(Long ownerId) {
        return recurringExpenseRepository.findByOwner_IdOrderByNextDueDateAsc(ownerId).stream()
                .map(RecurringExpenseResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<RecurringExpenseResponse> getRecurringExpenseById(Long id, Long ownerId) {
        return recurringExpenseRepository.findByIdAndOwner_Id(id, ownerId)
                .map(RecurringExpenseResponse::from);
    }

    @Transactional
    public RecurringExpenseResponse createRecurringExpense(Long ownerId, RecurringExpenseRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "The authenticated account no longer exists."
                ));

        RecurringExpense recurringExpense = new RecurringExpense();
        applyRequest(recurringExpense, request);
        recurringExpense.setOwner(owner);
        recurringExpense.setPaused(false);
        return RecurringExpenseResponse.from(recurringExpenseRepository.save(recurringExpense));
    }

    @Transactional
    public Optional<RecurringExpenseResponse> updateRecurringExpense(
            Long id,
            Long ownerId,
            RecurringExpenseRequest request
    ) {
        return recurringExpenseRepository.findByIdAndOwner_Id(id, ownerId)
                .map(recurringExpense -> {
                    applyRequest(recurringExpense, request);
                    return RecurringExpenseResponse.from(
                            recurringExpenseRepository.save(recurringExpense)
                    );
                });
    }

    @Transactional
    public boolean deleteRecurringExpense(Long id, Long ownerId) {
        Optional<RecurringExpense> recurringExpense =
                recurringExpenseRepository.findByIdAndOwner_Id(id, ownerId);
        if (recurringExpense.isEmpty()) {
            return false;
        }
        recurringExpenseRepository.delete(recurringExpense.get());
        return true;
    }

    @Transactional
    public Optional<RecurringExpenseResponse> setPaused(Long id, Long ownerId, boolean paused) {
        return recurringExpenseRepository.findByIdAndOwner_Id(id, ownerId)
                .map(recurringExpense -> {
                    recurringExpense.setPaused(paused);
                    return RecurringExpenseResponse.from(
                            recurringExpenseRepository.save(recurringExpense)
                    );
                });
    }

    @Transactional
    public Optional<RecurringExpenseResponse> markPaid(Long id, Long ownerId) {
        return recurringExpenseRepository.findByIdAndOwner_Id(id, ownerId)
                .map(recurringExpense -> {
                    if (recurringExpense.isPaused()) {
                        throw new ApiException(
                                HttpStatus.CONFLICT,
                                "Resume this recurring expense before marking it as paid."
                        );
                    }

                    recurringExpense.setLastPaidDate(LocalDate.now());
                    recurringExpense.setNextDueDate(advanceDueDate(
                            recurringExpense.getNextDueDate(),
                            recurringExpense.getFrequency()
                    ));
                    return RecurringExpenseResponse.from(
                            recurringExpenseRepository.save(recurringExpense)
                    );
                });
    }

    private void applyRequest(RecurringExpense recurringExpense, RecurringExpenseRequest request) {
        LocalDate nextDueDate = request.nextDueDate() == null
                ? request.startDate()
                : request.nextDueDate();

        if (nextDueDate.isBefore(request.startDate())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Next due date cannot be before the start date."
            );
        }

        String description = request.description();
        recurringExpense.setAmount(request.amount());
        recurringExpense.setCategory(request.category().trim());
        recurringExpense.setDescription(
                description == null || description.isBlank() ? null : description.trim()
        );
        recurringExpense.setStartDate(request.startDate());
        recurringExpense.setFrequency(request.frequency());
        recurringExpense.setNextDueDate(nextDueDate);
    }

    private LocalDate advanceDueDate(LocalDate currentDueDate, String frequency) {
        return switch (frequency) {
            case "WEEKLY" -> currentDueDate.plusWeeks(1);
            case "MONTHLY" -> currentDueDate.plusMonths(1);
            case "YEARLY" -> currentDueDate.plusYears(1);
            default -> currentDueDate;
        };
    }
}
