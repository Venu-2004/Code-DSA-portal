package com.dsaportal.service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.dsaportal.entity.Submission;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class CodeAnalysisService {
    
    @Value("${gemini.api-key}")
    private String geminiApiKey;
    
    @Value("${gemini.base-url}")
    private String geminiBaseUrl;
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    public CodeAnalysisService() {
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
    }
    
    public CodeAnalysisResult analyzeCode(Submission submission) {
        try {
            String prompt = buildAnalysisPrompt(submission);
            String response = callGeminiAPI(prompt);
            return parseAnalysisResponse(response, submission);
        } catch (Exception e) {
            System.err.println("Error analyzing code: " + e.getMessage());
            return fallbackResult(submission, "Unable to analyze code");
        }
    }
    
    private String buildAnalysisPrompt(Submission submission) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert code reviewer. Analyze the following code submission:\n\n");
        prompt.append("Problem: ").append(submission.getProblem().getTitle()).append("\n");
        prompt.append("Description: ").append(submission.getProblem().getDescription()).append("\n");
        prompt.append("Language: ").append(submission.getLanguage()).append("\n\n");
        prompt.append("Code:\n").append(submission.getCode()).append("\n\n");
        prompt.append("Judge Status: ").append(submission.getStatus()).append("\n");
        if (submission.getErrorMessage() != null && !submission.getErrorMessage().isBlank()) {
            prompt.append("Judge Error: ").append(submission.getErrorMessage()).append("\n");
        }
        prompt.append("\n");
        
        prompt.append("Please analyze this code and provide:\n");
        prompt.append("1. Syntax correctness (true/false)\n");
        prompt.append("2. Efficiency score (0-100)\n");
        prompt.append("3. AI-generated likelihood score (0-100, higher means more likely AI-generated)\n");
        prompt.append("4. Short AI-detection summary (max 200 chars)\n");
        prompt.append("5. Detailed feedback with actionable suggestions and tips to improve\n\n");
        
        prompt.append("Respond in JSON format:\n");
        prompt.append("{\n");
        prompt.append("  \"syntaxCorrect\": true/false,\n");
        prompt.append("  \"efficiencyScore\": 85,\n");
        prompt.append("  \"aiDetectedPercent\": 35,\n");
        prompt.append("  \"aiDetectionSummary\": \"Low AI-signature. Looks mostly student-authored.\",\n");
        prompt.append("  \"feedback\": \"Detailed analysis here\"\n");
        prompt.append("}\n");
        
        return prompt.toString();
    }
    
    private String callGeminiAPI(String prompt) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            
            part.put("text", prompt);
            content.put("parts", Arrays.asList(part));
            requestBody.put("contents", Arrays.asList(content));
            
            return webClient.post()
                    .uri(geminiBaseUrl + "/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
                    
        } catch (Exception e) {
            System.err.println("Error calling Gemini API for code analysis: " + e.getMessage());
            return "{\"syntaxCorrect\": false, \"efficiencyScore\": 0, \"aiDetectedPercent\": 0, \"aiDetectionSummary\": \"Code analysis unavailable\", \"feedback\": \"Code analysis unavailable\"}";
        }
    }
    
    private CodeAnalysisResult parseAnalysisResponse(String response, Submission submission) {
        try {
            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode candidates = rootNode.get("candidates");
            if (candidates != null && candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).get("content");
                if (content != null) {
                    JsonNode parts = content.get("parts");
                    if (parts != null && parts.isArray() && parts.size() > 0) {
                        String text = parts.get(0).get("text").asText();
                        JsonNode analysisNode = extractAnalysisJson(text);
                        if (analysisNode != null) {
                            return buildResultFromNode(analysisNode, submission);
                        }
                    }
                }
            }

            // Some responses may already be plain JSON text.
            JsonNode directNode = extractAnalysisJson(response);
            if (directNode != null) {
                return buildResultFromNode(directNode, submission);
            }

            return fallbackResult(submission, "Analysis completed with fallback values");
            
        } catch (Exception e) {
            System.err.println("Error parsing analysis response: " + e.getMessage());
            return fallbackResult(submission, "Analysis completed with fallback values");
        }
    }

    private JsonNode extractAnalysisJson(String text) {
        try {
            return objectMapper.readTree(text);
        } catch (Exception ignored) {
            int start = text.indexOf('{');
            int end = text.lastIndexOf('}');
            if (start >= 0 && end > start) {
                try {
                    return objectMapper.readTree(text.substring(start, end + 1));
                } catch (Exception ignoredAgain) {
                    return null;
                }
            }
            return null;
        }
    }

    private CodeAnalysisResult buildResultFromNode(JsonNode analysisNode, Submission submission) {
        boolean syntaxCorrect = analysisNode.has("syntaxCorrect")
                ? analysisNode.path("syntaxCorrect").asBoolean(defaultSyntaxFromJudge(submission))
                : defaultSyntaxFromJudge(submission);

        if (submission.getStatus() == Submission.Status.COMPILATION_ERROR) {
            syntaxCorrect = false;
        }

        double efficiencyScore = analysisNode.path("efficiencyScore").asDouble(defaultEfficiencyFromJudge(submission));
        double aiDetectedPercent = analysisNode.path("aiDetectedPercent").asDouble(-1);
        String aiDetectionSummary = analysisNode.path("aiDetectionSummary").asText("");
        String feedback = analysisNode.path("feedback").asText("Code analysis completed.");
        AiHeuristicResult heuristicResult = detectAiLikelihood(submission.getCode());
        double resolvedAiPercent = aiDetectedPercent >= 0
                ? clampPercent((aiDetectedPercent * 0.65) + (heuristicResult.percent * 0.35))
                : heuristicResult.percent;
        String resolvedAiSummary = (aiDetectionSummary != null && !aiDetectionSummary.isBlank())
                ? aiDetectionSummary
                : heuristicResult.summary;

        return new CodeAnalysisResult(
                syntaxCorrect,
                feedback,
                clampEfficiency(efficiencyScore),
                clampPercent(resolvedAiPercent),
                truncateSummary(resolvedAiSummary),
                "Analysis completed"
        );
    }

    private CodeAnalysisResult fallbackResult(Submission submission, String status) {
        boolean syntaxCorrect = defaultSyntaxFromJudge(submission);
        AiHeuristicResult heuristicResult = detectAiLikelihood(submission.getCode());
        if (submission.getStatus() == Submission.Status.COMPILATION_ERROR) {
            syntaxCorrect = false;
        }
        return new CodeAnalysisResult(
                syntaxCorrect,
                "AI analysis unavailable. Refer to the execution result for the primary error details.",
                defaultEfficiencyFromJudge(submission),
                heuristicResult.percent,
                heuristicResult.summary,
                status
        );
    }

    private AiHeuristicResult detectAiLikelihood(String code) {
        if (code == null || code.isBlank()) {
            return new AiHeuristicResult(0.0, "No code content available for AI-detection.");
        }

        String lower = code.toLowerCase();
        double score = 12.0;
        StringBuilder signals = new StringBuilder();

        String[] directAiPhrases = {
                "chatgpt", "generated by ai", "as an ai", "here's the code",
                "here is the code", "time complexity:", "space complexity:",
                "explanation:", "approach:"
        };
        int phraseHits = 0;
        for (String phrase : directAiPhrases) {
            if (lower.contains(phrase)) {
                phraseHits++;
            }
        }
        if (phraseHits > 0) {
            score += Math.min(35, phraseHits * 12.0);
            signals.append("Detected AI-style commentary phrases. ");
        }

        int commentLines = 0;
        int nonEmptyLines = 0;
        String[] lines = code.split("\\R");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            nonEmptyLines++;
            if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
                commentLines++;
            }
        }
        if (nonEmptyLines > 0) {
            double commentRatio = (double) commentLines / nonEmptyLines;
            if (commentRatio > 0.3) {
                score += 18.0;
                signals.append("High explanatory comment ratio. ");
            } else if (commentRatio > 0.2) {
                score += 10.0;
            }
        }

        int veryLongLines = 0;
        for (String line : lines) {
            if (line.length() > 160) {
                veryLongLines++;
            }
        }
        if (veryLongLines > 0) {
            score += Math.min(12, veryLongLines * 3.0);
            signals.append("Contains unusually long prose-like lines. ");
        }

        if (lower.contains("optimal solution") || lower.contains("let's") || lower.contains("we can")) {
            score += 8.0;
            signals.append("Contains assistant-style wording. ");
        }

        double clamped = clampPercent(score);
        if (signals.length() == 0) {
            return new AiHeuristicResult(clamped, "No strong AI-signature patterns were found.");
        }
        return new AiHeuristicResult(clamped, truncateSummary(signals.toString().trim()));
    }

    private String truncateSummary(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= 200) {
            return trimmed;
        }
        return trimmed.substring(0, 200);
    }

    private double clampPercent(double score) {
        if (score < 0) {
            return 0;
        }
        if (score > 100) {
            return 100;
        }
        return score;
    }

    private boolean defaultSyntaxFromJudge(Submission submission) {
        return submission.getStatus() != Submission.Status.COMPILATION_ERROR;
    }

    private double defaultEfficiencyFromJudge(Submission submission) {
        return submission.getStatus() == Submission.Status.ACCEPTED ? 70.0 : 0.0;
    }

    private double clampEfficiency(double score) {
        if (score < 0) {
            return 0;
        }
        if (score > 100) {
            return 100;
        }
        return score;
    }
    
    public static class CodeAnalysisResult {
        private final boolean syntaxCorrect;
        private final String feedback;
        private final double efficiencyScore;
        private final double aiDetectedPercent;
        private final String aiDetectionSummary;
        private final String status;
        
        public CodeAnalysisResult(
                boolean syntaxCorrect,
                String feedback,
                double efficiencyScore,
                double aiDetectedPercent,
                String aiDetectionSummary,
                String status) {
            this.syntaxCorrect = syntaxCorrect;
            this.feedback = feedback;
            this.efficiencyScore = efficiencyScore;
            this.aiDetectedPercent = aiDetectedPercent;
            this.aiDetectionSummary = aiDetectionSummary;
            this.status = status;
        }
        
        public boolean isSyntaxCorrect() { return syntaxCorrect; }
        public String getFeedback() { return feedback; }
        public double getEfficiencyScore() { return efficiencyScore; }
        public double getAiDetectedPercent() { return aiDetectedPercent; }
        public String getAiDetectionSummary() { return aiDetectionSummary; }
        public String getStatus() { return status; }
    }

    private static class AiHeuristicResult {
        private final double percent;
        private final String summary;

        private AiHeuristicResult(double percent, String summary) {
            this.percent = percent;
            this.summary = summary;
        }
    }
}
