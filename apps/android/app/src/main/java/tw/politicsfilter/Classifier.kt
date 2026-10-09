package tw.politicsfilter

data class Rule(val term: String, val weight: Double)
data class Classification(val score: Double, val blocked: Boolean, val matched: List<String>)

object Classifier {
    private val rules = listOf(
        Rule("民進黨", 0.55), Rule("國民黨", 0.55), Rule("民眾黨", 0.55),
        Rule("政黨", 0.35), Rule("黨團", 0.40), Rule("選舉", 0.65),
        Rule("候選人", 0.55), Rule("競選", 0.55), Rule("罷免", 0.65),
        Rule("公投", 0.60), Rule("總統府", 0.55), Rule("行政院", 0.50),
        Rule("立法院", 0.60), Rule("立委", 0.45), Rule("議員", 0.35),
        Rule("三讀", 0.55), Rule("法案", 0.40), Rule("修法", 0.45),
        Rule("預算案", 0.45), Rule("兩岸", 0.50), Rule("台海", 0.45),
        Rule("統獨", 0.60), Rule("外交", 0.35), Rule("制裁", 0.40),
        Rule("政策", 0.30), Rule("兵役", 0.30), Rule("勞基法", 0.35),
        Rule("政治", 0.38), Rule("政客", 0.40), Rule("執政黨", 0.50),
        Rule("在野黨", 0.50)
    )

    fun classify(text: String, threshold: Double = 0.62): Classification {
        val normalized = text.replace(Regex("\\s+"), " ").trim()
        if (normalized.isBlank()) return Classification(0.0, false, emptyList())

        val matched = rules.filter { normalized.contains(it.term, ignoreCase = true) }
        val strongContext = listOf(
            "宣布", "表決", "攻防", "質詢", "提案", "修法", "政策", "法案", "選舉", "罷免", "公投", "黨團"
        ).any { normalized.contains(it) }

        val score = (matched.sumOf { it.weight } + if (strongContext && matched.isNotEmpty()) 0.12 else 0.0)
            .coerceIn(0.0, 1.0)

        return Classification(score, score >= threshold, matched.map { it.term })
    }
}
