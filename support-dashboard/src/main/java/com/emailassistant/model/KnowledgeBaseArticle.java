package com.emailassistant.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kb_articles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeBaseArticle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    // Optional: comma-separated tags e.g. "login,auth,dashboard"
    private String tags;
}
