package org.example.studyroomreservation.repository;

import org.example.studyroomreservation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Integer> {
    @Query("""
            SELECT u
            FROM User u
            WHERE u.email = :email
            """)
    User getByEmail(String email);
}
