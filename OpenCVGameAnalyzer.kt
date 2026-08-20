package com.football.analyzer.vision

import android.graphics.Bitmap
import android.media.Image
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.nio.ByteBuffer
import java.util.regex.Pattern

data class NativeVisionResult(
    val gameDetected: Boolean,
    val phase: String,
    val countdown: Int?,
    val roundId: String?,
    val detectedTeams: List<String>,
    val winnerTeam: String?,
    val confidence: Int,
    val frameTimestamp: Long = System.currentTimeMillis()
)

class OpenCVGameAnalyzer {

    private val TAG = "OpenCVGameAnalyzer"

    private val textRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    private var isOcrRunning = false
    private var lastOcrTimestamp: Long = 0
    private var framesProcessedCount: Long = 0

    // Persistent state tracking across frames
    private var lastDetectedCountdown: Int? = null
    private var lastDetectedRound: String? = null
    private var lastDetectedTeams: List<String> = emptyList()
    private var lastGameDetectedTime: Long = 0
    private var lastPhase: String = "STANDBY"

    // Known football league keywords for high-confidence screen matching
    private val footballKeywords = listOf(
        "football", "league", "virtual", "match", "bet", "round", "odds",
        "real madrid", "barcelona", "paris", "psg", "liverpool", "milan",
        "bayern", "juventus", "manchester", "arsenal", "chelsea", "score",
        "timer", "min", "sec", "table", "h2h", "1x2", "stadium",
        "select time", "normal", "senior", "master", "invest", "repeat", "result"
    )

    private val roundPattern = Pattern.compile("(?:round|no\\.?|match(?:day)?|#)\\s*([0-9A-Za-z\\-]+)", Pattern.CASE_INSENSITIVE)
    private val timerPattern = Pattern.compile("(\\d{1,2})\\s*(?:s|sec|seconds)?|00:(\\d{1,2})|(\\d{1,2})\\s*:\\s*(\\d{2})", Pattern.CASE_INSENSITIVE)

