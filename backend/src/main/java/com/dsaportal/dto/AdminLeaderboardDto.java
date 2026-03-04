package com.dsaportal.dto;

import java.util.List;

public class AdminLeaderboardDto {
    private Integer totalStudents;
    private Long totalSolvedProblems;
    private Long totalPlatformTimeSeconds;
    private Double averageAccuracy;
    private List<LeaderboardEntryDto> leaderboard;

    public AdminLeaderboardDto(Integer totalStudents, Long totalSolvedProblems, Long totalPlatformTimeSeconds, Double averageAccuracy, List<LeaderboardEntryDto> leaderboard) {
        this.totalStudents = totalStudents;
        this.totalSolvedProblems = totalSolvedProblems;
        this.totalPlatformTimeSeconds = totalPlatformTimeSeconds;
        this.averageAccuracy = averageAccuracy;
        this.leaderboard = leaderboard;
    }

    public Integer getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(Integer totalStudents) {
        this.totalStudents = totalStudents;
    }

    public Long getTotalSolvedProblems() {
        return totalSolvedProblems;
    }

    public void setTotalSolvedProblems(Long totalSolvedProblems) {
        this.totalSolvedProblems = totalSolvedProblems;
    }

    public Long getTotalPlatformTimeSeconds() {
        return totalPlatformTimeSeconds;
    }

    public void setTotalPlatformTimeSeconds(Long totalPlatformTimeSeconds) {
        this.totalPlatformTimeSeconds = totalPlatformTimeSeconds;
    }

    public Double getAverageAccuracy() {
        return averageAccuracy;
    }

    public void setAverageAccuracy(Double averageAccuracy) {
        this.averageAccuracy = averageAccuracy;
    }

    public List<LeaderboardEntryDto> getLeaderboard() {
        return leaderboard;
    }

    public void setLeaderboard(List<LeaderboardEntryDto> leaderboard) {
        this.leaderboard = leaderboard;
    }
}
