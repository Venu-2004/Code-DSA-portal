package com.dsaportal.dto;

public class LeaderboardEntryDto {
    private Long userId;
    private String username;
    private Long solvedProblems;
    private Long totalSubmissions;
    private Double averageAccuracy;
    private Long totalActiveSeconds;
    private Integer rank;

    public LeaderboardEntryDto(Long userId, String username, Long solvedProblems, Long totalSubmissions, Double averageAccuracy, Long totalActiveSeconds) {
        this.userId = userId;
        this.username = username;
        this.solvedProblems = solvedProblems;
        this.totalSubmissions = totalSubmissions;
        this.averageAccuracy = averageAccuracy;
        this.totalActiveSeconds = totalActiveSeconds;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Long getSolvedProblems() {
        return solvedProblems;
    }

    public void setSolvedProblems(Long solvedProblems) {
        this.solvedProblems = solvedProblems;
    }

    public Long getTotalSubmissions() {
        return totalSubmissions;
    }

    public void setTotalSubmissions(Long totalSubmissions) {
        this.totalSubmissions = totalSubmissions;
    }

    public Double getAverageAccuracy() {
        return averageAccuracy;
    }

    public void setAverageAccuracy(Double averageAccuracy) {
        this.averageAccuracy = averageAccuracy;
    }

    public Long getTotalActiveSeconds() {
        return totalActiveSeconds;
    }

    public void setTotalActiveSeconds(Long totalActiveSeconds) {
        this.totalActiveSeconds = totalActiveSeconds;
    }

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }
}
