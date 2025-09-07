package com.emailassistant.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "emails")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Email {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "message_id", unique = true)
    private String messageId;

    private String sender;
    private String subject;

    @Column(length = 10000)

    private String body;

    private LocalDateTime receivedAt;

    // NLP fields
    private String sentiment;  // Positive | Negative | Neutral
    private String priority;   // Urgent | Not urgent

    // Extracted contact info
    private String phone;
    private String altEmail;

    @Column(length = 2000)
    private String requirements; // short summary

    @Column(columnDefinition = "TEXT")
    private String draftReply;

    @Column(columnDefinition = "TEXT")
    private String finalReply;

    private Boolean approved = false;
    private String status = "Pending";
    private Boolean filtered = false;


}
