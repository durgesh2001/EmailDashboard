package com.emailassistant.controller;

import com.emailassistant.model.Email;
import com.emailassistant.repository.EmailRepository;
import com.emailassistant.service.EmailService;
import com.emailassistant.service.GeminiNlpService;
import com.emailassistant.service.MailFetchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173") // allow React dev server
public class EmailController {

    private final EmailService service;
    private final MailFetchService mailFetchService;
    private final EmailRepository emailRepo;
    private final GeminiNlpService geminiNlpService;

    // DTO for creating a new email (client can POST minimal payload)
    public static class CreateEmailRequest {
        public String sender;
        public String subject;
        public String body;
    }

    @GetMapping("/emails")
    public List<Email> getEmails() {
        return service.getFilteredEmails();
    }

    @GetMapping("/emails/all")
    public List<Email> getAllEmails() {
        return service.getAllEmails();
    }

    @PostMapping("/emails")
    public ResponseEntity<Email> createEmail(@RequestBody CreateEmailRequest req) {
        Email saved = service.createEmail(req.sender, req.subject, req.body);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/emails/{id}/reply")
    public ResponseEntity<?> saveReply(@PathVariable Long id, @RequestBody String finalReply) {
        return service.getAllEmails().stream().filter(e -> e.getId().equals(id)).findFirst()
                .map(e -> {
                    e.setFinalReply(finalReply);
                    e.setApproved(true);
                    service.save(e);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/emails/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return service.getAllEmails().stream().filter(e -> e.getId().equals(id)).findFirst()
                .map(e -> {
                    e.setStatus(status);
                    service.save(e);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/analytics")
    public Map<String, Long> analytics() {
        return service.analytics();
    }

    // Optional: seed example data for quick testing
    @PostMapping("/_demo/seed")
    public ResponseEntity<?> seed() {
        if (!service.getAllEmails().isEmpty()) return ResponseEntity.ok().build();
        service.createEmail(
                "customer@example.com",
                "Request: cannot access dashboard - urgent",
                "Hi team, I cannot access the dashboard. Error 403. Phone +1 555-123-4567. Please help asap."
        );
        return ResponseEntity.ok().build();
    }

    @GetMapping("/fetch")
    public String fetchEmails() {
        try {
            System.out.println("fetch fn execute ");
            mailFetchService.fetchAndSaveEmails();
            System.out.println("fetch fn executed now ");
            return "Emails fetched successfully";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }

    @PostMapping("/emails/{id}/draft")
    public ResponseEntity<String> generateDraft(@PathVariable Long id) {
        return emailRepo.findById(id)
                .map(email -> {
                    String draft = geminiNlpService.generateDraftReply(email);
                    return ResponseEntity.ok(draft);
                })
                .orElse(ResponseEntity.notFound().build());
    }

}
