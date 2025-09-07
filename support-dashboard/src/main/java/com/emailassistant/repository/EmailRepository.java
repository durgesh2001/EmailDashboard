package com.emailassistant.repository;

import com.emailassistant.model.Email;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EmailRepository extends JpaRepository<Email, Long> {
    Optional<Email> findByMessageId(String messageId);

    // priority (Urgent first) then newest first
    List<Email> findByFilteredTrueOrderByPriorityDescReceivedAtDesc();

    List<Email> findAllByOrderByReceivedAtDesc();

    long countByReceivedAtAfter(LocalDateTime since);

    long countByStatus(String status);

    boolean existsByMessageId(String messageId);

}
