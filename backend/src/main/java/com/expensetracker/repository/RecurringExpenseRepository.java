package com.expensetracker.repository;

import com.expensetracker.entity.RecurringExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecurringExpenseRepository extends JpaRepository<RecurringExpense, Long> {
    List<RecurringExpense> findByOwner_IdOrderByNextDueDateAsc(Long ownerId);

    Optional<RecurringExpense> findByIdAndOwner_Id(Long id, Long ownerId);
}
