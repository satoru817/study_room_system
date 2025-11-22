package org.example.studyroomreservation.notification;

import org.example.studyroomreservation.student.Student;
import org.example.studyroomreservation.studyroom.reservation.StudyRoomReservation;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

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
            return this.postReservations.isEmpty();
        }

        private record Slot(LocalTime start, LocalTime end) {}

        public boolean isUnChanged() {
            Set<ReservationKey> preSet = preReservations.stream()
                    .map(ReservationKey::from)
                    .collect(Collectors.toSet());

            Set<ReservationKey> postSet = postReservations.stream()
                    .map(ReservationKey::from)
                    .collect(Collectors.toSet());

            return preSet.equals(postSet);
        }

    }

    public static class ReservationKey {
        private final int roomId;
        private final LocalTime start;
        private final LocalTime end;

        public ReservationKey(int roomId, LocalTime start, LocalTime end) {
            this.roomId = roomId;
            this.start = start;
            this.end = end;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof ReservationKey)) return false;
            ReservationKey that = (ReservationKey) o;
            return roomId == that.roomId &&
                    start.equals(that.start) &&
                    end.equals(that.end);
        }

        @Override
        public int hashCode() {
            return Objects.hash(roomId, start, end);
        }

        public static ReservationKey from(StudyRoomReservation res) {
            return new ReservationKey(
                    res.getStudyRoom().getStudyRoomId(),
                    res.getStartHour(),
                    res.getEndHour()
            );
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
            return failedStudents.isEmpty();
        }

    }

    public record StudyRoomScheduleExceptionShowResponse(int studyRoomId, LocalDate date, boolean isOpen, LocalTime openTime, LocalTime closeTime, String reason){}

    public record ScheduleExceptionsAndNotificationResult(List<StudyRoomScheduleExceptionShowResponse> scheduleExceptions, NotificationResult notificationResult){}
}
