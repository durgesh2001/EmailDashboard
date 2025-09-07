package com.emailassistant;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SupportDashboardApplication {

	public static void main(String[] args) {
		System.out.println("env files are loading ");
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		dotenv.entries().forEach(entry ->
				System.setProperty(entry.getKey(), entry.getValue())
		);
		System.out.println("Application is loading ");

		SpringApplication.run(SupportDashboardApplication.class, args);
	}

}
