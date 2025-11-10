package org.example.studyroomreservation.config.security.user;

public abstract class AbstractLoginClient {
    public final Authority authority;
    public final int id;
    public final String password;// this is already HASHED!
    public final String userName;

    protected AbstractLoginClient(Authority authority, String password, String userName, int id) {
        this.authority = authority;
        this.password = password;
        this.userName = userName;
        this.id = id; // teacher's user_id or student's student_id
    }

    public enum Authority {
        ROLE_TEACHER,
        ROLE_STUDENT;
    };
}
