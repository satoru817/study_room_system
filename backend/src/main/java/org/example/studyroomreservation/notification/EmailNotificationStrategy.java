package org.example.studyroomreservation.notification;

import jakarta.annotation.PostConstruct;
import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.elf.StringElf;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.student.StudentLoginDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

import java.util.Collections;
@Component
public class EmailNotificationStrategy implements NotificationStrategy{
    private static final Logger log = LoggerFactory.getLogger(EmailNotificationStrategy.class);

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
        log.info("sending registration-url email to: {}", student);
        try {
            sendEmail(student, createRegistrationHTML(student, url, validPeriod),
                    createRegistrationText(student, url, validPeriod),
                    "翔栄学院入退室システム登録のお願い"
            );
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
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

            apiInstance.sendTransacEmail(email);
            log.info("Email sent successfully to: {}", student.getStudentEmail());

        } catch (ApiException e) {
            log.error("Failed to send email to: {}", student.getStudentEmail(), e);
            throw new RuntimeException("Email sending failed", e);
        }
    }

    private void sendEmail(StudentLoginDTO student, String htmlContent, String textContent, String subject) throws ApiException {
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

        apiInstance.sendTransacEmail(email);
        log.info("Email sent successfully to: {}", student.getMail());
    }
}