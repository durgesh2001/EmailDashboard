package com.emailassistant.service;

import com.emailassistant.model.Email;
import com.emailassistant.repository.EmailRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiNlpService {

    private final EmailRepository emailRepo;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // API key comes from application.properties or .env
    @Value("${gemini.api.key}")
    private String apiKey;


    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=";

    /**
     * Generate a draft reply for a given email using Gemini API.
     */
    public String generateDraftReply(Email email) {
        try {
            System.out.println("API : "+ apiKey);
            String prompt = buildPrompt(email);

            // JSON request body
            // Build the JSON payload manually with proper structure
            ObjectNode requestJson = objectMapper.createObjectNode();
            ArrayNode contents = objectMapper.createArrayNode();
            ObjectNode message = objectMapper.createObjectNode();
            message.put("role", "user");

            ArrayNode parts = objectMapper.createArrayNode();
            ObjectNode part = objectMapper.createObjectNode();
            part.put("text", prompt);
            parts.add(part);

            message.set("parts", parts);
            contents.add(message);
            requestJson.set("contents", contents);

// Convert to JSON string
            String requestBody = objectMapper.writeValueAsString(requestJson);
            System.out.println("Request Body:  " + requestBody);

            System.out.println("Request Body:  "+requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_API_URL + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini API error: {}", response.body());
                return "Error generating draft reply";
            }

            JsonNode root = objectMapper.readTree(response.body());
            String draft = root.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

            // Save draft into DB
            System.out.println("draft is :" + draft);
            email.setDraftReply(draft);
            emailRepo.save(email);

            return draft;

        } catch (Exception e) {
            log.error("Failed to generate draft reply", e);
            return "Error generating draft reply";
        }
    }

    /**
     * Build the prompt based on email content.
     */
    private String buildPrompt(Email email) {
        return "You are a helpful support assistant.\n"
                + "The customer sent the following message:\n"
                + "Subject: " + email.getSubject() + "\n"
                + "Body: " + email.getBody() + "\n\n"
                + "Please draft a professional and friendly reply. "
                + "If the tone is frustrated, acknowledge their frustration empathetically. "
                + "Include relevant details if a product is mentioned. "
                + "Keep it concise but supportive.";
    }
}
