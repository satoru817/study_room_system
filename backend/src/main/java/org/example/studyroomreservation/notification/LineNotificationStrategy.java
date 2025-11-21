package org.example.studyroomreservation.notification;

import com.linecorp.bot.client.LineMessagingClient;
import com.linecorp.bot.model.PushMessage;
import com.linecorp.bot.model.action.URIAction;
import com.linecorp.bot.model.message.FlexMessage;
import com.linecorp.bot.model.message.flex.component.Box;
import com.linecorp.bot.model.message.flex.component.Button;
import com.linecorp.bot.model.message.flex.component.FlexComponent;
import com.linecorp.bot.model.message.flex.component.Text;
import com.linecorp.bot.model.message.flex.container.Bubble;
import com.linecorp.bot.model.message.flex.unit.FlexFontSize;
import com.linecorp.bot.model.message.flex.unit.FlexLayout;
import com.linecorp.bot.model.message.flex.unit.FlexMarginSize;
import com.linecorp.bot.model.message.flex.unit.FlexPaddingSize;
import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.elf.StringElf;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.student.Student;
import org.example.studyroomreservation.student.StudentLoginDTO;
import org.example.studyroomreservation.studyroom.reservation.StudyRoomReservation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ExecutionException;

@Component
public class LineNotificationStrategy implements NotificationStrategy{
    private static final  Logger log = LoggerFactory.getLogger(LineNotificationStrategy.class);
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("M月d日(E)", Locale.JAPAN);
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm");
    @Override
    public boolean canSend(StudentUser student) {
        return StringElf.isValid(student.getLineUserId()) && StringElf.isValid(student.getCramSchoolLineChannelToken());
    }

    @Override
    public boolean canSend(Student student) {
        return StringElf.isValid(student.getLineUserId()) && StringElf.isValid(student.getCramSchool().getLineChannelToken());
    }

    @Override
    public boolean canSend(StudentLoginDTO student) {
        return StringElf.isValid(student.getLineUserId()) && StringElf.isValid(student.getCramSchoolLineChannelToken());
    }

    @Override
    public void sendEntranceNotification(StudentUser student) {
        FlexMessage message = createAttendanceLineFlexMessage(student.getStudentName() + "さん自習室入室連絡", student.getStudentName(), "自習室入室", TokyoTimeElf.getFormattedTime());
        sendLineShared(student, message);
    }

    @Override
    public void sendExitNotification(StudentUser student) {
        FlexMessage message = createAttendanceLineFlexMessage(student.getStudentName() + "さん自習室退室連絡", student.getStudentName(), "自習室退室", TokyoTimeElf.getFormattedTime());
        sendLineShared(student, message);
    }

