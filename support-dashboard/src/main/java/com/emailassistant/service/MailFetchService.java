package com.emailassistant.service;

import com.emailassistant.model.Email;
import com.emailassistant.repository.EmailRepository;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Properties;
import java.util.UUID;

@Service
public class MailFetchService {

    @Value("${mail.imap.host}")
    private String host;

    @Value("${mail.imap.port}")
    private String port;

    @Value("${mail.imap.username}")
    private String username;

    @Value("${mail.imap.password}")
    private String password;

    @Value("${mail.imap.protocol}")
    private String protocol;

    private final EmailRepository emailRepository;

    public MailFetchService(EmailRepository emailRepository) {
        this.emailRepository = emailRepository;
    }

    public void fetchAndSaveEmails() throws Exception {
        // Setup IMAP session
        Properties props = new Properties();
        props.put("mail.store.protocol", protocol);

        Session session = Session.getInstance(props);
        Store store = session.getStore(protocol);
        store.connect(host, username, password);

        Folder inbox = store.getFolder("INBOX");
        inbox.open(Folder.READ_ONLY);

        Message[] messages = inbox.getMessages();

        for (Message msg : messages) {
            String messageId = getMessageId(msg);
            String from = InternetAddress.toString(msg.getFrom());
            String subject = msg.getSubject();
            String body = getTextFromMessage(msg);

            LocalDateTime receivedAt = msg.getReceivedDate().toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDateTime();

            // Basic priority logic
            String priority = (subject != null && subject.toLowerCase().contains("urgent"))
                    ? "Urgent" : "Not urgent";

            // Default sentiment (can later be replaced with NLP)
            String sentiment = "Neutral";

            // Avoid duplicates using messageId
            if (!emailRepository.existsByMessageId(messageId)) {
                Email email = Email.builder()
                        .messageId(messageId != null ? messageId : UUID.randomUUID().toString())
                        .sender(from)
                        .subject(subject)
                        .body(body)
                        .receivedAt(receivedAt)
                        .priority(priority)
                        .sentiment(sentiment)
                        .status("Pending")
                        .approved(false)
                        .filtered(true) // mark as filtered since subject matched
                        .build();

                emailRepository.save(email);
            }
        }

        inbox.close(false);
        store.close();
    }

    private String getTextFromMessage(Message message) throws Exception {
        if (message.isMimeType("text/plain")) {
            return message.getContent().toString();
        } else if (message.isMimeType("text/html")) {
            String html = (String) message.getContent();
            return org.jsoup.Jsoup.parse(html).text(); // ✅ strip HTML
        } else if (message.isMimeType("multipart/*")) {
            Multipart mp = (Multipart) message.getContent();
            for (int i = 0; i < mp.getCount(); i++) {
                BodyPart bp = mp.getBodyPart(i);
                if (bp.isMimeType("text/plain")) {
                    return bp.getContent().toString();
                } else if (bp.isMimeType("text/html")) {
                    String html = (String) bp.getContent();
                    return org.jsoup.Jsoup.parse(html).text(); // ✅ strip HTML
                }
            }
        }
        return "";
    }


    private String getMessageId(Message msg) {
        try {
            String[] headers = msg.getHeader("Message-ID");
            if (headers != null && headers.length > 0) {
                return headers[0];
            }
        } catch (MessagingException e) {
            e.printStackTrace();
        }
        return null;
    }
}
