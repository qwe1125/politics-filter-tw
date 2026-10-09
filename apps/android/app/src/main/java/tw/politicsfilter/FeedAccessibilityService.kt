package tw.politicsfilter

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class FeedAccessibilityService : AccessibilityService() {
    private var lastSignature: Int = 0
    private var lastScanAt: Long = 0

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val now = System.currentTimeMillis()
        if (now - lastScanAt < 150) return
        lastScanAt = now

        val root = rootInActiveWindow ?: return
        val text = collectVisibleText(root)
        if (text.length < 8) return

        val signature = text.hashCode()
        if (signature == lastSignature) return
        lastSignature = signature

        val result = Classifier.classify(text)
        Log.d(
            "PoliticsFilterTW",
            "score=${result.score} blocked=${result.blocked} matched=${result.matched.joinToString()}"
        )
    }

    override fun onInterrupt() = Unit

    private fun collectVisibleText(root: AccessibilityNodeInfo): String {
        val parts = ArrayList<String>(32)
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(root)

        while (queue.isNotEmpty() && parts.size < 120) {
            val node = queue.removeFirst()
            if (node.isVisibleToUser) {
                node.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }?.let(parts::add)
                node.contentDescription?.toString()?.trim()?.takeIf { it.isNotEmpty() }?.let(parts::add)
            }
            for (i in 0 until node.childCount) {
                node.getChild(i)?.let(queue::add)
            }
        }
        return parts.distinct().joinToString(" ")
    }
}
