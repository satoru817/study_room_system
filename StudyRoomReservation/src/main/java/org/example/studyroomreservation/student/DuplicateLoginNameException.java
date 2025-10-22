package org.example.studyroomreservation.student;

public class DuplicateLoginNameException extends RuntimeException {
    public DuplicateLoginNameException(String loginNameAlreadyExists) {
        super(loginNameAlreadyExists);
    }
}
