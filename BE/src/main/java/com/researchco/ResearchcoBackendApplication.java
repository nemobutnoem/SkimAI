package com.researchco;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ResearchcoBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ResearchcoBackendApplication.class, args);
    }
}
