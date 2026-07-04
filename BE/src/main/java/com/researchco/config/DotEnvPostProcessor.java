package com.researchco.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Loads BE/.env before Spring context initializes so that datasource/jwt beans
 * can resolve their placeholder values. Create BE/.env (gitignored) for local dev.
 */
public class DotEnvPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path cwd = Paths.get("").toAbsolutePath();
        Path envFile = resolveEnvFile(cwd);

        if (envFile == null) {
            return;
        }

        Map<String, Object> props = new LinkedHashMap<>();
        try {
            Files.lines(envFile).forEach(line -> {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) return;
                int idx = trimmed.indexOf('=');
                if (idx <= 0) return;
                String key = trimmed.substring(0, idx).trim();
                String value = trimmed.substring(idx + 1).trim();
                if (value.startsWith("\"") && value.endsWith("\"")) {
                    value = value.substring(1, value.length() - 1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.substring(1, value.length() - 1);
                }
                props.put(key, value);
            });
        } catch (IOException e) {
            // silently skip — .env is optional
            return;
        }

        if (!props.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("dotenv-be", props));
        }
    }

    private Path resolveEnvFile(Path cwd) {
        // 1. cwd/.env  (started from BE/ dir)
        Path candidate = cwd.resolve(".env");
        if (Files.exists(candidate)) return candidate;
        // 2. cwd/BE/.env  (started from project root)
        candidate = cwd.resolve("BE").resolve(".env");
        if (Files.exists(candidate)) return candidate;
        // 3. parent/.env  (started from a subdirectory inside BE)
        candidate = cwd.getParent() != null ? cwd.getParent().resolve(".env") : null;
        if (candidate != null && Files.exists(candidate)) return candidate;
        return null;
    }
}
