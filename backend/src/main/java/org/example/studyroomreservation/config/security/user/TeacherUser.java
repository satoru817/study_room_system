package org.example.studyroomreservation.config.security.user;

import org.example.studyroomreservation.config.security.user.AbstractLoginClient;
import org.example.studyroomreservation.entity.User;

public class TeacherUser extends AbstractLoginClient {
    public final User user;

    public TeacherUser(User user) {
        super(Authority.ROLE_TEACHER, user.getPassword(), user.getName());
        this.user = user;
    }
}
