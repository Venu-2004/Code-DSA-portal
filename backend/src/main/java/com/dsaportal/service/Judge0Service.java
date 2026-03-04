package com.dsaportal.service;

import com.dsaportal.entity.Submission;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import com.dsaportal.entity.TestCase;

@Service
public class Judge0Service {
    
    public static class Judge0Result {
        private Submission.Status status;
        private String errorMessage;
        private String output;
        private Integer timeTaken;
        private Integer memoryUsed;

        public Judge0Result(Submission.Status status) {
            this.status = status;
        }

        public Submission.Status getStatus() { return status; }
        public void setStatus(Submission.Status status) { this.status = status; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        public String getOutput() { return output; }
        public void setOutput(String output) { this.output = output; }
        public Integer getTimeTaken() { return timeTaken; }
        public void setTimeTaken(Integer timeTaken) { this.timeTaken = timeTaken; }
        public Integer getMemoryUsed() { return memoryUsed; }
        public void setMemoryUsed(Integer memoryUsed) { this.memoryUsed = memoryUsed; }
    }
    
    @Value("${judge0.base-url}")
    private String judge0BaseUrl;
    
    @Value("${judge0.api-key}")
    private String judge0ApiKey;
    
    @Value("${judge0.host}")
    private String judge0Host;
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    public Judge0Service() {
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
    }
    
