package com.researchco.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@Component
public class EnvironmentLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EnvironmentLoader.class);

    @Override
    public void run(org.springframework.boot.ApplicationArguments args) throws Exception {
        loadGoogleClientId();
    }

    private void loadGoogleClientId() {
        try {
            // Look for FE/.env relative to BE folder
            Path beDir = Paths.get("").toAbsolutePath();
            Path feEnv = beDir.getParent().resolve("FE").resolve(".env");

            if (Files.exists(feEnv)) {
                Optional<String> googleClientId = Files.lines(feEnv)
                        .filter(line -> line.startsWith("VITE_GOOGLE_CLIENT_ID="))
                        .map(line -> line.substring("VITE_GOOGLE_CLIENT_ID=".length()).trim())
                        .findFirst();

                if (googleClientId.isPresent()) {
                    String clientId = googleClientId.get();
                    System.setProperty("app.auth.google.client-id", clientId);
                    log.info("GOOGLE_CLIENT_ID loaded from FE/.env");
                }
            }
        } catch (IOException e) {
            log.warn("Could not load GOOGLE_CLIENT_ID from FE/.env: {}", e.getMessage());
        }
    }
}
