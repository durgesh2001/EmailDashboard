package com.emailassistant.service;

import com.emailassistant.model.Email;
import com.emailassistant.repository.EmailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final EmailRepository repo;

    // Save a new email (used by API or IMAP ingestor)
    public Email createEmail(String sender, String subject, String body) {
        String priority = (subject != null && subject.toLowerCase().contains("urgent")) ? "Urgent" : "Not urgent";
        Email e = Email.builder()
                .sender(sender)
                .subject(subject)
                .body(body)
                .receivedAt(LocalDateTime.now())
                .sentiment("Neutral")  // placeholder — later replace with NLP
                .priority(priority)
                .status("Pending")
                .filtered(true)
                .approved(false)
                .build();
        return repo.save(e);
    }

    public Email save(Email e) {
        return repo.save(e);
    }

    public List<Email> getFilteredEmails() {
        return repo.findByFilteredTrueOrderByPriorityDescReceivedAtDesc();
    }

    public List<Email> getAllEmails() {
        return repo.findAllByOrderByReceivedAtDesc();
    }

    public Map<String, Long> analytics() {
        Map<String, Long> m = new HashMap<>();
        m.put("total24h", repo.countByReceivedAtAfter(LocalDateTime.now().minusHours(24)));
        m.put("resolved", repo.countByStatus("Resolved"));
        m.put("pending", repo.countByStatus("Pending"));
        return m;
    }
}
