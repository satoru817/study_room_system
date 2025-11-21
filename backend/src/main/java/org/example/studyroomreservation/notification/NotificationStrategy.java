package org.example.studyroomreservation.notification;


import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.student.Student;
import org.example.studyroomreservation.student.StudentLoginDTO;

import java.util.List;
import java.util.concurrent.ExecutionException;

public interface NotificationStrategy {
    boolean canSend(StudentLoginDTO student);
    boolean canSend(StudentUser student);
    boolean canSend(Student student);
    void sendEntranceNotification(StudentUser student);
    void sendExitNotification(StudentUser student);
    void sendRegistrationUrl(StudentLoginDTO student, String url, int validPeriod);
    void sendReservationChangeNotification(Student student, DTO.ReservationChangeOfOneDay reservationChangeOfOneDay) throws ExecutionException, InterruptedException;
    void sendReservationChangeNotificationOfMultipleDays(Student student, List<DTO.ReservationChangeOfOneDay> reservationChangeOfOneDayList);
}
