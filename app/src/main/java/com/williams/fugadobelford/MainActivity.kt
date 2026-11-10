package com.williams.fugadobelford

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.util.Log
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.window.OnBackInvokedDispatcher

/**
 * Casca nativa do Fuga do Belford.
 * O jogo 3D vive em assets/www (Three.js). Sem login, sem rede, sem anúncio.
 * O recorde fica no SharedPreferences deste aparelho.
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView
    private var lastBackMs = 0L

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes = window.attributes.apply {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#100814"))
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = View.OVER_SCROLL_NEVER
            isHapticFeedbackEnabled = false
            isLongClickable = false
            setOnLongClickListener { true }
        }

        webView.settings.apply {
            // JS só do nosso asset local. Não carregamos página remota.
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = false
            mediaPlaybackRequiresUserGesture = false
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
            textZoom = 100
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false)
        }

        webView.addJavascriptInterface(ScoreBridge(this), "AndroidScore")
        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(message: ConsoleMessage): Boolean {
                Log.d(TAG, "${message.messageLevel()} ${message.message()} (${message.lineNumber()})")
                return true
            }
        }

        setContentView(webView)
        webView.loadUrl(ASSET_URL)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT
            ) { handleBack() }
        }
        hideSystemUi()
    }

    private fun handleBack() {
        val now = SystemClock.uptimeMillis()
        if (now - lastBackMs < 350) return
        lastBackMs = now
        if (!::webView.isInitialized) {
            finish()
            return
        }
        // 1 = o jogo tratou (foi pro menu ou pediu pra fechar). 0 = página ainda não subiu.
        webView.evaluateJavascript(
            "(function(){if(window.fugaBack){window.fugaBack();return 1;}return 0;})()"
        ) { result ->
            if (result == null || result == "0" || result == "null") finish()
        }
    }

    @Deprecated("Compatibilidade com API 24–32")
    override fun onBackPressed() {
        handleBack()
        // Não chama super: o JS decide entre menu e fechar.
    }

    override fun onPause() {
        if (::webView.isInitialized) {
            webView.evaluateJavascript("window.fugaAppPause&&window.fugaAppPause()", null)
            webView.onPause()
        }
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized) {
            webView.onResume()
            webView.evaluateJavascript("window.fugaAppResume&&window.fugaAppResume()", null)
        }
        hideSystemUi()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemUi()
    }

    override fun onDestroy() {
        if (::webView.isInitialized) webView.destroy()
        super.onDestroy()
    }

    private fun hideSystemUi() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
        }
    }

    private companion object {
        const val TAG = "Fuga"
        const val ASSET_URL = "file:///android_asset/www/index.html"
    }
}

/** Ponte mínima pro recorde. Roda fora da UI thread — SharedPreferences aguenta. */
private class ScoreBridge(private val activity: Activity) {

    private val prefs = activity.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    @JavascriptInterface
    fun getHighScore(): Int = prefs.getInt(KEY, 0)

    @JavascriptInterface
    fun setHighScore(score: Int) {
        val safe = if (score < 0) 0 else score
        val current = prefs.getInt(KEY, 0)
        if (safe > current) {
            prefs.edit().putInt(KEY, safe).apply()
        }
    }

    @JavascriptInterface
    fun finishApp() {
        activity.runOnUiThread { activity.finish() }
    }

    private companion object {
        const val PREFS = "fuga_do_belford"
        const val KEY = "recorde"
    }
}
