package org.example.studyroomreservation.student;

public class InvalidTokenException extends RuntimeException{
    public InvalidTokenException(String invalidOrExpiredRegistrationToken) {
        super(invalidOrExpiredRegistrationToken);
    }
}
