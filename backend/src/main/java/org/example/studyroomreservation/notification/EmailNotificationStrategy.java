package org.example.studyroomreservation.notification;

import jakarta.annotation.PostConstruct;
import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.elf.StringElf;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.student.Student;
import org.example.studyroomreservation.student.StudentLoginDTO;
import org.example.studyroomreservation.studyroom.reservation.StudyRoomReservation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import sendinblue.ApiClient;
import sendinblue.ApiException;
import sendinblue.Configuration;
import sendinblue.auth.ApiKeyAuth;
import sibApi.TransactionalEmailsApi;
import sibModel.SendSmtpEmail;
import sibModel.SendSmtpEmailSender;
import sibModel.SendSmtpEmailTo;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
@Component
public class EmailNotificationStrategy implements NotificationStrategy{
    private static final Logger log = LoggerFactory.getLogger(EmailNotificationStrategy.class);
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("M月d日(E)", Locale.JAPAN);
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm");
    private TransactionalEmailsApi apiInstance;
    @Value("${sendinblue.api-key}")
    private String apiKey;

    @PostConstruct
    public void init() {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKeyAuth = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKeyAuth.setApiKey(apiKey);
        this.apiInstance = new TransactionalEmailsApi();
        // ログで成功確認（本番では削除）
        System.out.println("APIキー設定済み: " + (apiKey != null && !apiKey.isEmpty()));
    }

    @Override
    public boolean canSend(StudentUser student) {
        return StringElf.isValid(student.getStudentEmail())
                && StringElf.isValid(student.getCramSchoolEmail());
    }

    @Override
    public boolean canSend(Student student) {
        return StringElf.isValid(student.getMail()) && StringElf.isValid(student.getCramSchool().getEmail());
    }

    @Override
    public boolean canSend(StudentLoginDTO student) {
        return StringElf.isValid(student.getCramSchoolEmail()) && StringElf.isValid(student.getMail());
    }

    @Override
    public void sendEntranceNotification(StudentUser student) {
        log.info("sending check-in email to: {}", student.getStudentName());
        String formattedTime = TokyoTimeElf.getFormattedTime();

        sendEmail(student,
                createEntranceHtml(student, formattedTime),
                createEntranceText(student, formattedTime),
                student.getStudentName() + "さん自習室入室連絡"
        );
    }

    @Override
    public void sendExitNotification(StudentUser student) {
        log.info("sending check-out email to: {}", student.getStudentName());
        String formattedTime = TokyoTimeElf.getFormattedTime();

        sendEmail(student,
                createExitHtml(student, formattedTime),
                createExitText(student, formattedTime),
                student.getStudentName() + "さん自習室退室連絡"
        );
    }

