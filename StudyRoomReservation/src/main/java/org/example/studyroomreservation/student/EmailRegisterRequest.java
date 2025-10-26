package org.example.studyroomreservation.student;

public record EmailRegisterRequest(int studentId, String email) {
    public EmailRegisterRequest {
        email = sanitizeEmail(email);
    }

    private static String sanitizeEmail(String email) {
        if (email == null) {
            throw new IllegalArgumentException("email must not be null");
        }
        String trimmed = email.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("email must not be empty");
        }
        return trimmed;
    }
}

