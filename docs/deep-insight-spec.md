# SkimAI — Deep Insight Specification & Design Document

This document defines the technical specification, AI prompt architecture, JSON schema, and UI mapping for the generalized **Deep Insight** report generation system in SkimAI. 

Unlike industry-specific templates, this system is designed to dynamically analyze **any keyword or industry** (e.g., F&B, Logistics, Fashion, Tech, Agriculture) in the Vietnamese market, utilizing aggregated real-time search and media data.

---

## 1. System Goals
* **Generality**: Support report generation for any search keyword/industry.
* **Professional Structure**: Generate a complete industry analysis covering Market Dynamics, Consumer Behaviour, SWOT Matrix, Competitors, Regional Potential, and APA References.
* **Accuracy & Trust**: Anchor AI insights in actual data collected from Search Providers (SerpApi Google/News, YouTube Data API) and output real sources formatted in APA 7th style.
* **Visual Premium Layout (Option 2 - Card-based)**: Organize the report into clean, interactive dashboard cards grouped under the existing tabs.

---

## 2. Generalized JSON Schema Specification
To support these enhancements, the backend AI response (returned by Gemini to the Spring Boot backend, then served to the React frontend) will be expanded. 

Below is the updated, generalized JSON format that the AI must output:

```json
{
  "marketInsight": "A high-level synthesis (4-5 sentences in Vietnamese) of the most prominent signals from the source data, explaining the core demand drivers.",
  
  "marketOverview": {
    "industrySize": "Estimated market size, CAGR, or growth momentum (e.g., 'Quy mô nội địa khoảng 7.2 tỷ USD, tăng trưởng 12%')",
    "keyCharacteristics": [
      "Core market characteristic 1 (e.g., 'Phụ thuộc lớn vào nhập khẩu nguyên liệu')",
      "Core market characteristic 2...",
      "Core market characteristic 3..."
    ]
  },

  "consumerBehaviour": {
    "purchasingCriteria": [
      { "criterion": "Price/Quality/Comfort", "importance": "Cao/Trung bình/Thấp", "description": "Brief explanation of how this criterion affects the purchasing decision." }
    ],
    "marketSegmentation": [
      { "segmentName": "Segment name (e.g., Mass Market)", "targetAudience": "Who they are", "strategy": "Actionable startup/marketing approach" }
    ]
  },

  "swot": {
    "strengths": [
      "Specific operational strength or agility factor",
      "Direct customer reach or localized positioning factor"
    ],
    "weaknesses": [
      "Capital constraint or scale disadvantage",
      "Lack of early-stage brand equity or supply chain leverage"
    ],
    "opportunities": [
      "Emerging digital sales channels or social commerce trend",
      "Niche demand shifting towards this keyword"
    ],
    "threats": [
      "Price wars with international/cross-border sellers",
      "Fast-changing consumer tastes or raw material volatility"
    ]
  },

  "opportunities": [
    "Opportunity card description 1...",
    "Opportunity card description 2...",
    "Opportunity card description 3..."
  ],

  "recommendation": "Strategic recommendation (Vietnamese) guiding the user on what action to take next (positioning, testing, channels).",
  
  "stats": [
    { "value": "Metric value (e.g., 85% or Cao)", "label": "Metric label (e.g., Điểm tiềm năng)" },
    { "value": "Metric value", "label": "Metric label (e.g., Mức độ cạnh tranh)" },
    { "value": "Metric value", "label": "Metric label (e.g., Tốc độ tăng trưởng)" }
  ],

  "mediaSignals": [
    { "title": "Signal title", "desc": "Detailed description of the signal from the data source..." }
  ],

  "trendPoints": [
    { "label": "Related keyword 1", "value": 85, "note": "Growth note (e.g., +25% search volume)" }
  ],

  "sentiment": {
    "positivePct": 65,
    "neutralPct": 25,
    "negativePct": 10,
    "topics": [
      { "name": "Sub-topic name", "change": "Mentions change trend" }
    ]
  },

  "competitors": [
    {
      "name": "Competitor/Channel name",
      "channelUrl": "URL reference (e.g., https://...)",
      "strengthLevel": "Mạnh / Trung bình / Mới nổi",
      "followers": "Subscriber count or reach estimation",
      "frequency": "Posting frequency",
      "note": "Short analytical note about their core strategy or niche"
    }
  ],

  "targetPersona": {
    "description": "General description of the target buyer profile.",
    "painPoints": [
      "Painpoint 1",
      "Painpoint 2"
    ],
    "searchIntents": [
      "Search intent 1",
      "Search intent 2"
    ]
  },

  "regionalPotential": {
    "analysisText": "Analysis of geographic demand distribution in Vietnam's regions.",
    "topRegions": [
      { "regionName": "Region/Province name (e.g., Hà Nội)", "percentage": 40, "demandLevel": "Cao" }
    ],
    "geographicInsights": [
      "Geographic marketing insight 1..."
    ]
  },

  "references": [
    "Proper APA 7th style reference string based on the sources provided in the input (e.g., 'FiinGroup. (2025). Báo cáo bán lẻ...')"
  ]
}
```

