package com.expensetracker.repository;

import com.expensetracker.entity.Role;
import com.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findAllByOrderByCreatedAtDesc();

    List<User> findByRole(Role role);

    long countByActive(boolean active);

    long countByRole(Role role);

    long countByRoleAndActive(Role role, boolean active);
}
