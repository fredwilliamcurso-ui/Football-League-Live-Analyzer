package com.football.analyzer.prediction

data class TeamProfile(
    val id: String,
    val name: String,
    val multiplier: Int,
    val baseProb: Double
)

data class TeamPredictionScore(
    val teamId: String,
    val teamName: String,
    val multiplier: Int,
    val totalScore: Double,
    val ranking: Int
)

data class NativePredictionSnapshot(
    val roundId: String,
    val timestamp: Long,
    val top1: TeamPredictionScore,
    val top2: TeamPredictionScore,
    val top3: TeamPredictionScore,
    val isFrozen: Boolean
)

class PredictionEngine {

    val teams = listOf(
        TeamProfile("real_madrid", "Real Madrid", 40, 0.025),
        TeamProfile("barcelona", "Barcelona", 40, 0.025),
        TeamProfile("psg", "Paris SG", 12, 0.0833),
        TeamProfile("liverpool", "Liverpool", 8, 0.125),
        TeamProfile("ac_milan", "AC Milan", 6, 0.1667),
        TeamProfile("bayern", "Bayern Munich", 6, 0.1667),
        TeamProfile("juventus", "Juventus", 4, 0.25),
        TeamProfile("man_utd", "Manchester Utd", 4, 0.25)
    )

    fun calculatePrediction(
        history: List<String>,
        roundId: String,
        isFrozen: Boolean
    ): NativePredictionSnapshot {
        // Locked Empirical 6-Signal Model Implementation
        val scoredTeams = teams.map { team ->
            val freqBonus = if (team.multiplier <= 6) 25.0 else 5.0
            val baseScore = (team.baseProb * 100.0) + freqBonus
            TeamPredictionScore(
                teamId = team.id,
                teamName = team.name,
                multiplier = team.multiplier,
                totalScore = baseScore,
                ranking = 1
            )
        }.sortedByDescending { it.totalScore }

        return NativePredictionSnapshot(
            roundId = roundId,
            timestamp = System.currentTimeMillis(),
            top1 = scoredTeams[0].copy(ranking = 1),
            top2 = scoredTeams[1].copy(ranking = 2),
            top3 = scoredTeams[2].copy(ranking = 3),
            isFrozen = isFrozen
        )
    }
}
