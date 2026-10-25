package com.expensetracker.service;

import com.expensetracker.entity.Expense;
import com.expensetracker.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ExpenseService {
    @Autowired
    private ExpenseRepository expenseRepository;

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Optional<Expense> getExpenseById(Long id) {
        return expenseRepository.findById(id);
    }

    public Expense createExpense(Expense expense) {
        return expenseRepository.save(expense);
    }

    public Expense updateExpense(Long id, Expense expenseDetails) {
        Optional<Expense> optionalExpense = expenseRepository.findById(id);
        if (optionalExpense.isPresent()) {
            Expense expense = optionalExpense.get();
            expense.setTitle(expenseDetails.getTitle());
            expense.setAmount(expenseDetails.getAmount());
            expense.setType(expenseDetails.getType());
            expense.setCategory(expenseDetails.getCategory());
            expense.setTransactionDate(expenseDetails.getTransactionDate());
            expense.setDescription(expenseDetails.getDescription());
            return expenseRepository.save(expense);
        }
        return null;
    }

    public boolean deleteExpense(Long id) {
        if (expenseRepository.existsById(id)) {
            expenseRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Map<String, BigDecimal> getSummary() {
        BigDecimal totalIncome = expenseRepository.getTotalIncome();
        BigDecimal totalExpenses = expenseRepository.getTotalExpenses();
        BigDecimal balance = totalIncome.subtract(totalExpenses);
        
        Map<String, BigDecimal> summary = new HashMap<>();
        summary.put("totalIncome", totalIncome);
        summary.put("totalExpenses", totalExpenses);
        summary.put("balance", balance);
        return summary;
    }

    public List<Expense> getExpensesByType(String type) {
        return expenseRepository.findByType(type);
    }

    public List<Expense> getExpensesByCategory(String category) {
        return expenseRepository.findByCategory(category);
    }

    public List<Expense> getExpensesByTypeAndCategory(String type, String category) {
        return expenseRepository.findByTypeAndCategory(type, category);
    }
}
