package org.example.studyroomreservation.notification;


import org.example.studyroomreservation.config.security.user.StudentUser;

public interface NotificationStrategy {
    boolean canSend(StudentUser student);
    void sendEntranceNotification(StudentUser student);
    void sendExitNotification(StudentUser student);
}
