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
            return this.postReservations.isEmpty();
        }

        private record Slot(LocalTime start, LocalTime end) {}
        // TODO: this is not efficient. refactor later!!
        public boolean isUnChanged() {
            if (preReservations.size() != postReservations.size()) {
                return false;
            }

            // LocalTimeをそのまま複合キーとして使う
            Map<Integer, Map<Slot, Integer>> roomToTimeSlots = new HashMap<>();

            // preReservationsをカウント
            for (StudyRoomReservation res : preReservations) {
                int roomId = res.getStudyRoom().getStudyRoomId();
                Slot slot = new Slot(res.getStartHour(), res.getEndHour());
                roomToTimeSlots.put(roomId, Map.of(slot, 1));
            }

            // postReservationsで減算
            for (StudyRoomReservation res : postReservations) {
                int roomId = res.getStudyRoom().getStudyRoomId();
                Slot slot = new Slot(res.getStartHour(), res.getEndHour());

                Map<Slot, Integer> slots = roomToTimeSlots.get(roomId);

                if (slots.remove(slot) == null) {
                    return false;
                }
            }

            return true;
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