    @Override
    public void sendRegistrationUrl(StudentLoginDTO student, String url, int validPeriod) {
        log.info("Sending registration URL email - Student: {}, Email: {}, CramSchool: {}, ValidPeriod: {} days",
                student.getName(), student.getMail(), student.getCramSchoolName(), validPeriod);

        try {
            sendEmail(student, createRegistrationHTML(student, url, validPeriod),
                    createRegistrationText(student, url, validPeriod),
                    "翔栄学院入退室システム登録のお願い"
            );
            log.info("Registration URL email sent successfully - Student: {}, Email: {}",
                    student.getName(), student.getMail());
        } catch (ApiException e) {
            log.error("Failed to send registration URL email - Student: {}, Email: {}, Error: {}, Response: {}",
                    student.getName(), student.getMail(), e.getMessage(), e.getResponseBody(), e);
            throw new RuntimeException("Failed to send registration URL email to " + student.getMail(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending registration URL email - Student: {}, Email: {}",
                    student.getName(), student.getMail(), e);
            throw new RuntimeException("Failed to send registration URL email to " + student.getMail(), e);
        }
    }

    @Override
    public void sendReservationChangeNotification(Student student, DTO.ReservationChangeOfOneDay reservationChangeOfOneDay) {
        if (!canSend(student)) {
            log.info("Skip reservation-change email because student/cram-school email missing: {}", student.getName());
            return;
        }
        LocalDate changeDate = reservationChangeOfOneDay.getDate();
        String subject = "自習室予約変更のお知らせ";
        String htmlContent = createChangeReservationHtml(student, changeDate, reservationChangeOfOneDay);
        String textContent = createChangeReservationText(student, changeDate, reservationChangeOfOneDay);
        sendEmail(student, htmlContent, textContent, subject);
    }

    private String createRegistrationHTML(StudentLoginDTO student, String url, int validPeriod) {
        return """
                <html>
                    <body>
                        <h1>翔栄学院入退室システム登録のお願い</h1>
                        <p>""" + student.getName() + """
                        様</p>
                        <p>以下のリンクをクリックしてシステムに登録してください。</p>
                        <p><a href=""" + url + " >登録リンク</a></p> " + """
                        <p>このリンクは""" + validPeriod + "日有効です。</p> " + """
                        <hr>
                        <p>このメールはシステムにより自動送信されています。</br>
                        ご質問等は翔栄学院までお問い合わせください。</p>
                    </body>
                </html>""";
    }

    private String createRegistrationText(StudentLoginDTO student, String url, int validPeriod) {
        return          """
                        翔栄学院入退室システム登録のお願い
                        
                        """ + student.getName() + """
                        様
                       \n
                        以下のリンクをクリックしてシステムに登録してください。
                       \n
                        登録リンク:\s""" + url +  """ 
                        
                        このリンクは""" + validPeriod + "日有効です。" + """
                        ────────────────────────────
                        このメールはシステムにより自動送信されています。
                        ご質問等は翔栄学院までお問い合わせください。
                        """;
    }

    private String createEntranceHtml(StudentUser student, String formattedTime) {
        return """
            <html>
                <body>
                    <h1>自習室入室連絡</h1>
                    <p>%sさんが%sに自習室に入室しました。</p>
                    <p>このメールはシステムにより自動送信されています。<br>
                    ご質問は翔栄学院までお問い合わせください。</p>
                </body>
            </html>
            """.formatted(student.getStudentName(), formattedTime);
    }

    private String createEntranceText(StudentUser student, String formattedTime) {
        return """
            入室連絡
            %sさんが%sに自習室に入室しました。
            
            このメールはシステムにより自動送信されています。
            ご質問は翔栄学院までお問い合わせください。
            """.formatted(student.getStudentName(), formattedTime);
    }

    private String createExitHtml(StudentUser student, String formattedTime) {
        return """
            <html>
                <body>
                    <h1>自習室退室連絡</h1>
                    <p>%sさんが%sに自習室から退室しました。</p>
                    <p>このメールはシステムにより自動送信されています。<br>
                    ご質問は翔栄学院までお問い合わせください。</p>
                </body>
            </html>
            """.formatted(student.getStudentName(), formattedTime);
    }

    private String createExitText(StudentUser student, String formattedTime) {
        return """
            自習室退室連絡
            %sさんが%sに自習室から退室しました。
            
            このメールはシステムにより自動送信されています。
            ご質問は翔栄学院までお問い合わせください。
            """.formatted(student.getStudentName(), formattedTime);
    }

    private void sendEmail(StudentUser student, String htmlContent,
                           String textContent, String subject) {
        log.info("Preparing to send email - Recipient: {} ({}), Subject: '{}', Sender: {} ({})",
                student.getStudentName(), student.getStudentEmail(), subject,
                student.getCramSchoolName(), student.getCramSchoolEmail());

        try {
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setName(student.getCramSchoolName());
            sender.setEmail(student.getCramSchoolEmail());

            SendSmtpEmail email = new SendSmtpEmail();
            email.setSender(sender);
            email.setTo(Collections.singletonList(
                    new SendSmtpEmailTo().email(student.getStudentEmail())
            ));
            email.setSubject(subject);
            email.setHtmlContent(htmlContent);
            email.setTextContent(textContent);

            log.debug("Sending transactional email via API - Recipient: {}", student.getStudentEmail());
            apiInstance.sendTransacEmail(email);
            log.info("Email sent successfully - Recipient: {} ({}), Subject: '{}'",
                    student.getStudentName(), student.getStudentEmail(), subject);

        } catch (ApiException e) {
            log.error("API error sending email - Recipient: {} ({}), Subject: '{}', StatusCode: {}, Error: {}, Response: {}",
                    student.getStudentName(), student.getStudentEmail(), subject,
                    e.getCode(), e.getMessage(), e.getResponseBody(), e);
            throw new RuntimeException("Failed to send email to " + student.getStudentEmail() + ": " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending email - Recipient: {} ({}), Subject: '{}'",
                    student.getStudentName(), student.getStudentEmail(), subject, e);
            throw new RuntimeException("Failed to send email to " + student.getStudentEmail(), e);
        }
    }

    private void sendEmail(StudentLoginDTO student, String htmlContent, String textContent, String subject) throws ApiException {
        log.info("Preparing to send email - Recipient: {} ({}), Subject: '{}', Sender: {} ({})",
                student.getName(), student.getMail(), subject,
                student.getCramSchoolName(), student.getCramSchoolEmail());

        try {
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setName(student.getCramSchoolName());
            sender.setEmail(student.getCramSchoolEmail());

            SendSmtpEmail email = new SendSmtpEmail();
            email.setSender(sender);
            email.setTo(Collections.singletonList(
                    new SendSmtpEmailTo().email(student.getMail())
            ));
            email.setSubject(subject);
            email.setHtmlContent(htmlContent);
            email.setTextContent(textContent);

            log.debug("Sending transactional email via API - Recipient: {}", student.getMail());
            apiInstance.sendTransacEmail(email);
            log.info("Email sent successfully - Recipient: {} ({}), Subject: '{}'",
                    student.getName(), student.getMail(), subject);

        } catch (ApiException e) {
            log.error("API error sending email - Recipient: {} ({}), Subject: '{}', StatusCode: {}, Error: {}, Response: {}",
                    student.getName(), student.getMail(), subject,
                    e.getCode(), e.getMessage(), e.getResponseBody(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error sending email - Recipient: {} ({}), Subject: '{}'",
                    student.getName(), student.getMail(), subject, e);
            throw new RuntimeException("Failed to send email to " + student.getMail(), e);
        }
    }

    private String createChangeReservationHtml(Student student, LocalDate changeDate, DTO.ReservationChangeOfOneDay change) {
        StringBuilder html = new StringBuilder();
        html.append("<html><body>");
        html.append("<h1>自習室予約変更のお知らせ</h1>");
        html.append("<p>").append(student.getName()).append("様</p>");
        html.append("<p>").append(formatDate(changeDate)).append("の自習室予約についてお知らせいたします。</p>");
        html.append("<p>").append(buildChangeMessage(change)).append("</p>");
        html.append("<h2>変更前</h2>");
        html.append(buildReservationListHtml(change.getPreReservations()));
        html.append("<h2>変更後</h2>");
        html.append(buildReservationListHtml(change.getPostReservations()));
        html.append("<p>ご不明点がございましたら翔栄学院までお問い合わせください。</p>");
        html.append("<p>このメールはシステムにより自動送信されています。</p>");
        html.append("</body></html>");
        return html.toString();
    }

    private String createChangeReservationText(Student student, LocalDate changeDate, DTO.ReservationChangeOfOneDay change) {
        StringBuilder text = new StringBuilder();
        text.append("自習室予約変更のお知らせ").append("\n\n");
        text.append(student.getName()).append("様").append("\n\n");
        text.append(formatDate(changeDate)).append("の自習室予約についてお知らせいたします。\n");
        text.append(buildChangeMessage(change)).append("\n\n");
        text.append("【変更前】\n");
        text.append(buildReservationListText(change.getPreReservations()));
        text.append("\n【変更後】\n");
        text.append(buildReservationListText(change.getPostReservations()));
        text.append("\nご不明点がございましたら翔栄学院までお問い合わせください。\n");
        text.append("このメールはシステムにより自動送信されています。");
        return text.toString();
    }

    private String buildChangeMessage(DTO.ReservationChangeOfOneDay change) {
        if (change.isUnChanged()) {
            return "ご予約内容に変更はありませんでした。";
        }
        if (change.isDeleted()) {
            return "該当日のご予約は開室スケジュール変更のため自動的にキャンセルされました。";
        }
        return "以下の通り自習室の予約時間を自動調整いたしました。";
    }

    private String buildReservationListHtml(Set<StudyRoomReservation> reservations) {
        if (reservations == null || reservations.isEmpty()) {
            return "<p>予約なし</p>";
        }
        StringBuilder sb = new StringBuilder("<ul>");
        sortedReservations(reservations).forEach(res -> sb.append("<li>")
                .append(formatReservation(res))
                .append("</li>"));
        sb.append("</ul>");
        return sb.toString();
    }

    private String buildReservationListText(Set<StudyRoomReservation> reservations) {
        if (reservations == null || reservations.isEmpty()) {
            return "なし\n";
        }
        StringBuilder sb = new StringBuilder();
        sortedReservations(reservations).forEach(res -> sb.append("・")
                .append(formatReservation(res))
                .append("\n"));
        return sb.toString();
    }

    private List<StudyRoomReservation> sortedReservations(Set<StudyRoomReservation> reservations) {
        return reservations.stream()
                .sorted(Comparator
                        .comparing(StudyRoomReservation::getDate)
                        .thenComparing(StudyRoomReservation::getStartHour))
                .toList();
    }

    private String formatReservation(StudyRoomReservation reservation) {
        String date = formatDate(reservation.getDate());
        String timeRange = reservation.getStartHour().format(TIME_FORMATTER)
                + "〜" + reservation.getEndHour().format(TIME_FORMATTER);
        String roomName = reservation.getStudyRoom() != null ? reservation.getStudyRoom().getName() : "";
        return date + " " + timeRange + (roomName.isBlank() ? "" : " / " + roomName);
    }

    private String formatDate(LocalDate date) {
        return date.format(DATE_FORMATTER);
    }

    private void sendEmail(Student student, String htmlContent,
                           String textContent, String subject) {
        log.info("Preparing to send email - Recipient: {} ({}), Subject: '{}', Sender: {} ({})",
                student.getName(), student.getMail(), subject,
                student.getCramSchool().getName(), student.getCramSchool().getEmail());

        try {
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setName(student.getCramSchool().getName());
            sender.setEmail(student.getCramSchool().getEmail());

            SendSmtpEmail email = new SendSmtpEmail();
            email.setSender(sender);
            email.setTo(Collections.singletonList(
                    new SendSmtpEmailTo().email(student.getMail())
            ));
            email.setSubject(subject);
            email.setHtmlContent(htmlContent);
            email.setTextContent(textContent);

            log.debug("Sending transactional email via API - Recipient: {}", student.getMail());
            apiInstance.sendTransacEmail(email);
            log.info("Email sent successfully - Recipient: {} ({}), Subject: '{}'",
                    student.getName(), student.getMail(), subject);

        } catch (ApiException e) {
            log.error("API error sending email - Recipient: {} ({}), Subject: '{}', StatusCode: {}, Error: {}, Response: {}",
                    student.getName(), student.getMail(), subject,
                    e.getCode(), e.getMessage(), e.getResponseBody(), e);
            throw new RuntimeException("Failed to send email to " + student.getMail() + ": " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending email - Recipient: {} ({}), Subject: '{}'",
                    student.getName(), student.getMail(), subject, e);
            throw new RuntimeException("Failed to send email to " + student.getMail(), e);
        }
    }
}