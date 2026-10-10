# TW Politics Dataset

This directory will hold neutral training / evaluation examples for political subject-matter detection.

## Reusable local vocabulary

The current rule vocabulary lives in `packages/classifier/src/lexicon.ts` as
`politicalLexicon`. It contains 143 weighted Traditional Chinese phrases in
ten topic categories. Other local filters can import the vocabulary without
depending on a social-platform adapter. The categories are:

| Category | Scope |
| --- | --- |
| `election` | Campaigns, voting, counting, recall and referendums |
| `party_politics` | Parties, coalitions, party leadership and political donations |
| `political_person` | Elected and appointed political offices |
| `government` | Executive and constitutional institutions, cabinet activity |
| `legislature` | Bills, readings, budgets, questioning and caucus negotiation |
| `cross_strait` | Taiwan–China relations and Taiwan Strait policy |
| `international_politics` | Diplomacy, foreign legislatures and sanctions |
| `public_policy` | Public budgets, housing, energy, labor and social policy |
| `political_commentary` | Political discussion and analysis |
| `political_meme` | Explicitly political memes |

Matching normalizes full-width characters and `臺`/`台` spelling. Weights are
heuristic MVP values, not measured probabilities. A weak phrase
such as `補助` or `民調` should not imply a political topic by itself in Medium
mode. A long phrase suppresses a contained shorter alias, so `中國國民黨` does
not count again as `國民黨`. Names of individual politicians, temporary slogans,
and image text are not part of this stable text vocabulary.

The initial terminology was checked against the [Central Election Commission's
election law](https://law.cec.gov.tw/LawContent.aspx?id=GL000292), the
[Legislative Yuan's legislative procedure](https://www.ly.gov.tw/Pages/List.aspx?nodeid=151),
[Executive Yuan policy and budget material](https://www.ey.gov.tw/Page/5C208DA85C814C47),
and [Mainland Affairs Council material](https://www.mac.gov.tw/). The categories
and weights are project choices; the official sources do not validate the
classifier's accuracy.

Rules:
- Label topic presence, not ideology.
- Include both political and non-political examples.
- Include ambiguous examples such as lifestyle posts mentioning public figures.
- Never infer or store user political preference.
