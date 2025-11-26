package org.example.studyroomreservation.config;

// WebConfig.java
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 1) 無効化: 拡張子による content negotiation を OFF に
    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer.favorPathExtension(false);
    }

    // 2) 安全な HTML リライト用 Filter を登録
    @Bean
    public FilterRegistrationBean<Filter> htmlRewriteFilter() {
        FilterRegistrationBean<Filter> reg = new FilterRegistrationBean<>();
        reg.setFilter(new HtmlRewriteFilter());
        reg.addUrlPatterns("/*");
        reg.setOrder(10); // 他のフィルタより前/後に調整可
        return reg;
    }

    public static class HtmlRewriteFilter implements Filter {

        // 除外プレフィックス（API・静的アセット・Next の内部パス など）
        private final List<String> excludedPrefixes = List.of(
                "/api/", "/_next/", "/static/", "/assets/", "/favicon.ico", "/sw.js", "/manifest.json"
        );

        @Override
        public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain)
                throws IOException, ServletException {

            HttpServletRequest req = (HttpServletRequest) servletRequest;
            HttpServletResponse res = (HttpServletResponse) servletResponse;

            String method = req.getMethod();
            String uri = req.getRequestURI(); // e.g. /user-login or /user-login/
            String accept = req.getHeader("Accept"); // may be null
            String query = req.getQueryString();

            // 1) 非 GET は触らない（POST/PUT 等は API で使われる）
            if (!"GET".equalsIgnoreCase(method)) {
                chain.doFilter(req, res);
                return;
            }

            // 2) 除外プレフィックスに該当したら触らない
            for (String p : excludedPrefixes) {
                if (uri.startsWith(p) || uri.equals(p.replace("/", ""))) {
                    chain.doFilter(req, res);
                    return;
                }
            }

            // 3) すでに拡張子がある URL は触らない (ex: /file.txt, /index.html, /something.json)
            if (uri.matches(".*\\.[a-zA-Z0-9]+$")) {
                chain.doFilter(req, res);
                return;
            }

            // 4) Accept ヘッダに text/html が含まれていないなら触らない（API fetch や画像取得を巻き込まない）
            if (accept == null || !(accept.contains("text/html") || accept.contains("*/*"))) {
                chain.doFilter(req, res);
                return;
            }

            // 5) 末尾が / の場合は /xxx/index.html に forward
            if (uri.endsWith("/")) {
                String target = uri + "index.html" + (query != null ? "?" + query : "");
                // 内部 forward（ブラウザの URL は変えない）
                RequestDispatcher rd = req.getRequestDispatcher(target);
                rd.forward(req, res);
                return;
            }

            // 6) 通常 /xxx -> /xxx.html に forward
            String target = uri + ".html" + (query != null ? "?" + query : "");
            RequestDispatcher rd = req.getRequestDispatcher(target);
            rd.forward(req, res);
        }
    }
}
