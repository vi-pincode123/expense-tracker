package com.expensetracker.service;

import com.expensetracker.dto.AdminStatsResponse;
import com.expensetracker.dto.AdminUserResponse;
import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ApiException;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;

    public AdminService(UserRepository userRepository, ExpenseRepository expenseRepository) {
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByActive(true);
        long inactiveUsers = totalUsers - activeUsers;
        long adminUsers = userRepository.countByRole(Role.ADMIN);
        long totalExpenses = expenseRepository.count();
        BigDecimal totalIncome = expenseRepository.getTotalIncome();
        BigDecimal totalExpenseAmount = expenseRepository.getTotalExpenses();

        return new AdminStatsResponse(
                totalUsers,
                activeUsers,
                inactiveUsers,
                adminUsers,
                totalExpenses,
                totalIncome,
                totalExpenseAmount,
                totalIncome.subtract(totalExpenseAmount)
        );
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(user -> AdminUserResponse.from(
                        user,
                        expenseRepository.countByOwner_Id(user.getId())
                ))
                .toList();
    }

    @Transactional
    public AdminUserResponse updateUserStatus(
            Long userId,
            boolean active,
            UserPrincipal currentAdmin
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "User not found."
                ));

        if (currentAdmin.getId().equals(user.getId()) && !active) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot deactivate your own account."
            );
        }

        if (!active
                && user.getRole() == Role.ADMIN
                && user.isActive()
                && userRepository.countByRoleAndActive(Role.ADMIN, true) <= 1) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "The last active administrator cannot be deactivated."
            );
        }

        if (user.isActive() != active) {
            user.setActive(active);
            user = userRepository.save(user);
        }

        return AdminUserResponse.from(user, expenseRepository.countByOwner_Id(user.getId()));
    }
}
