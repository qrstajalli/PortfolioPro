package com.portfoliopro.email.service;

import com.portfoliopro.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final AppProperties appProperties;

    // Ephemeral in-memory dev token cache for local development/testing without real SMTP
    private final ConcurrentHashMap<String, String> devTokenCache = new ConcurrentHashMap<>();

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetUrl = appProperties.getMail().getFrontendUrl() + "/reset-password?token=" + resetToken;

        if (appProperties.getAuth().isDevMode()) {
            devTokenCache.put(toEmail.toLowerCase().trim(), resetToken);
            log.info("Password reset token generated for user [REDACTED]");
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(appProperties.getMail().getFrom());
                message.setTo(toEmail);
                message.setSubject("PortfolioPro - Reset Your Password");
                message.setText("Hello,\n\n"
                        + "A request was received to reset the password for your PortfolioPro paper-trading account.\n\n"
                        + "Please click the link below to set a new password:\n"
                        + resetUrl + "\n\n"
                        + "This link is valid for 15 minutes and can only be used once.\n\n"
                        + "If you did not request this, please disregard this email.\n\n"
                        + "Best regards,\nPortfolioPro Team");

                mailSender.send(message);
                log.info("Password reset email sent to {}", toEmail);
            } catch (Exception e) {
                log.warn("Could not dispatch SMTP email to {}: {}. Proceeding in local fallback mode.", toEmail, e.getMessage());
            }
        }
    }

    public String getLatestDevResetToken(String email) {
        if (!appProperties.getAuth().isDevMode()) {
            return null;
        }
        return devTokenCache.get(email.toLowerCase().trim());
    }
}
