package org.example.studyroomreservation.notification;

import org.example.studyroomreservation.student.Student;
import org.example.studyroomreservation.studyroom.reservation.StudyRoomReservation;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

public class DTO {
    public static record NotificationSuccessStatus(int successCount, List<String> failedStudent) {}
    public record TimeWindow(LocalTime startHour, LocalTime endHour){}

    public static class ReservationChangeOfOneDay{
        private Student student;
        private Set<StudyRoomReservation> preReservations;
        private Set<StudyRoomReservation> postReservations;

        public ReservationChangeOfOneDay(Student student, Set<StudyRoomReservation> preReservations, Set<StudyRoomReservation> postReservations) {
            this.student = student;
            this.preReservations = preReservations;
            this.postReservations = postReservations;
        }

        public Student getStudent() {
            return student;
        }

        public LocalDate getDate() {
            return preReservations.stream().findFirst().get().getDate();
        }

        public Set<StudyRoomReservation> getPreReservations() {
            return Collections.unmodifiableSet(preReservations);
        }

        public Set<StudyRoomReservation> getPostReservations() {
            return Collections.unmodifiableSet(postReservations);
        }
        public boolean isDeleted() {
            return this.postReservations.size() == 0;
        }

        private record Slot(LocalTime start, LocalTime end) {}

        public boolean isUnChanged() {
            if (preReservations.size() != postReservations.size()) {
                return false;
            }

            Set<Slot> slots = new HashSet<>();
            for (StudyRoomReservation res : preReservations) {
                slots.add(new Slot(res.getStartHour(), res.getEndHour()));
            }
            for (StudyRoomReservation res : postReservations) {
                if (!slots.remove(new Slot(res.getStartHour(), res.getEndHour()))) {
                    return false;
                }
            }
            return slots.isEmpty();
        }
    }

    public static class NotificationResult {
        public final int successCount;
        public final List<String> failedStudents;
        public NotificationResult(int successCount, List<String> failedStudents) {
            this.successCount = successCount;
            this. failedStudents = failedStudents;
        }

        public boolean isAllSuccess() {
            return failedStudents.size() == 0;
        }

    }



    public record StudyRoomScheduleExceptionShowResponse(int studyRoomId, LocalDate date, boolean isOpen, LocalTime openTime, LocalTime closeTime, String reason){}

    public record ScheduleExceptionsAndNotificationResult(List<StudyRoomScheduleExceptionShowResponse> scheduleExceptions, NotificationResult notificationResult){}
}
