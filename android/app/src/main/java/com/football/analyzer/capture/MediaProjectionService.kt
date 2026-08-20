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
import android.util.DisplayMetrics
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.football.analyzer.MainActivity
import com.football.analyzer.R
import com.football.analyzer.prediction.PredictionEngine
import com.football.analyzer.vision.OpenCVGameAnalyzer

class MediaProjectionService : Service() {

    private val TAG = "MediaProjectionService"

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var handlerThread: HandlerThread? = null
    private var backgroundHandler: Handler? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    private lateinit var windowManager: WindowManager
    private var floatingView: View? = null
    private var isMinimized = false
    private var isPaused = false

    private val visionAnalyzer = OpenCVGameAnalyzer()
    private val predictionEngine = PredictionEngine()

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        Log.i(TAG, "MediaProjectionService created")
        handlerThread = HandlerThread("MediaProjectionCaptureThread").apply { start() }
        backgroundHandler = Handler(handlerThread!!.looper)
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "onStartCommand received")

        // 1. MUST start foreground IMMEDIATELY with correct FGS type for Android 14+
        val notification = buildForegroundNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        // 2. Initialize floating HUD if not already added
        if (floatingView == null) {
            createFloatingOverlay()
        }

        // 3. Extract MediaProjection token if provided
        val resultCode = intent?.getIntExtra("RESULT_CODE", 0) ?: 0
        val dataIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent?.getParcelableExtra("DATA_INTENT", Intent::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent?.getParcelableExtra("DATA_INTENT")
        }

        if (resultCode != 0 && dataIntent != null && mediaProjection == null) {
            try {
                val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                mediaProjection = projectionManager.getMediaProjection(resultCode, dataIntent)

                // Android 14+ MANDATE: Register Callback before createVirtualDisplay
                mediaProjection?.registerCallback(object : MediaProjection.Callback() {
                    override fun onStop() {
                        Log.i(TAG, "MediaProjection stopped by system")
                        stopSelf()
                    }
                }, backgroundHandler)

                startCapture()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start MediaProjection capture", e)
            }
        }

        return START_STICKY
    }

    private fun startCapture() {
        try {
            val metrics = DisplayMetrics()
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.getRealMetrics(metrics)

            val width = if (metrics.widthPixels > 0) metrics.widthPixels else 1080
            val height = if (metrics.heightPixels > 0) metrics.heightPixels else 1920
            val density = if (metrics.densityDpi > 0) metrics.densityDpi else 320

            // Capture at half resolution for maximum frame processing performance
            val capWidth = width / 2
            val capHeight = height / 2

            imageReader = ImageReader.newInstance(capWidth, capHeight, PixelFormat.RGBA_8888, 2)
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

            imageReader?.setOnImageAvailableListener({ reader ->
                val image = reader.acquireLatestImage()
                if (image != null) {
                    try {
                        if (!isPaused) {
                            val result = visionAnalyzer.processScreenFrame(image, capWidth, capHeight)
                            updateOverlayUI(result.countdown, result.roundId)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Frame analysis error", e)
                    } finally {
                        image.close()
                    }
                }
            }, backgroundHandler)

            Log.i(TAG, "Screen capture successfully started ($capWidth x $capHeight)")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting virtual display capture", e)
        }
    }

    private fun createFloatingOverlay() {
        try {
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
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = 40
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
            }

            containerMinimized?.setOnClickListener {
                isMinimized = false
                containerExpanded?.visibility = View.VISIBLE
                containerMinimized.visibility = View.GONE
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
                                    windowManager.updateViewLayout(it, params)
                                } catch (e: Exception) {
                                    Log.e(TAG, "Error updating window layout", e)
                                }
                            }
                            return true
                        }
                    }
                    return false
                }
            })

            windowManager.addView(floatingView, params)
            Log.i(TAG, "Floating HUD overlay added to WindowManager")

            // Initial prediction rendering
            renderInitialPredictions()
        } catch (e: Exception) {
            Log.e(TAG, "Error creating floating overlay", e)
        }
    }

    private fun renderInitialPredictions() {
        val snapshot = predictionEngine.calculatePrediction(
            history = listOf("real_madrid", "psg", "juventus"),
            roundId = "LIVE",
            isFrozen = false
        )
        val textTopPick = floatingView?.findViewById<TextView>(R.id.textTopPick)
        val textTop2 = floatingView?.findViewById<TextView>(R.id.textTop2)

        textTopPick?.text = "1. ${snapshot.top1.teamName} (X${snapshot.top1.multiplier})"
        textTop2?.text = "2. ${snapshot.top2.teamName} (X${snapshot.top2.multiplier}) | 3. ${snapshot.top3.teamName} (X${snapshot.top3.multiplier})"
    }

    private fun updateOverlayUI(countdown: Int?, roundId: String?) {
        mainHandler.post {
            val textCountdown = floatingView?.findViewById<TextView>(R.id.textCountdown)
            if (countdown != null) {
                textCountdown?.text = "⏱ ${countdown}s"
                if (countdown <= 10) {
                    textCountdown?.setTextColor(0xFFEF4444.toInt()) // Red warning
                } else {
                    textCountdown?.setTextColor(0xFFF59E0B.toInt()) // Amber
                }
            } else {
                textCountdown?.text = "LIVE"
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
            .setContentText("Screen observer and live HUD active")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        Log.i(TAG, "MediaProjectionService destroying")
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
                windowManager.removeView(floatingView)
                floatingView = null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error cleaning up resources", e)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val NOTIFICATION_ID = 1002
        var isRunning: Boolean = false
    }
}