    /**
     * Processes live screen image from MediaProjection.
     * Combines high-speed optical pixel sampling with ML Kit on-device OCR.
     */
    fun processScreenImage(
        image: Image,
        screenWidth: Int,
        screenHeight: Int,
        onResult: (NativeVisionResult) -> Unit
    ) {
        framesProcessedCount++

        val plane = image.planes[0]
        val buffer: ByteBuffer = plane.buffer
        val pixelStride = plane.pixelStride
        val rowStride = plane.rowStride
        val rowPadding = rowStride - pixelStride * screenWidth

        // 1. Ultra-fast optical color & geometry analysis (executed every frame < 2ms)
        var greenPitchPixels = 0
        var darkThemePixels = 0
        var goldOddsPixels = 0
        var whiteTextPixels = 0

        val sampleStep = 12 // Fast sampling grid
        val totalSamples = (screenHeight / sampleStep) * (screenWidth / sampleStep)

        for (y in 0 until screenHeight step sampleStep) {
            val rowOffset = y * rowStride
            for (x in 0 until screenWidth step sampleStep) {
                val offset = rowOffset + x * pixelStride
                if (offset + 3 <= buffer.limit()) {
                    val r = buffer.get(offset).toInt() and 0xFF
                    val g = buffer.get(offset + 1).toInt() and 0xFF
                    val b = buffer.get(offset + 2).toInt() and 0xFF

                    // Green football pitch / stadium turf (broad tolerant color space)
                    if (g > 70 && g > (r * 1.15).toInt() && g > (b * 1.15).toInt()) {
                        greenPitchPixels++
                    }
                    // Dark betting UI / stadium sky / slate cards (#0A0F1D, #0F172A, #1E293B)
                    if (r < 50 && g < 50 && b < 65) {
                        darkThemePixels++
                    }
                    // Yellow/Gold/Amber countdown digits and odds highlight pills
                    if (r > 160 && g > 120 && b < 90) {
                        goldOddsPixels++
                    }
                    // High-contrast white text/numbers
                    if (r > 210 && g > 210 && b > 210) {
                        whiteTextPixels++
                    }
                }
            }
        }

        val greenRatio = greenPitchPixels.toDouble() / totalSamples.toDouble()
        val darkRatio = darkThemePixels.toDouble() / totalSamples.toDouble()
        val goldRatio = goldOddsPixels.toDouble() / totalSamples.toDouble()
        val whiteRatio = whiteTextPixels.toDouble() / totalSamples.toDouble()

        // Optical game screen detection criteria
        val opticalGameMatch = (greenRatio > 0.015) || 
                               (darkRatio > 0.12 && (goldRatio > 0.0003 || whiteRatio > 0.02)) ||
                               (goldRatio > 0.002 && darkRatio > 0.08)

        // 2. Perform OCR text analysis periodically (every 400ms) or when optical match triggers
        val now = System.currentTimeMillis()
        val shouldRunOcr = !isOcrRunning && (now - lastOcrTimestamp >= 400 || (opticalGameMatch && now - lastOcrTimestamp >= 250))

        if (shouldRunOcr) {
            isOcrRunning = true
            lastOcrTimestamp = now

            try {
                // Safely convert image buffer to Bitmap for ML Kit InputImage
                val bitmap = Bitmap.createBitmap(
                    screenWidth + (rowPadding / pixelStride),
                    screenHeight,
                    Bitmap.Config.ARGB_8888
                )
                buffer.rewind()
                bitmap.copyPixelsFromBuffer(buffer)

                val cropWidth = screenWidth.coerceAtMost(bitmap.width)
                val cropHeight = screenHeight.coerceAtMost(bitmap.height)
                val frameBitmap = if (rowPadding > 0 || bitmap.width != cropWidth || bitmap.height != cropHeight) {
                    Bitmap.createBitmap(bitmap, 0, 0, cropWidth, cropHeight)
                } else {
                    bitmap
                }

                val inputImage = InputImage.fromBitmap(frameBitmap, 0)
                textRecognizer.process(inputImage)
                    .addOnSuccessListener { visionText ->
                        isOcrRunning = false
                        val recognizedText = visionText.text
                        val lowerText = recognizedText.lowercase()

                        // Parse OCR results
                        var ocrGameDetected = false
                        var matchedKeywordsCount = 0
                        for (kw in footballKeywords) {
                            if (lowerText.contains(kw)) {
                                matchedKeywordsCount++
                            }
                        }

                        if (matchedKeywordsCount >= 1 || opticalGameMatch) {
                            ocrGameDetected = true
                            lastGameDetectedTime = System.currentTimeMillis()
                        }

                        // Extract Round Identifier
                        val roundMatcher = roundPattern.matcher(recognizedText)
                        if (roundMatcher.find()) {
                            lastDetectedRound = roundMatcher.group(1)?.trim()
                        }

                        // Extract Countdown Timer
                        var parsedCountdown: Int? = null
                        val lines = recognizedText.split("\n")
                        for (line in lines) {
                            val trimmed = line.trim()
                            // Look for patterns like "00:15", "15s", "12", "00:05", "5s"
                            if (trimmed.matches(Regex("^(00:)?([0-5]?[0-9])\\s*(s|sec)?$", RegexOption.IGNORE_CASE))) {
                                val cleanNum = trimmed.replace(Regex("[^0-9]"), "")
                                val num = cleanNum.toIntOrNull()
                                if (num != null && num in 0..90) {
                                    parsedCountdown = num
                                    break
                                }
                            }
                        }

                        // Fallback timer search in full text
                        if (parsedCountdown == null) {
                            val timerMatcher = timerPattern.matcher(recognizedText)
                            while (timerMatcher.find()) {
                                for (groupIdx in 1..timerMatcher.groupCount()) {
                                    val match = timerMatcher.group(groupIdx)
                                    if (!match.isNullOrEmpty()) {
                                        val num = match.toIntOrNull()
                                        if (num != null && num in 1..45) {
                                            parsedCountdown = num
                                            break
                                        }
                                    }
                                }
                                if (parsedCountdown != null) break
                            }
                        }

                        if (parsedCountdown != null) {
                            lastDetectedCountdown = parsedCountdown
                        }

                        // Extract detected teams from recognized text
                        val foundTeams = mutableListOf<String>()
                        val teamCandidates = listOf(
                            "Real Madrid", "Barcelona", "Paris SG", "Liverpool",
                            "AC Milan", "Bayern Munich", "Juventus", "Manchester Utd",
                            "Arsenal", "Chelsea", "Man City", "Inter Milan", "Dortmund", "Atletico"
                        )
                        for (team in teamCandidates) {
                            if (lowerText.contains(team.lowercase())) {
                                foundTeams.add(team)
                            }
                        }
                        if (foundTeams.isNotEmpty()) {
                            lastDetectedTeams = foundTeams
                        }

                        // Determine phase
                        val isRecentlyDetected = (System.currentTimeMillis() - lastGameDetectedTime) < 2500
                        val isLive = ocrGameDetected || isRecentlyDetected

                        val phase = when {
                            !isLive -> "WAITING_FOR_BOOMPLAY"
                            parsedCountdown != null && parsedCountdown <= 5 -> "LOCKED (≤5s)"
                            parsedCountdown != null -> "BETTING_COUNTDOWN"
                            lowerText.contains("play") || lowerText.contains("live") || lowerText.contains("match") -> "MATCH_PLAYING"
                            else -> "BETTING_ACTIVE"
                        }
                        lastPhase = phase

                        if (framesProcessedCount % 20 == 0L) {
                            Log.i(TAG, "[OCR] Live Game: $isLive | Phase: $phase | Timer: ${parsedCountdown ?: lastDetectedCountdown}s | Round: $lastDetectedRound | Keywords: $matchedKeywordsCount")
                        }

                        onResult(
                            NativeVisionResult(
                                gameDetected = isLive,
                                phase = phase,
                                countdown = parsedCountdown ?: lastDetectedCountdown,
                                roundId = lastDetectedRound,
                                detectedTeams = lastDetectedTeams,
                                winnerTeam = null,
                                confidence = if (ocrGameDetected) 96 else 85
                            )
                        )
                    }
                    .addOnFailureListener { e ->
                        isOcrRunning = false
                        Log.w(TAG, "[OCR] Text recognition notice: ${e.message}")
                        
                        // Emit optical result on OCR failure
                        emitOpticalResult(opticalGameMatch, onResult)
                    }
            } catch (e: Throwable) {
                isOcrRunning = false
                Log.e(TAG, "[OCR] Frame processing exception: ${e.message}", e)
                emitOpticalResult(opticalGameMatch, onResult)
            }
        } else {
            // High-frequency optical path between OCR frames
            emitOpticalResult(opticalGameMatch, onResult)
        }
    }

    private fun emitOpticalResult(opticalMatch: Boolean, onResult: (NativeVisionResult) -> Unit) {
        val now = System.currentTimeMillis()
        val isRecentlyDetected = (now - lastGameDetectedTime) < 2500
        val isGameActive = opticalMatch || isRecentlyDetected

        if (opticalMatch) {
            lastGameDetectedTime = now
        }

        onResult(
            NativeVisionResult(
                gameDetected = isGameActive,
                phase = lastPhase,
                countdown = lastDetectedCountdown,
                roundId = lastDetectedRound,
                detectedTeams = lastDetectedTeams,
                winnerTeam = null,
                confidence = if (isGameActive) 88 else 0
            )
        )
    }

    fun close() {
        try {
            textRecognizer.close()
            Log.i(TAG, "[OCR] TextRecognizer closed safely")
        } catch (e: Exception) {
            Log.w(TAG, "[OCR] Error closing recognizer: ${e.message}")
        }
    }
}
