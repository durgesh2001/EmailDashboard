package com.emailassistant.repository;

import com.emailassistant.model.KnowledgeBaseArticle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnowledgeBaseArticleRepository extends JpaRepository<KnowledgeBaseArticle, Long> {
    // Simple naive search returning top 3 matches
    List<KnowledgeBaseArticle> findTop3ByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String title, String content);
}
