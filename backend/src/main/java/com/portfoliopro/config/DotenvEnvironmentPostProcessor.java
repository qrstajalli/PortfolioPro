package com.portfoliopro.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Automatically loads .env configuration from either the current directory or parent directory
 * into Spring Environment properties, allowing zero-credential code with safe .env files.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "dotenvProperties";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        File envFile = findDotenvFile();
        if (envFile == null || !envFile.exists() || !envFile.canRead()) {
            return;
        }

        Map<String, Object> props = new HashMap<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(envFile, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                int equalIndex = line.indexOf('=');
                if (equalIndex > 0) {
                    String key = line.substring(0, equalIndex).trim();
                    String value = line.substring(equalIndex + 1).trim();
                    if ((value.startsWith("\"") && value.endsWith("\"")) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.substring(1, value.length() - 1);
                    }
                    props.put(key, value);
                }
            }
        } catch (IOException e) {
            System.err.println("Failed to read .env file from " + envFile.getAbsolutePath() + ": " + e.getMessage());
        }

        if (!props.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, props));
            System.out.println("Loaded " + props.size() + " environment variables from " + envFile.getAbsolutePath());
        }
    }

    private File findDotenvFile() {
        File file = new File(".env");
        if (file.exists() && file.isFile()) {
            return file;
        }
        file = new File("../.env");
        if (file.exists() && file.isFile()) {
            return file;
        }
        return null;
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
