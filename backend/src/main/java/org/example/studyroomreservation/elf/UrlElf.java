package org.example.studyroomreservation.elf;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class UrlElf {
    @Value("${spring.profiles.active:}")
    private String activeProfile;

    public String getBaseUrl(HttpServletRequest request) {
        //TODO: when you deploy this app, the next 3 line should be commented out.
        if (activeProfile.equals("dev")) {
            return "http://localhost:3000";
        }

        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String contextPath = request.getContextPath();

        StringBuilder url = new StringBuilder();
        url.append(scheme).append("://").append(serverName);

        if (serverPort != 80 && serverPort != 443) {
            url.append(":").append(serverPort);
        }

        url.append(contextPath);

        return url.toString();
    }
}
