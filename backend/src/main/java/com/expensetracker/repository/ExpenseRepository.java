package com.expensetracker.repository;

import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByOwner_Id(Long ownerId);

    List<Expense> findByOwner_IdAndType(Long ownerId, String type);

    List<Expense> findByOwner_IdAndCategory(Long ownerId, String category);

    List<Expense> findByOwner_IdAndTypeAndCategory(Long ownerId, String type, String category);

    Optional<Expense> findByIdAndOwner_Id(Long id, Long ownerId);

    long countByOwner_Id(Long ownerId);

    long countByOwnerIsNull();

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
            "WHERE e.owner.id = :ownerId AND e.type = 'INCOME'")
    BigDecimal getTotalIncomeByOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
            "WHERE e.owner.id = :ownerId AND e.type = 'EXPENSE'")
    BigDecimal getTotalExpensesByOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
            "WHERE e.owner.id = :ownerId AND e.type = 'INCOME' " +
            "AND e.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalIncomeBetweenByOwnerId(@Param("ownerId") Long ownerId,
                                              @Param("startDate") LocalDate startDate,
                                              @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
            "WHERE e.owner.id = :ownerId AND e.type = 'EXPENSE' " +
            "AND e.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalExpensesBetweenByOwnerId(@Param("ownerId") Long ownerId,
                                                @Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate);

    @Query(value = "SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month, SUM(amount) AS total " +
            "FROM expenses WHERE owner_id = :ownerId AND type = 'EXPENSE' " +
            "AND transaction_date >= :startDate " +
            "GROUP BY DATE_FORMAT(transaction_date, '%Y-%m') ORDER BY month", nativeQuery = true)
    List<Object[]> getMonthlyExpenseTotalsByOwnerId(@Param("ownerId") Long ownerId,
                                                    @Param("startDate") LocalDate startDate);

    @Query(value = "SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month, SUM(amount) AS total " +
            "FROM expenses WHERE owner_id = :ownerId AND type = 'INCOME' " +
            "AND transaction_date >= :startDate " +
            "GROUP BY DATE_FORMAT(transaction_date, '%Y-%m') ORDER BY month", nativeQuery = true)
    List<Object[]> getMonthlyIncomeTotalsByOwnerId(@Param("ownerId") Long ownerId,
                                                   @Param("startDate") LocalDate startDate);

    @Query("SELECT e FROM Expense e WHERE e.owner.id = :ownerId " +
            "ORDER BY e.transactionDate DESC, e.createdAt DESC, e.id DESC")
    List<Expense> findRecentByOwnerId(@Param("ownerId") Long ownerId, Pageable pageable);

    @Query("SELECT e.category, SUM(e.amount), COUNT(e) FROM Expense e " +
            "WHERE e.owner.id = :ownerId AND e.type = 'EXPENSE' " +
            "GROUP BY e.category ORDER BY SUM(e.amount) DESC")
    List<Object[]> getCategoryExpenseTotalsByOwnerId(@Param("ownerId") Long ownerId);

    @Modifying
    @Query("UPDATE Expense e SET e.owner = :owner WHERE e.owner IS NULL")
    int assignUnownedExpensesTo(@Param("owner") User owner);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.type = 'INCOME'")
    BigDecimal getTotalIncome();

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.type = 'EXPENSE'")
    BigDecimal getTotalExpenses();
}
