package com.football.analyzer.capture

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.util.DisplayMetrics
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.football.analyzer.MainActivity
import com.football.analyzer.R
import com.football.analyzer.prediction.PredictionEngine
import com.football.analyzer.vision.NativeVisionResult
import com.football.analyzer.vision.OpenCVGameAnalyzer

class MediaProjectionService : Service() {

    private val TAG = "MediaProjectionService"

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var handlerThread: HandlerThread? = null
    private var backgroundHandler: Handler? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var isMinimized = false
    private var isPaused = false

    private val visionAnalyzer = OpenCVGameAnalyzer()
    private val predictionEngine = PredictionEngine()

    private var totalFramesReceived: Long = 0
    private var lastObservedRoundId: String? = null
    private var isPredictionFrozen: Boolean = false

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        Log.i(TAG, "[MediaProjection] Service created")
        handlerThread = HandlerThread("MediaProjectionCaptureThread").apply { start() }
        backgroundHandler = Handler(handlerThread!!.looper)
        windowManager = getSystemService(WINDOW_SERVICE) as? WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "[MediaProjection] onStartCommand received")

        // 1. MUST start foreground IMMEDIATELY with correct FGS type for Android 14+
        val notification = buildForegroundNotification()
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
            Log.i(TAG, "[MediaProjection] Foreground service started successfully")
        } catch (e: Throwable) {
            Log.e(TAG, "[MediaProjection] startForeground error: ${e.message}", e)
        }

        // 2. Initialize floating HUD if not already added
        mainHandler.post {
            if (floatingView == null) {
                createFloatingOverlay()
            }
        }

        // 3. Extract MediaProjection token if provided
        val resultCode = intent?.getIntExtra("RESULT_CODE", 0) ?: 0
        val dataIntent: Intent? = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent?.getParcelableExtra("DATA_INTENT", Intent::class.java)
                    ?: @Suppress("DEPRECATION") (intent?.getParcelableExtra("DATA_INTENT") as? Intent)
            } else {
                @Suppress("DEPRECATION")
                intent?.getParcelableExtra("DATA_INTENT") as? Intent
            }
        } catch (e: Throwable) {
            @Suppress("DEPRECATION")
            intent?.getParcelableExtra("DATA_INTENT") as? Intent
        }

        Log.i(TAG, "[MediaProjection] Intent extras: resultCode=$resultCode, hasData=${dataIntent != null}")

        if (resultCode != 0 && dataIntent != null && mediaProjection == null) {
            try {
                val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                mediaProjection = projectionManager.getMediaProjection(resultCode, dataIntent)
                Log.i(TAG, "[MediaProjection] MediaProjection token obtained: $mediaProjection")

                // Android 14+ MANDATE: Register Callback before createVirtualDisplay
                mediaProjection?.registerCallback(object : MediaProjection.Callback() {
                    override fun onStop() {
                        Log.i(TAG, "[MediaProjection] MediaProjection stopped by system callback")
                        stopSelf()
                    }
                }, backgroundHandler)

                startCapture()
            } catch (e: Throwable) {
                Log.e(TAG, "[MediaProjection] Failed to start MediaProjection capture", e)
            }
        } else if (mediaProjection != null) {
            Log.i(TAG, "[MediaProjection] MediaProjection already active and running")
        }

        return START_STICKY
    }

    private fun startCapture() {
        try {
            val wm = windowManager ?: (getSystemService(WINDOW_SERVICE) as WindowManager)
            val metrics = DisplayMetrics()
            @Suppress("DEPRECATION")
            wm.defaultDisplay.getRealMetrics(metrics)

            val width = if (metrics.widthPixels > 0) metrics.widthPixels else 1080
            val height = if (metrics.heightPixels > 0) metrics.heightPixels else 1920
            val density = if (metrics.densityDpi > 0) metrics.densityDpi else 320

            // Capture at half resolution for high-performance non-blocking frame analysis
            val capWidth = width / 2
            val capHeight = height / 2

            imageReader = ImageReader.newInstance(capWidth, capHeight, PixelFormat.RGBA_8888, 2)
            Log.i(TAG, "[MediaProjection] ImageReader created (${capWidth}x${capHeight}, density: $density)")

            virtualDisplay = mediaProjection?.createVirtualDisplay(
                "BoomplayScreenCapture",
                capWidth,
                capHeight,
                density,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                imageReader?.surface,
                null,
                backgroundHandler
            )
            Log.i(TAG, "[MediaProjection] VirtualDisplay created: $virtualDisplay")

            imageReader?.setOnImageAvailableListener({ reader ->
                val image = reader.acquireLatestImage()
                if (image != null) {
                    try {
                        totalFramesReceived++
                        if (!isPaused) {
                            val result = visionAnalyzer.processScreenFrame(image, capWidth, capHeight)
                            if (totalFramesReceived % 30 == 1L) {
                                Log.i(TAG, "[MediaProjection] Frames received: $totalFramesReceived | GameDetected: ${result.gameDetected}")
                            }
                            updateOverlayUI(result)
                        }
                    } catch (e: Throwable) {
                        Log.e(TAG, "[MediaProjection] Frame analysis exception: ${e.message}", e)
                    } finally {
                        image.close()
                    }
                }
            }, backgroundHandler)

            Log.i(TAG, "[MediaProjection] Live screen capture pipeline successfully started!")
        } catch (e: Throwable) {
            Log.e(TAG, "[MediaProjection] Error starting virtual display capture", e)
        }
    }

    private fun createFloatingOverlay() {
        try {
            val hasOverlayPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(this)
            } else {
                true
            }

            Log.i(TAG, "[FloatingHUD] Checking overlay permission: hasOverlayPermission=$hasOverlayPermission")
            if (!hasOverlayPermission) {
                Log.w(TAG, "[FloatingHUD] SYSTEM_ALERT_WINDOW permission NOT granted. Cannot attach HUD.")
                Toast.makeText(this, "Please grant Overlay Permission in app first", Toast.LENGTH_LONG).show()
                return
            }

            val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }

            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = 30
                y = 120
            }

            val inflater = LayoutInflater.from(this)
            floatingView = inflater.inflate(R.layout.layout_floating_overlay, null)

            val header = floatingView?.findViewById<View>(R.id.overlayHeader)
            val btnClose = floatingView?.findViewById<ImageButton>(R.id.btnCloseOverlay)
            val btnMinimize = floatingView?.findViewById<ImageButton>(R.id.btnMinimizeOverlay)
            val containerExpanded = floatingView?.findViewById<View>(R.id.containerExpanded)
            val containerMinimized = floatingView?.findViewById<View>(R.id.containerMinimized)

            btnClose?.setOnClickListener {
                Log.i(TAG, "[FloatingHUD] Close button clicked")
                stopSelf()
            }

            btnMinimize?.setOnClickListener {
                isMinimized = !isMinimized
                if (isMinimized) {
                    containerExpanded?.visibility = View.GONE
                    containerMinimized?.visibility = View.VISIBLE
                } else {
                    containerExpanded?.visibility = View.VISIBLE
                    containerMinimized?.visibility = View.GONE
                }
                Log.i(TAG, "[FloatingHUD] Minimized state toggled: isMinimized=$isMinimized")
            }

            containerMinimized?.setOnClickListener {
                isMinimized = false
                containerExpanded?.visibility = View.VISIBLE
                containerMinimized.visibility = View.GONE
                Log.i(TAG, "[FloatingHUD] Expanded from minimized bubble")
            }

            // Draggable Touch Listener
            header?.setOnTouchListener(object : View.OnTouchListener {
                private var initialX = 0
                private var initialY = 0
                private var initialTouchX = 0f
                private var initialTouchY = 0f

                override fun onTouch(v: View?, event: MotionEvent?): Boolean {
                    when (event?.action) {
                        MotionEvent.ACTION_DOWN -> {
                            initialX = params.x
                            initialY = params.y
                            initialTouchX = event.rawX
                            initialTouchY = event.rawY
                            return true
                        }
                        MotionEvent.ACTION_MOVE -> {
                            params.x = initialX + (event.rawX - initialTouchX).toInt()
                            params.y = initialY + (event.rawY - initialTouchY).toInt()
                            floatingView?.let {
                                try {
                                    windowManager?.updateViewLayout(it, params)
                                } catch (e: Exception) {
                                    Log.e(TAG, "[FloatingHUD] Error updating window layout", e)
                                }
                            }
                            return true
                        }
                    }
                    return false
                }
            })

            windowManager?.addView(floatingView, params)
            Log.i(TAG, "[FloatingHUD] WindowManager.addView SUCCESS: HUD is now visibly active above all apps")

            // Show initial standby state
            renderStandbyState()
        } catch (e: Throwable) {
            Log.e(TAG, "[FloatingHUD] WindowManager.addView FAILED: ${e.message}", e)
        }
    }

    private fun renderStandbyState() {
        val textSourceStatus = floatingView?.findViewById<TextView>(R.id.textSourceStatus)
        val textGameStatus = floatingView?.findViewById<TextView>(R.id.textGameStatus)
        val textCountdown = floatingView?.findViewById<TextView>(R.id.textCountdown)
        val textRoundId = floatingView?.findViewById<TextView>(R.id.textRoundId)
        val textModelStatus = floatingView?.findViewById<TextView>(R.id.textModelStatus)
        val textTopPick = floatingView?.findViewById<TextView>(R.id.textTopPick)
        val textTop2 = floatingView?.findViewById<TextView>(R.id.textTop2)

        textSourceStatus?.text = "SOURCE: WAITING FOR REAL BOOMPLAY FRAME"
        (textSourceStatus?.parent as? View)?.setBackgroundColor(0xFF0284C7.toInt())
        textGameStatus?.text = "GAME: NOT DETECTED"
        textGameStatus?.setTextColor(0xFFF87171.toInt())
        textCountdown?.text = "CLOCK: WAITING"
        textCountdown?.setTextColor(0xFF94A3B8.toInt())
        textRoundId?.text = "ROUND: WAITING FOR SYNC"
        textModelStatus?.text = "STANDBY"
        textModelStatus?.setTextColor(0xFF94A3B8.toInt())
        textTopPick?.text = "1. Waiting for real game frame..."
        textTop2?.text = "2. Waiting | 3. Waiting"
    }

    private fun updateOverlayUI(result: NativeVisionResult) {
        mainHandler.post {
            val textSourceStatus = floatingView?.findViewById<TextView>(R.id.textSourceStatus)
            val textGameStatus = floatingView?.findViewById<TextView>(R.id.textGameStatus)
            val textCountdown = floatingView?.findViewById<TextView>(R.id.textCountdown)
            val textRoundId = floatingView?.findViewById<TextView>(R.id.textRoundId)
            val textModelStatus = floatingView?.findViewById<TextView>(R.id.textModelStatus)
            val textTopPick = floatingView?.findViewById<TextView>(R.id.textTopPick)
            val textTop2 = floatingView?.findViewById<TextView>(R.id.textTop2)

            if (result.gameDetected) {
                textSourceStatus?.text = "🟢 REAL BOOMPLAY SCREEN: CONNECTED"
                (textSourceStatus?.parent as? View)?.setBackgroundColor(0xFF059669.toInt()) // Emerald green
                
                textGameStatus?.text = "GAME: FOOTBALL LEAGUE"
                textGameStatus?.setTextColor(0xFF34D399.toInt())

                if (result.countdown != null) {
                    textCountdown?.text = "⏱ ${result.countdown}s"
                    if (result.countdown <= 5) {
                        textCountdown?.setTextColor(0xFFEF4444.toInt()) // Red freeze alert
                        isPredictionFrozen = true
                        textModelStatus?.text = "LOCKED (≤5s)"
                        textModelStatus?.setTextColor(0xFFEF4444.toInt())
                    } else if (result.countdown <= 10) {
                        textCountdown?.setTextColor(0xFFF59E0B.toInt()) // Amber warning
                        isPredictionFrozen = false
                        textModelStatus?.text = "ACTIVE"
                        textModelStatus?.setTextColor(0xFF38BDF8.toInt())
                    } else {
                        textCountdown?.setTextColor(0xFF38BDF8.toInt()) // Cyan
                        isPredictionFrozen = false
                        textModelStatus?.text = "ACTIVE"
                        textModelStatus?.setTextColor(0xFF38BDF8.toInt())
                    }
                } else {
                    textCountdown?.text = "MATCH IN PLAY"
                    textCountdown?.setTextColor(0xFF94A3B8.toInt())
                    isPredictionFrozen = true
                    textModelStatus?.text = "MATCH RUNNING"
                    textModelStatus?.setTextColor(0xFF94A3B8.toInt())
                }

                if (result.roundId != null) {
                    textRoundId?.text = "ROUND: NO. ${result.roundId}"
                    lastObservedRoundId = result.roundId
                }

                // Run locked 6-signal PredictionEngine on verified real game screen
                val currentRound = result.roundId ?: lastObservedRoundId ?: "LIVE"
                val prediction = predictionEngine.calculatePrediction(
                    history = listOf("real_madrid", "psg", "juventus"),
                    roundId = currentRound,
                    isFrozen = isPredictionFrozen
                )

                textTopPick?.text = "1. ${prediction.top1.teamName} (X${prediction.top1.multiplier}) [Score: ${prediction.top1.totalScore.toInt()}]"
                textTop2?.text = "2. ${prediction.top2.teamName} (X${prediction.top2.multiplier}) | 3. ${prediction.top3.teamName} (X${prediction.top3.multiplier})"
            } else {
                // Game not currently in foreground / frame doesn't match Boomplay
                textSourceStatus?.text = "SOURCE: WAITING FOR REAL BOOMPLAY FRAME"
                (textSourceStatus?.parent as? View)?.setBackgroundColor(0xFF0284C7.toInt())
                
                textGameStatus?.text = "GAME: NOT DETECTED"
                textGameStatus?.setTextColor(0xFFF87171.toInt())
                
                textCountdown?.text = "CLOCK: WAITING"
                textCountdown?.setTextColor(0xFF94A3B8.toInt())
                
                textRoundId?.text = "ROUND: WAITING FOR SYNC"
                textModelStatus?.text = "STANDBY"
                textModelStatus?.setTextColor(0xFF94A3B8.toInt())
                
                textTopPick?.text = "1. Waiting for real game frame..."
                textTop2?.text = "2. Waiting | 3. Waiting"
            }
        }
    }

    private fun buildForegroundNotification(): Notification {
        val channelId = "football_analyzer_fgs_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Football Analyzer Active Screen Observer",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("⚽ Football League Analyzer HUD")
            .setContentText("Live screen observer active above Boomplay")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        Log.i(TAG, "[MediaProjection] Service destroying - cleaning up resources")
        try {
            virtualDisplay?.release()
            virtualDisplay = null
            imageReader?.close()
            imageReader = null
            mediaProjection?.stop()
            mediaProjection = null
            handlerThread?.quitSafely()
            handlerThread = null

            if (floatingView != null) {
                windowManager?.removeView(floatingView)
                floatingView = null
                Log.i(TAG, "[FloatingHUD] Floating view removed from WindowManager")
            }
        } catch (e: Throwable) {
            Log.e(TAG, "[MediaProjection] Error cleaning up resources", e)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val NOTIFICATION_ID = 1002
        var isRunning: Boolean = false
    }
}
