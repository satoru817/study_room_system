package org.example.studyroomreservation.config.security.user;

public abstract class AbstractLoginClient {
    public final Authority authority;
    public final String password;// this is already HASHED!
    public final String userName;

    protected AbstractLoginClient(Authority authority, String password, String userName) {
        this.authority = authority;
        this.password = password;
        this.userName = userName;
    }

    public enum Authority {
        ROLE_TEACHER,
        ROLE_STUDENT;
    };
}
