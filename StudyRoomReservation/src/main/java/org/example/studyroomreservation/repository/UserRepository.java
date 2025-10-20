package org.example.studyroomreservation.repository;

import org.example.studyroomreservation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
}
