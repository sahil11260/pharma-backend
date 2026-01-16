package com.kavyapharm.farmatrack.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @org.springframework.beans.factory.annotation.Value("${cors.allowed-origins:*}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry
                .addMapping("/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        Path cwd = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();

        Path candidateFromRepoRoot = cwd
                .resolve("Frontend")
                .resolve("KavyaPharma")
                .resolve("Farma_Track")
                .toAbsolutePath()
                .normalize();

        Path candidateFromBackend = cwd
                .resolve("..")
                .resolve("Frontend")
                .resolve("KavyaPharma")
                .resolve("Farma_Track")
                .toAbsolutePath()
                .normalize();

        Path frontendPath = Files.exists(candidateFromRepoRoot) ? candidateFromRepoRoot : candidateFromBackend;
        String location = frontendPath.toUri().toString();

        if (!location.endsWith("/")) {
            location = location + "/";
        }

        registry
                .addResourceHandler("/**")
                .addResourceLocations(location, "classpath:/static/");

        registry
                .addResourceHandler("/assets/uploads/**")
                .addResourceLocations("file:uploads/", "classpath:/static/assets/uploads/");
    }

    @Override
    public void addViewControllers(@NonNull ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("redirect:/Index.html");
        registry.addViewController("/index.html").setViewName("redirect:/Index.html");
    }
}
