package org.example.studyroomreservation.notification;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class DTO {
    public static record NotificationSuccessStatus(int successCount, List<String> failedStudent) {}
    public record TimeWindow(LocalTime startHour, LocalTime endHour){}
    // 下のrecordは、特定の生徒のある自習室のある日における予約の変更情報を担う。
    public class ReservationChangeOfOneRoomOfOneDay {

        private int studentId;
        private String studentName;
        private int studyRoomId;
        private String studyRoomName;
        private LocalDate date;
        private List<TimeWindow> preTimeWindows;
        private boolean isAllClosed;
        private List<TimeWindow> postTimeWindow;

        public ReservationChangeOfOneRoomOfOneDay() {
        }

        public ReservationChangeOfOneRoomOfOneDay(
                int studentId,
                String studentName,
                int studyRoomId,
                String studyRoomName,
                LocalDate date,
                List<TimeWindow> preTimeWindows,
                boolean isAllClosed,
                List<TimeWindow> postTimeWindow
        ) {
            this.studentId = studentId;
            this.studentName = studentName;
            this.studyRoomId = studyRoomId;
            this.studyRoomName = studyRoomName;
            this.date = date;
            this.preTimeWindows = preTimeWindows;
            this.isAllClosed = isAllClosed;
            this.postTimeWindow = postTimeWindow;
        }

        // ---------- Getter ----------

        public int getStudentId() {
            return studentId;
        }

        public String getStudentName() {
            return studentName;
        }

        public int getStudyRoomId() {
            return studyRoomId;
        }

        public String getStudyRoomName() {
            return studyRoomName;
        }

        public LocalDate getDate() {
            return date;
        }

        public List<TimeWindow> getPreTimeWindows() {
            return preTimeWindows;
        }

        public boolean isAllClosed() {
            return isAllClosed;
        }

        public List<TimeWindow> getPostTimeWindow() {
            return postTimeWindow;
        }

        // ---------- Fluent Setter (return this) ----------

        public ReservationChangeOfOneRoomOfOneDay setStudentId(int studentId) {
            this.studentId = studentId;
            return this;
        }

        public ReservationChangeOfOneRoomOfOneDay setStudentName(String studentName) {
            this.studentName = studentName;
            return this;
        }

        public ReservationChangeOfOneRoomOfOneDay setStudyRoomId(int studyRoomId) {
            this.studyRoomId = studyRoomId;
            return this;
        }

        public ReservationChangeOfOneRoomOfOneDay setStudyRoomName(String studyRoomName) {
            this.studyRoomName = studyRoomName;
            return this;
        }

        public ReservationChangeOfOneRoomOfOneDay setDate(LocalDate date) {
            this.date = date;
            return this;
        }

        public ReservationChangeOfOneRoomOfOneDay setPreTimeWindows(List<TimeWindow> preTimeWindows) {
            this.preTimeWindows = preTimeWindows;
            return this;
        }

        public ReservationChangeOfOneRoomOfOneDay setAllClosed(boolean allClosed) {
            this.isAllClosed = allClosed;
            return this;
        }

        public ReservationChangeOfOneRoomOfOneDay setPostTimeWindow(List<TimeWindow> postTimeWindow) {
            this.postTimeWindow = postTimeWindow;
            return this;
        }
    }
}