    @Override
    public void sendRegistrationUrl(StudentLoginDTO student, String url, int validPeriod) {
        try {
            FlexMessage message = createRegistrationLineFlexMessage(student, url, validPeriod);
            sendLineShared(student, message);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void sendReservationChangeNotification(Student student, DTO.ReservationChangeOfOneDay reservationChangeOfOneDay) throws ExecutionException, InterruptedException {
        FlexMessage changeReservationMessage = createChangeReservationMessage(student, reservationChangeOfOneDay);
        sendLine(student.getCramSchool().getLineChannelToken(), student.getLineUserId(), changeReservationMessage);
    }

    @Override
    public boolean sendReservationChangeNotificationOfMultipleDays(Student student, List<DTO.ReservationChangeOfOneDay> reservationChangeOfOneDayList) {
        if (!canSend(student) || reservationChangeOfOneDayList == null || reservationChangeOfOneDayList.isEmpty()) {
            return false;
        }

        List<DTO.ReservationChangeOfOneDay> changes = reservationChangeOfOneDayList.stream()
                .filter(Objects::nonNull)
                .filter(change -> !change.isUnChanged())
                .sorted(Comparator.comparing(DTO.ReservationChangeOfOneDay::getDate))
                .toList();

        if (changes.isEmpty()) {
            return false;
        }

        if (changes.size() == 1) {
            try {
                sendReservationChangeNotification(student, changes.get(0));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("LINE送信エラー", e);
            } catch (ExecutionException e) {
                throw new RuntimeException("LINE送信エラー", e);
            }

            return true;
        }

        try {
            FlexMessage message = createChangeReservationMessageForMultipleDays(student, changes);
            sendLine(student.getCramSchool().getLineChannelToken(), student.getLineUserId(), message);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("LINE送信エラー", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("LINE送信エラー", e);
        }

        return true;
    }

    private FlexMessage createChangeReservationMessage(Student student, DTO.ReservationChangeOfOneDay reservationChangeOfOneDay) {
        Text title = getTitle("予約自動変更のお知らせ");
        Text message = getHeadMessage(student.getName(), "様");
        List<FlexComponent> components = new ArrayList<>();
        components.add(title);
        components.add(message);
        LocalDate changeDate = reservationChangeOfOneDay.getDate();

        if (reservationChangeOfOneDay.isUnChanged()) {
            components.add(createBodyText(changeDate + "のご予約内容に変更はありませんでした。"));
        } else {
            if (reservationChangeOfOneDay.isDeleted()) {
                components.add(createBodyText(changeDate + "の自習室予約は自動的にキャンセルされました。"));
            } else {
                components.add(createBodyText(changeDate + "の自習室の予約時間を自動調整いたしました。"));
            }
            components.add(createReservationSummary("変更前", reservationChangeOfOneDay.getPreReservations()));
            components.add(createReservationSummary("変更後", reservationChangeOfOneDay.getPostReservations()));
        }
        components.add(createBodyText("ご不明点がございましたら翔栄学院までお問い合わせください。"));

        Box body = getBox(components);
        Bubble bubble = createFromBody(body);
        return new FlexMessage("予約自動変更のお知らせ", bubble);
    }

    private FlexMessage createChangeReservationMessageForMultipleDays(Student student, List<DTO.ReservationChangeOfOneDay> reservationChanges) {
        Text title = getTitle("複数日の予約自動変更のお知らせ");
        Text message = getHeadMessage(student.getName(), "様");
        List<FlexComponent> components = new ArrayList<>();
        components.add(title);
        components.add(message);
        components.add(createBodyText("以下の日程で自習室予約の変更がありました。"));

        for (DTO.ReservationChangeOfOneDay change : reservationChanges) {
            components.add(createDayHeader(change.getDate()));
            if (change.isDeleted()) {
                components.add(createBodyText(formatDate(change.getDate()) + "の自習室予約は自動的にキャンセルされました。"));
            } else {
                components.add(createBodyText(formatDate(change.getDate()) + "の自習室予約を自動調整いたしました。"));
            }
            components.add(createReservationSummary("変更前", change.getPreReservations()));
            components.add(createReservationSummary("変更後", change.getPostReservations()));
        }

        components.add(createBodyText("ご不明点がございましたら翔栄学院までお問い合わせください。"));

        Box body = getBox(components);
        Bubble bubble = createFromBody(body);
        return new FlexMessage("複数日の予約自動変更のお知らせ", bubble);
    }

    private Text createDayHeader(LocalDate date) {
        return Text.builder()
                .text(formatDate(date))
                .weight(Text.TextWeight.BOLD)
                .margin(FlexMarginSize.LG)
                .size(FlexFontSize.Md)
                .build();
    }

    private String formatDate(LocalDate date) {
        return date.format(DATE_FORMATTER);
    }

    private Text createBodyText(String text) {
        return Text.builder()
                .text(text)
                .wrap(true)
                .margin(FlexMarginSize.MD)
                .size(FlexFontSize.Md)
                .build();
    }

    private Box createReservationSummary(String label, Set<StudyRoomReservation> reservations) {
        List<FlexComponent> contents = new ArrayList<>();
        contents.add(Text.builder()
                .text(label)
                .weight(Text.TextWeight.BOLD)
                .margin(FlexMarginSize.MD)
                .size(FlexFontSize.Md)
                .build());

        if (reservations == null || reservations.isEmpty()) {
            contents.add(Text.builder()
                    .text("なし")
                    .size(FlexFontSize.SM)
                    .color("#888888")
                    .margin(FlexMarginSize.SM)
                    .wrap(true)
                    .build());
        } else {
            reservations.stream()
                    .sorted(Comparator
                            .comparing(StudyRoomReservation::getDate)
                            .thenComparing(StudyRoomReservation::getStartHour))
                    .forEach(reservation -> contents.add(Text.builder()
                            .text(formatReservation(reservation))
                            .size(FlexFontSize.SM)
                            .wrap(true)
                            .margin(FlexMarginSize.SM)
                            .build()));
        }

        return Box.builder()
                .layout(FlexLayout.VERTICAL)
                .contents(contents)
                .margin(FlexMarginSize.MD)
                .build();
    }

    private String formatReservation(StudyRoomReservation reservation) {
        String date = reservation.getDate().format(DATE_FORMATTER);
        String timeWindow = reservation.getStartHour().format(TIME_FORMATTER)
                + "〜" + reservation.getEndHour().format(TIME_FORMATTER);
        String roomName = reservation.getStudyRoom() != null
                ? reservation.getStudyRoom().getName()
                : "";
        return date + " " + timeWindow + (roomName.isBlank() ? "" : " / " + roomName);
    }

    private void sendLineShared(StudentUser studentUser, FlexMessage message) {
        try {
            sendLine(studentUser.getCramSchoolLineChannelToken(), studentUser.getLineUserId(), message);
        } catch (InterruptedException | ExecutionException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.error("LINE送信失敗: {}", studentUser.getStudentName(), e);
            throw new RuntimeException("LINE送信エラー", e);
        }
    }

    private void sendLine(String lineChannelAccessToken, String lineUserId, FlexMessage message) throws ExecutionException, InterruptedException {
        LineMessagingClient client = LineMessagingClient
                .builder(lineChannelAccessToken)
                .build();

        client.pushMessage(new PushMessage(
                lineUserId,
                Collections.singletonList(message)
        )).get();
    }

    private void sendLineShared(StudentLoginDTO student, FlexMessage message) throws ExecutionException, InterruptedException {
        sendLine(student.getCramSchoolLineChannelToken(), student.getLineUserId(), message);
    }

    private FlexMessage createRegistrationLineFlexMessage(StudentLoginDTO student, String url ,int validPeriod) {
        Text title = getTitle("翔栄学院入退室システム登録のお願い");
        Text message = getHeadMessage(student.getName() , "様");
        Button link = getLinkBtn("以下のリンクをクリックしてシステムに登録してください", url);
        Text note = createNote(validPeriod);
        Box body = getBox(Arrays.asList(title, message, link, note));
        Bubble bubble = createFromBody(body);
        return new FlexMessage("翔栄学院入退室システム登録のお願い", bubble);
    }

    private FlexMessage createAttendanceLineFlexMessage(String subject, String studentName, String action, String formattedTime) {
        Text title = getTitle(subject);
        Text message = getHeadMessage(studentName, "さんが" + formattedTime + "に" + action + "しました。");
        Box body = getBox(Arrays.asList(title, message));
        Bubble bubble = createFromBody(body);
        return new FlexMessage(subject, bubble);
    }

    private Text getTitle(String subject) {
        return Text.builder()
                .text(subject)
                .weight(Text.TextWeight.BOLD)
                .size(FlexFontSize.XL)
                .color("#1DB446")
                .build();
    }

    private Box getBox(List<FlexComponent> components) {
        return Box.builder()
                .layout(FlexLayout.VERTICAL)
                .contents(components)
                .paddingAll(FlexPaddingSize.LG)
                .build();
    }

    private Button getLinkBtn(String message, String url) {
        return Button.builder()
                .style(Button.ButtonStyle.PRIMARY)
                .action(new URIAction(message, URI.create(url), null))
                .margin(FlexMarginSize.MD)
                .height(Button.ButtonHeight.MEDIUM)
                .build();
    }

    private Text getHeadMessage(String studentName, String adding) {
        return Text.builder()
                .text(studentName + adding)
                .wrap(true)
                .margin(FlexMarginSize.MD)
                .size(FlexFontSize.Md)
                .build();
    }

    private Text createNote(int duration) {
        return Text.builder()
                .text("このリンクは" + duration + "日間有効です。\nこのメッセージは自動送信されています。\nご質問等は翔栄学院までお問い合わせください。")
                .size(FlexFontSize.SM)
                .color("#888888")
                .wrap(true)
                .margin(FlexMarginSize.LG)
                .build();
    }

    private Bubble createFromBody(Box body) {
        return Bubble.builder()
                .body(body).build();
    }
}
