package org.example.studyroomreservation.notification;

import jakarta.servlet.http.HttpServletRequest;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.elf.UrlElf;
import org.example.studyroomreservation.student.Student;
import org.example.studyroomreservation.student.StudentLoginDTO;
import org.example.studyroomreservation.student.StudentService;
import org.example.studyroomreservation.studyroom.dto;
import org.example.studyroomreservation.studyroom.reservation.ReservationService;
import org.example.studyroomreservation.studyroom.reservation.StudyRoomReservation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    private static final int REGISTRATION_LINK_VALID_PERIOD = 7 * 2;
    private final List<NotificationStrategy> strategies;
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired
    private ReservationService reservationService;
    @Autowired
    private StudentService studentService;
    @Autowired
    private UrlElf urlElf;
    public NotificationService(
            LineNotificationStrategy lineNotificationStrategy,
            EmailNotificationStrategy emailNotificationStrategy
    ) {
        this.strategies = Arrays.asList(lineNotificationStrategy, emailNotificationStrategy);
    }

    public DTO.NotificationSuccessStatus sendRegistrationUrl(List<Integer> studentIds, HttpServletRequest request , int userId) {

        namedParameterJdbcTemplate.update(
                """
                DELETE FROM student_tokens
                WHERE student_id IN (:ids)
                """,
                new MapSqlParameterSource("ids", studentIds)
        );

        // create random UUID for each student
        Map<Integer, String> studentToUUID = studentIds.stream()
                .collect(Collectors.toMap(
                        id -> id,
                        id -> UUID.randomUUID().toString()
                ));

        LocalDateTime createdAt = TokyoTimeElf.getTokyoLocalDateTime();
        LocalDateTime validUntil = createdAt.plusDays(REGISTRATION_LINK_VALID_PERIOD);

        List<MapSqlParameterSource> batchParams = studentIds.stream()
                .map(studentId -> new MapSqlParameterSource()
                        .addValue("token", studentToUUID.get(studentId))
                        .addValue("student_id", studentId)
                        .addValue("user_id", userId)
                        .addValue("valid_until", validUntil)
                        .addValue("created_at", createdAt))
                .toList();
        // save each student's token using batch
        namedParameterJdbcTemplate.batchUpdate(
                """
                INSERT INTO student_tokens (token, student_id, user_id, valid_until, created_at)
                VALUES (:token, :student_id, :user_id, :valid_until, :created_at)
                """,
                batchParams.toArray(new MapSqlParameterSource[0])
        );

        String baseUrl = urlElf.getBaseUrl(request);

        List<StudentLoginDTO> students = studentService.getLoginDtosInIds(studentIds);
        int successCount = 0;
        List<String> failedStudents = new ArrayList<>();
        for (StudentLoginDTO student : students) {
            boolean sent = false;
            try {
                for (NotificationStrategy strategy : strategies) {
                    if (strategy.canSend(student)) {
                        strategy.sendRegistrationUrl(student, getRegistrationUrl(studentToUUID.get(student.getStudentId()), baseUrl), REGISTRATION_LINK_VALID_PERIOD);
                        successCount++;
                        sent = true;
                        break;
                    }
                }
                if (!sent) {
                    failedStudents.add(student.getName());
                }
            } catch (Exception e) {
                failedStudents.add(student.getName());
            }
        }

        return new DTO.NotificationSuccessStatus(successCount, failedStudents);
    }

    private String getRegistrationUrl(String token, String baseUrl) {
        return baseUrl + "/register?token=" + token;
    }
    /*
    * とりあえず、ある日のある一つの予約の変更のメールを送りたい。
    * ある生徒の予約が
    * １：一切変わっていない
    * ２：時間帯が変わっている（途中で途切れたり、２つに分解されたり、遅く始まったりしている場合
    * 3:なくなっている
    * この三通りで文面を変えたほうがいいだろう。というか1の場合はメールを送らなくていい。
    * */
    public DTO.NotificationResult sendNotificationOfReservationChangeOfOneDay(List<StudyRoomReservation> preReservations, List<StudyRoomReservation> changedReservations) {
        Map<Student, Set<StudyRoomReservation>> studentToPreReservationsMap = preReservations.parallelStream()
                .collect(
                        Collectors.groupingBy(
                                StudyRoomReservation::getStudent,
                                Collectors.toSet()
                        )
                );

        Map<Student, Set<StudyRoomReservation>> studentToPostReservationsMap = changedReservations.parallelStream()
                .collect(
                        Collectors.groupingBy(
                                StudyRoomReservation::getStudent,
                                Collectors.toSet()
                        )
                );
        List<DTO.ReservationChangeOfOneDay> changes = studentToPreReservationsMap.entrySet().parallelStream()
                .map(entrySet ->
                    new DTO.ReservationChangeOfOneDay(entrySet.getKey(), entrySet.getValue(), studentToPostReservationsMap.getOrDefault(entrySet.getKey(), new HashSet<>()))
                ).toList();

        return sendReservationChangeNotifications(changes);
    }

    private DTO.NotificationResult sendReservationChangeNotifications(List<DTO.ReservationChangeOfOneDay> changes) {
        int successCount = 0;
        List<String> failedStudents = new ArrayList<>();
        for (DTO.ReservationChangeOfOneDay change : changes) {
            if (change.isUnChanged()) continue;

            Student student = change.getStudent();
            try {
                for (NotificationStrategy strategy : strategies) {
                    if (strategy.canSend(student)) {
                        strategy.sendReservationChangeNotification(student, change);
                        successCount++;
                        break;
                    }
                }
            } catch (Exception e) {
                failedStudents.add(student.getName());
            }
        }

        return new DTO.NotificationResult(successCount, failedStudents);
    }

    public DTO.NotificationResult modifyReservationsAndSendNotifications(int studyRoomId, List<dto.StudyRoomRegularScheduleDTO> updatedRegularSchedule) {
        StudyRoomReservation.PrePostReservationsPair pair = reservationService.complyWithNewRegularSchedule(studyRoomId, updatedRegularSchedule);
        // pairを利用してメール/LINEの送信を行う
        return sendNotificationOfChangeOfReservationsDueToUpdateOfRegularSchedules(pair);
    }

    private DTO.NotificationResult sendNotificationOfChangeOfReservationsDueToUpdateOfRegularSchedules(StudyRoomReservation.PrePostReservationsPair pair) {
        //ここで何をしたいのか？
        // 生徒の予約が変更されている可能性があるわけだ。
        // しかも複数日に渡って。
        //Student List<DTO.ReeservationChangeOfOneDay>をつくって、通知を送って、送信結果をまとめて、NotificationResultにして、返せばいい。
        Map<Student, Map<LocalDate, Set<StudyRoomReservation>>> preReservation = segmentReservations.apply(pair.preReservations());
        Map<Student, Map<LocalDate, Set<StudyRoomReservation>>> postReservation = segmentReservations.apply(pair.postReservations());
        Map<Student, List<DTO.ReservationChangeOfOneDay>> studentToReservationChanges = preReservation.entrySet()
                .parallelStream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entrySet -> {
                            Student student = entrySet.getKey();
                            Map<LocalDate, Set<StudyRoomReservation>> pres = entrySet.getValue();
                            Map<LocalDate, Set<StudyRoomReservation>> post = postReservation.getOrDefault(student, Map.of());
                            List<DTO.ReservationChangeOfOneDay> list = pres.entrySet().parallelStream()
                                    .map(
                                            dateToSetEntry -> {
                                                LocalDate date = dateToSetEntry.getKey();
                                                Set<StudyRoomReservation> postReservationsOfTheDay = post.getOrDefault(date, Set.of());
                                                return new DTO.ReservationChangeOfOneDay(student, dateToSetEntry.getValue(), postReservationsOfTheDay);
                                            }
                                    ).toList();
                            return list;
                        }
                ));

        AtomicInteger successCount = new AtomicInteger();
        List<String> failedStudents = new ArrayList<>();
        studentToReservationChanges.entrySet().forEach(
                studentListEntry -> {
                    Student student = studentListEntry.getKey();
                    List<DTO.ReservationChangeOfOneDay> changes = studentListEntry.getValue();
                    try {
                        for (NotificationStrategy strategy : strategies) {
                            if (strategy.canSend(student)) {
                                strategy.sendReservationChangeNotificationOfMultipleDays(student, changes);
                                successCount.getAndIncrement();
                                break;
                            }
                        }
                    } catch (Exception e) {
                        failedStudents.add(student.getName());
                    }
                }
        );

        return new DTO.NotificationResult(successCount.get(), failedStudents);
    }

    private final Function<Collection<StudyRoomReservation>, Map<Student, Map<LocalDate, Set<StudyRoomReservation>>>> segmentReservations = (reservations) -> reservations.parallelStream()
            .collect(Collectors.groupingBy(
                    StudyRoomReservation::getStudent,
                    Collectors.groupingBy(
                            StudyRoomReservation::getDate,
                            Collectors.toSet()
                    )
            ));
}
