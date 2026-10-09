package tw.politicsfilter

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 64, 48, 48)
        }

        layout.addView(TextView(this).apply {
            text = "Politics Filter TW\n\nAndroid 原型目前使用 Accessibility Service 在本機讀取可見文字並做政治內容分類。"
            textSize = 18f
        })

        layout.addView(Button(this).apply {
            text = "開啟無障礙設定"
            setOnClickListener {
                startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
            }
        })

        setContentView(layout)
    }
}