---

## 3. UI Card Mapping Specification (Option 2)
The frontend will map this JSON structure into interactive Cards across **four tabs** in `DeepInsightPage.jsx`:

### Tab 1: Overview (Báo cáo tổng quan)
* **Card 1: Nhận định thị trường** (Maps to `marketInsight` + `stats` metrics grid).
* **Card 2 [NEW]: Quy mô & Đặc điểm ngành** (Maps to `marketOverview.industrySize` and listing `keyCharacteristics`).
* **Card 3 [NEW]: Ma trận SWOT** (Rendered as a 2x2 grid representing Strengths, Weaknesses, Opportunities, and Threats from `swot` object).
* **Card 4: Tín hiệu truyền thông & Phân tích xu hướng** (Maps to `mediaSignals` and `trendPoints` table).
* **Card 5 [NEW]: Tài liệu tham khảo (References)** (Rendered at the bottom of the tab, displaying `references` list in APA format).

### Tab 2: Chân dung khách hàng (Persona)
* **Card 1: Hồ sơ khách hàng mục tiêu** (Maps to `targetPersona.description`).
* **Card 2: Vấn đề & Nỗi đau lớn nhất** (Maps to `targetPersona.painPoints`).
* **Card 3: Hành vi & Ý định tìm kiếm** (Maps to `targetPersona.searchIntents`).
* **Card 4 [NEW]: Phân khúc thị trường & Tiêu chí lựa chọn** (Displays a table mapping `consumerBehaviour.marketSegmentation` and lists `purchasingCriteria` with their importance).

### Tab 3: Bản đồ đối thủ (Competitor Map)
* Keep existing layout listing active players in the industry mapping the `competitors` array (Name, URL, Strength, Followers, Frequency, Strategy Note).

### Tab 4: Tiềm năng khu vực (Regional Potential)
* Maps to `regionalPotential.analysisText`, `topRegions` table, and `geographicInsights`.

---

## 4. Prompt Engineering Architecture
To ensure Gemini generates high-quality, professional Vietnamese analysis for any industry, the prompt in `DefaultAiProvider.java` must follow these rules:

1. **Role Definition**: Senior Market Research Strategist at a premier consulting firm (McKinsey/FiinGroup style).
2. **Strict Grounding**: Base all sizing and claims on provided context data. Do not hallucinate numbers. If data is sparse, estimate ranges and add qualifiers (e.g., "Ước tính khoảng...", "Dựa trên xu hướng thảo luận...").
3. **Vietnamese Language Standard**: Use formal, corporate Vietnamese terminology (e.g., use "Động lượng xu hướng" instead of "Trending", "Tiêu chí quyết định mua sắm" instead of "Buying factors", "Nỗi đau của khách hàng" for "Painpoints").
4. **SWOT Generation Guidelines**:
   * **Strengths / Weaknesses**: Frame them from the perspective of an *entering startup* or *SMB* trying to capitalize on the keyword.
   * **Opportunities / Threats**: Frame them as macroeconomic, regulatory, or technological changes impacting the industry.
5. **APA 7th Reference Synthesis**: Instruct the model to look at the sources metadata and generate a standard APA reference block at the end (e.g., using authoring platform names, domains, and titles from the headlines data).

---

## 5. Document Exporting Format (.doc)
When the user clicks the "Xuất báo cáo" button, the export generator will serialize all the sections from the tabs into a single, beautifully structured document:
1. Header & Metadata block.
2. Section 1: Nhận định thị trường & Quy mô ngành.
3. Section 2: Chân dung khách hàng & Phân khúc tiêu dùng.
4. Section 3: Bản đồ đối thủ cạnh tranh.
5. Section 4: Tiềm năng địa lý khu vực.
6. Section 5: Ma trận SWOT (formatted as an HTML table).
7. Section 6: Khuyến nghị chiến lược.
8. Section 7: Tài liệu tham khảo (References - APA 7th).
