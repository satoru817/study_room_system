package org.example.studyroomreservation.notification;


import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.student.Student;
import org.example.studyroomreservation.student.StudentLoginDTO;

public interface NotificationStrategy {
    boolean canSend(StudentLoginDTO student);
    boolean canSend(StudentUser student);
    void sendEntranceNotification(StudentUser student);
    void sendExitNotification(StudentUser student);
    void sendRegistrationUrl(StudentLoginDTO student, String url, int validPeriod);
}
