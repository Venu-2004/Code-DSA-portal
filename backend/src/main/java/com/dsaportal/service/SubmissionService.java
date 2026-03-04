package com.dsaportal.service;

import com.dsaportal.dto.ProblemDto;
import com.dsaportal.dto.SubmissionDto;
import com.dsaportal.entity.Problem;
import com.dsaportal.entity.Submission;
import com.dsaportal.entity.TestCase;
import com.dsaportal.entity.User;
import com.dsaportal.repository.ProblemRepository;
import com.dsaportal.repository.SubmissionRepository;
import com.dsaportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SubmissionService {
    
    @Autowired
    private SubmissionRepository submissionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProblemRepository problemRepository;
    
    @Autowired
    private Judge0Service judge0Service;
    
    @Autowired
    private CodeAnalysisService codeAnalysisService;

    @Autowired
    private GeminiService geminiService;
    
    public List<SubmissionDto> getSubmissionsByUserId(Long userId) {
        return submissionRepository.findByUserIdOrderBySubmittedAtDesc(userId)
                .stream()
                .map(SubmissionDto::new)
                .collect(Collectors.toList());
    }
    
    public List<SubmissionDto> getSubmissionsByProblemId(Long problemId) {
        return submissionRepository.findByProblemId(problemId)
                .stream()
                .map(SubmissionDto::new)
                .collect(Collectors.toList());
    }
    
    public List<SubmissionDto> getSubmissionsByUserAndProblem(Long userId, Long problemId) {
        return submissionRepository.findByUserIdAndProblemId(userId, problemId)
                .stream()
                .map(SubmissionDto::new)
                .collect(Collectors.toList());
    }
    
    public Optional<SubmissionDto> getSubmissionById(Long id) {
        return submissionRepository.findById(id)
                .map(SubmissionDto::new);
    }
    
    public SubmissionDto createSubmission(Long userId, Long problemId, String code, Submission.Language language) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        
        Submission submission = new Submission(user, problem, code, language);
        submission.setStatus(Submission.Status.PENDING);
        
        // Submit to Judge0
        String judge0Token = judge0Service.submitCode(submission);
        if (judge0Token != null) {
            submission.setJudge0Token(judge0Token);
        }
        
        Submission savedSubmission = submissionRepository.save(submission);
        return new SubmissionDto(savedSubmission);
    }
    
    public SubmissionDto updateSubmissionResult(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        
        if (submission.getJudge0Token() != null) {
            Judge0Service.Judge0Result result = judge0Service.getSubmissionResultWithPolling(submission.getJudge0Token());
            Submission.Status status = result.getStatus();
            submission.setErrorMessage(result.getErrorMessage());
            submission.setTimeTaken(result.getTimeTaken());
            submission.setMemoryUsed(result.getMemoryUsed());

            if (status == Submission.Status.PENDING) {
                submission.setStatus(status);
                submissionRepository.save(submission);
                return new SubmissionDto(submission);
            }

            // Judge0 "ACCEPTED" means code executed successfully; verify output ourselves with normalized comparison.
            if (status == Submission.Status.ACCEPTED) {
                String expectedOutput = resolveExpectedOutput(submission);
                if (expectedOutput != null && !expectedOutput.trim().isEmpty()) {
                    String actualOutput = result.getOutput();
                    if (!isOutputMatch(actualOutput, expectedOutput)) {
                        status = Submission.Status.WRONG_ANSWER;
                        String actual = actualOutput != null ? actualOutput.trim() : "";
                        submission.setErrorMessage("Expected: " + expectedOutput.trim() + "\nActual: " + actual);
                    }
                }
            }

            submission.setStatus(status);
            
            // Get code analysis from Gemini
            CodeAnalysisService.CodeAnalysisResult analysis = codeAnalysisService.analyzeCode(submission);
            int totalTestCases = submission.getProblem().getTestCases() != null
                    ? submission.getProblem().getTestCases().size()
                    : 1;
            if ((submission.getProblem().getTestCases() == null || submission.getProblem().getTestCases().isEmpty())
                    && resolveExpectedOutput(submission) != null
                    && !resolveExpectedOutput(submission).trim().isEmpty()) {
                totalTestCases = 1;
            }
            if (totalTestCases <= 0) {
                totalTestCases = 1;
            }
            
            // Calculate accuracy and other metrics based on Judge0 result and analysis
            if (status == Submission.Status.ACCEPTED) {
                submission.setAccuracy(100.0);
                submission.setTestCasesPassed(totalTestCases);
                submission.setTotalTestCases(totalTestCases);
            } else if (status == Submission.Status.COMPILATION_ERROR) {
                submission.setAccuracy(0.0);
                submission.setTestCasesPassed(0);
                submission.setTotalTestCases(totalTestCases);
            } else if (status == Submission.Status.RUNTIME_ERROR) {
                // Runtime errors can happen even when syntax is valid.
                submission.setAccuracy(Math.max(0.0, analysis.getEfficiencyScore() * 0.5));
                submission.setTestCasesPassed(0);
                submission.setTotalTestCases(totalTestCases);
            } else {
                // For other statuses (WRONG_ANSWER, TIME_LIMIT_EXCEEDED, etc.)
                submission.setAccuracy(Math.max(0.0, analysis.getEfficiencyScore() * 0.7));
                submission.setTestCasesPassed(0);
                submission.setTotalTestCases(totalTestCases);
            }
            
            // Store analysis feedback
            submission.setAnalysisFeedback(buildStatusAwareFeedback(submission, analysis));
            submission.setEfficiencyScore(analysis.getEfficiencyScore());
            submission.setAiDetectedPercent(analysis.getAiDetectedPercent());
            submission.setAiDetectionSummary(analysis.getAiDetectionSummary());
            
            submissionRepository.save(submission);
        }
        
        return new SubmissionDto(submission);
    }

    public Optional<ProblemDto> getNextProblemSuggestion(Long userId, Long currentProblemId, Double score) {
        double normalizedScore = score != null ? score : 0.0;
        return problemRepository.findById(currentProblemId)
                .flatMap(problem -> geminiService
                        .suggestNextProblem(userId, problem, normalizedScore)
                        .map(ProblemDto::new));
    }
    
    public Long getTotalSubmissionsByUserId(Long userId) {
        return submissionRepository.countTotalSubmissionsByUserId(userId);
    }
    
    public Long getAcceptedSubmissionsByUserId(Long userId) {
        return submissionRepository.countAcceptedSubmissionsByUserId(userId);
    }
    
    public Double getAverageAccuracyByUserId(Long userId) {
        Double accuracy = submissionRepository.getAverageAccuracyByUserId(userId);
        return accuracy != null ? accuracy : 0.0;
    }

    private String resolveExpectedOutput(Submission submission) {
        TestCase selectedCase = pickExecutionTestCase(submission);
        if (selectedCase != null) {
            String expected = selectedCase.getExpectedOutput();
            return expected != null ? expected : "";
        }
        String fallback = submission.getProblem().getOutputFormat();
        return fallback != null ? fallback : "";
    }

    private boolean isOutputMatch(String actual, String expected) {
        String normalizedActual = normalizeOutput(actual);
        String normalizedExpected = normalizeOutput(expected);
        return normalizedActual.equals(normalizedExpected);
    }

    private String normalizeOutput(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .trim()
                .replaceAll("[ \\t]+", " ");
    }

    private TestCase pickExecutionTestCase(Submission submission) {
        if (submission.getProblem().getTestCases() == null || submission.getProblem().getTestCases().isEmpty()) {
            return null;
        }
        for (TestCase testCase : submission.getProblem().getTestCases()) {
            if (Boolean.TRUE.equals(testCase.getIsSample())) {
                return testCase;
            }
        }
        return submission.getProblem().getTestCases().get(0);
    }

    private String buildStatusAwareFeedback(Submission submission, CodeAnalysisService.CodeAnalysisResult analysis) {
        StringBuilder feedback = new StringBuilder();
        Submission.Status status = submission.getStatus();

        if (status == Submission.Status.COMPILATION_ERROR) {
            feedback.append("Compilation failed. Fix syntax/compile issues first.");
        } else if (status == Submission.Status.RUNTIME_ERROR) {
            feedback.append("Runtime error detected. Check edge cases, null checks, and index bounds.");
        } else if (status == Submission.Status.WRONG_ANSWER) {
            feedback.append("Code executed, but output was incorrect. This is likely a logic issue, not a syntax issue.");
        } else if (status == Submission.Status.TIME_LIMIT_EXCEEDED) {
            feedback.append("Execution exceeded time limit. Optimize algorithmic complexity.");
        } else if (status == Submission.Status.MEMORY_LIMIT_EXCEEDED) {
            feedback.append("Execution exceeded memory limit. Reduce memory usage.");
        } else if (status == Submission.Status.ACCEPTED) {
            feedback.append("Solution accepted.");
        }

        if (analysis.getFeedback() != null && !analysis.getFeedback().isBlank()) {
            if (feedback.length() > 0) {
                feedback.append("\n\n");
            }
            feedback.append("AI Suggestions:\n").append(analysis.getFeedback());
        }

        return feedback.toString();
    }
}