    public String submitCode(Submission submission) {
        try {
            System.out.println("Submitting code to Judge0...");
            System.out.println("Judge0 URL: " + judge0BaseUrl);
            System.out.println("Language: " + submission.getLanguage());
            System.out.println("Code: " + submission.getCode().substring(0, Math.min(100, submission.getCode().length())));
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("source_code", submission.getCode());
            requestBody.put("language_id", getLanguageId(submission.getLanguage()));
            
            String testInput = getTestInput(submission);
            String expectedOutput = getExpectedOutput(submission);
            
            // Only add stdin and expected_output if we have test cases
            if (!testInput.isEmpty()) {
                requestBody.put("stdin", testInput);
            }
            if (!expectedOutput.isEmpty()) {
                requestBody.put("expected_output", expectedOutput);
            }
            
            requestBody.put("cpu_time_limit", 2.0); // 2 seconds default
            requestBody.put("memory_limit", 128000); // 128MB default
            
            System.out.println("Request body: " + requestBody);
            
            String response = webClient.post()
                    .uri(judge0BaseUrl + "/submissions")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header("X-RapidAPI-Key", judge0ApiKey)
                    .header("X-RapidAPI-Host", judge0Host)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            System.out.println("Judge0 response: " + response);
            
            // Parse response to get token
            return extractTokenFromResponse(response);
            
        } catch (Exception e) {
            System.err.println("Error submitting code to Judge0: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    public Judge0Result getSubmissionResult(String token) {
        try {
            System.out.println("Getting submission result for token: " + token);
            
            String response = webClient.get()
                    .uri(judge0BaseUrl + "/submissions/" + token + "?base64_encoded=true&fields=stdout,stderr,status,status_id,time,memory,compile_output,message")
                    .header("X-RapidAPI-Key", judge0ApiKey)
                    .header("X-RapidAPI-Host", judge0Host)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            System.out.println("Judge0 result response: " + response);
            
            return parseSubmissionResult(response);
            
        } catch (Exception e) {
            System.err.println("Error getting submission result from Judge0: " + e.getMessage());
            e.printStackTrace();
            Judge0Result result = new Judge0Result(Submission.Status.RUNTIME_ERROR);
            result.setErrorMessage(e.getMessage());
            return result;
        }
    }
    
    public Judge0Result getSubmissionResultWithPolling(String token) {
        int maxAttempts = 20;
        int attempt = 0;
        
        while (attempt < maxAttempts) {
            try {
                Judge0Result result = getSubmissionResult(token);
                
                // If status is not pending, return it
                if (result.getStatus() != Submission.Status.PENDING) {
                    return result;
                }
                
                // Wait 2 seconds before next attempt
                Thread.sleep(2000);
                attempt++;
                
            } catch (Exception e) {
                System.err.println("Error in polling attempt " + attempt + ": " + e.getMessage());
                attempt++;
            }
        }
        
        // If max attempts reached, keep it pending so caller can retry without false failures.
        Judge0Result pendingResult = new Judge0Result(Submission.Status.PENDING);
        pendingResult.setErrorMessage("Evaluation is taking longer than expected. Please retry in a moment.");
        return pendingResult;
    }
    
    private int getLanguageId(Submission.Language language) {
        switch (language) {
            case PYTHON: return 71; // Python 3
            case JAVA: return 62; // Java
            case CPP: return 54; // C++ (GCC 9.2.0)
            case JAVASCRIPT: return 63; // Node.js 12.14.0
            case C: return 50; // C (GCC 9.2.0)
            default: return 71; // Default to Python
        }
    }
    
    private String getTestInput(Submission submission) {
        TestCase selectedCase = pickExecutionTestCase(submission);
        if (selectedCase != null) {
            String input = selectedCase.getInputData();
            System.out.println("Test input: " + input);
            return input != null ? input : "";
        }
        String fallbackInput = submission.getProblem().getInputFormat();
        if (fallbackInput != null && !fallbackInput.trim().isEmpty()) {
            System.out.println("Using problem inputFormat as fallback input");
            return fallbackInput;
        }
        System.out.println("No test cases/input format found, using empty input");
        return "";
    }
    
    private String getExpectedOutput(Submission submission) {
        TestCase selectedCase = pickExecutionTestCase(submission);
        if (selectedCase != null) {
            String output = selectedCase.getExpectedOutput();
            System.out.println("Expected output: " + output);
            return output != null ? output : "";
        }
        String fallbackOutput = submission.getProblem().getOutputFormat();
        if (fallbackOutput != null && !fallbackOutput.trim().isEmpty()) {
            System.out.println("Using problem outputFormat as fallback expected output");
            return fallbackOutput;
        }
        System.out.println("No test cases/output format found, using empty expected output");
        return "";
    }
    
    private String extractTokenFromResponse(String response) {
        try {
            JsonNode jsonNode = objectMapper.readTree(response);
            if (jsonNode.has("token")) {
                return jsonNode.get("token").asText();
            }
        } catch (Exception e) {
            System.err.println("Error parsing token from response: " + e.getMessage());
        }
        return null;
    }
    
    private Judge0Result parseSubmissionResult(String response) {
        try {
            System.out.println("Parsing status from response: " + response);
            JsonNode jsonNode = objectMapper.readTree(response);
            
            Submission.Status status = Submission.Status.RUNTIME_ERROR;
            String errorMessage = null;
            String output = null;
            Integer timeTaken = null;
            Integer memoryUsed = null;

            Integer statusId = extractStatusId(jsonNode);
            String statusDescription = extractStatusDescription(jsonNode);
            status = mapJudge0Status(statusId, statusDescription);
            
            // Decode Base64 fields
            if (jsonNode.has("stdout") && !jsonNode.get("stdout").isNull()) {
                output = safeDecodeBase64(jsonNode.get("stdout").asText());
            }
            
            if (jsonNode.has("stderr") && !jsonNode.get("stderr").isNull()) {
                String stderr = safeDecodeBase64(jsonNode.get("stderr").asText());
                errorMessage = appendLine(errorMessage, stderr);
            }
            
            if (jsonNode.has("compile_output") && !jsonNode.get("compile_output").isNull()) {
                String compileOutput = safeDecodeBase64(jsonNode.get("compile_output").asText());
                errorMessage = appendLine(errorMessage, compileOutput);
            }
            
            if (jsonNode.has("message") && !jsonNode.get("message").isNull()) {
                String message = safeDecodeBase64(jsonNode.get("message").asText());
                errorMessage = appendLine(errorMessage, message);
            }

            if (jsonNode.has("time") && !jsonNode.get("time").isNull()) {
                timeTaken = (int) (jsonNode.get("time").asDouble() * 1000);
            }

            if (jsonNode.has("memory") && !jsonNode.get("memory").isNull()) {
                memoryUsed = jsonNode.get("memory").asInt();
            }

            Judge0Result result = new Judge0Result(status);
            result.setErrorMessage(errorMessage);
            result.setOutput(output);
            result.setTimeTaken(timeTaken);
            result.setMemoryUsed(memoryUsed);
            
            return result;
            
        } catch (Exception e) {
            System.err.println("Error parsing submission status: " + e.getMessage());
            e.printStackTrace();
            Judge0Result result = new Judge0Result(Submission.Status.RUNTIME_ERROR);
            result.setErrorMessage("Error parsing response: " + e.getMessage());
            return result;
        }
    }

    private Integer extractStatusId(JsonNode jsonNode) {
        if (jsonNode.has("status_id") && !jsonNode.get("status_id").isNull()) {
            return jsonNode.get("status_id").asInt();
        }
        JsonNode statusNode = jsonNode.get("status");
        if (statusNode != null && statusNode.has("id") && !statusNode.get("id").isNull()) {
            return statusNode.get("id").asInt();
        }
        return null;
    }

    private String extractStatusDescription(JsonNode jsonNode) {
        JsonNode statusNode = jsonNode.get("status");
        if (statusNode != null && statusNode.has("description") && !statusNode.get("description").isNull()) {
            return statusNode.get("description").asText();
        }
        return null;
    }

    private Submission.Status mapJudge0Status(Integer statusId, String statusDescription) {
        if (statusId != null) {
            System.out.println("Judge0 status ID: " + statusId);
            switch (statusId) {
                case 1: // In Queue
                case 2: // Processing
                    return Submission.Status.PENDING;
                case 3: // Accepted
                    return Submission.Status.ACCEPTED;
                case 4: // Wrong Answer
                    return Submission.Status.WRONG_ANSWER;
                case 5: // Time Limit Exceeded
                    return Submission.Status.TIME_LIMIT_EXCEEDED;
                case 6: // Memory Limit Exceeded
                    return Submission.Status.MEMORY_LIMIT_EXCEEDED;
                case 10: // Compilation Error
                    return Submission.Status.COMPILATION_ERROR;
                case 7: // Output Limit Exceeded
                case 8: // Presentation Error
                case 9: // Runtime Error
                case 11: // Runtime Error (SIGSEGV)
                case 12: // Runtime Error (SIGFPE)
                case 13: // Runtime Error (SIGABRT)
                case 14: // Runtime Error (NZEC)
                case 15: // Runtime Error (Other)
                default:
                    return Submission.Status.RUNTIME_ERROR;
            }
        }

        if (statusDescription != null) {
            String normalized = statusDescription.trim().toLowerCase();
            if (normalized.contains("accepted")) return Submission.Status.ACCEPTED;
            if (normalized.contains("wrong")) return Submission.Status.WRONG_ANSWER;
            if (normalized.contains("compilation")) return Submission.Status.COMPILATION_ERROR;
            if (normalized.contains("time limit")) return Submission.Status.TIME_LIMIT_EXCEEDED;
            if (normalized.contains("memory limit")) return Submission.Status.MEMORY_LIMIT_EXCEEDED;
            if (normalized.contains("queue") || normalized.contains("processing")) return Submission.Status.PENDING;
        }

        return Submission.Status.RUNTIME_ERROR;
    }

    private String safeDecodeBase64(String value) {
        if (value == null) {
            return null;
        }
        try {
            return new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return value;
        }
    }

    private String appendLine(String existing, String nextLine) {
        if (nextLine == null || nextLine.trim().isEmpty()) {
            return existing;
        }
        if (existing == null || existing.isEmpty()) {
            return nextLine;
        }
        return existing + "\n" + nextLine;
    }

    private TestCase pickExecutionTestCase(Submission submission) {
        List<TestCase> testCases = submission.getProblem().getTestCases();
        if (testCases == null || testCases.isEmpty()) {
            return null;
        }
        for (TestCase testCase : testCases) {
            if (Boolean.TRUE.equals(testCase.getIsSample())) {
                return testCase;
            }
        }
        return testCases.get(0);
    }
}
