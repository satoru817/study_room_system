package org.example.studyroomreservation.notification;

import java.util.List;

public class DTO {
    public static record NotificationSuccessStatus(int successCount, List<String> failedStudent) {}
}
