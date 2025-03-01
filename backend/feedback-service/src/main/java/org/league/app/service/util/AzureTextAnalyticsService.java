package org.league.app.service.util;

import com.azure.ai.textanalytics.TextAnalyticsClient;
import com.azure.ai.textanalytics.TextAnalyticsClientBuilder;
import com.azure.core.credential.AzureKeyCredential;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AzureTextAnalyticsService {

    private final TextAnalyticsClient textAnalyticsClient;

    public AzureTextAnalyticsService(
            @Value("${azure.ai.textanalytics.endpoint}") String endpoint,
            @Value("${azure.ai.textanalytics.key}") String key) {

        this.textAnalyticsClient = new TextAnalyticsClientBuilder()
                .endpoint(endpoint)
                .credential(new AzureKeyCredential(key))
                .buildClient();
    }

    public String getSentiment(String text) {
        return textAnalyticsClient.analyzeSentiment(text).getSentiment().toString();
    }

    public String getLanguage(String text) {
        return textAnalyticsClient.detectLanguage(text).getName();
    }
}