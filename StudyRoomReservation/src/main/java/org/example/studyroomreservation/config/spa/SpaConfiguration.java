package org.example.studyroomreservation.config.spa;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Configuration class for Single Page Application (SPA) routing support.
 * <p>
 * This configuration ensures that all client-side routes are properly handled
 * by redirecting non-existent resource requests to index.html, allowing the
 * frontend framework to handle routing.
 * </p>
 */
@Configuration
public class SpaConfiguration implements WebMvcConfigurer {

    /**
     * Configures resource handlers to support SPA routing.
     * <p>
     * Maps all requests to static resources in the classpath:/static/ directory.
     * If a requested resource doesn't exist, it falls back to index.html to
     * enable client-side routing for the SPA.
     * </p>
     *
     * @param registry the {@link ResourceHandlerRegistry} to configure
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    /**
                     * Resolves the requested resource or falls back to index.html.
                     * <p>
                     * This method first attempts to locate the requested resource.
                     * If the resource exists and is readable, it returns that resource.
                     * Otherwise, it returns index.html to support SPA client-side routing.
                     * </p>
                     *
                     * @param resourcePath the path of the requested resource
                     * @param location the base location to search for the resource
                     * @return the resolved resource or index.html as fallback
                     * @throws IOException if an I/O error occurs during resource resolution
                     */
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);

                        // If the file exists, return it
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }

                        // Otherwise, return index.html (for SPA routing)
                        return new ClassPathResource("/static/index.html");
                    }
                });
    }
}