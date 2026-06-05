# Novel2Screen YAML Schema 设计

## 1. 设计目标

本文档定义 Novel2Screen 导出的结构化 YAML 剧本文件格式。该 Schema 服务于以下场景：

1. 保存小说影视化项目的核心创作资产。
2. 支持剧本、分镜、审校和质量评估结果的统一导出。
3. 支持后续重新导入、二次编辑、自动校验和外部工具解析。
4. 保留 AI 生成结果与原文、章节、事件之间的追溯关系。

## 2. 设计原则

1. 结构稳定：顶层字段保持稳定，新增能力优先通过可选字段扩展。
2. 可追溯：人物、事件、场次、分镜和审校问题都应尽量保留来源引用。
3. 可编辑：字段命名应接近业务语义，方便人工阅读和修改。
4. 可校验：字段类型、必填项和枚举值应明确。
5. 可扩展：允许通过 `extensions` 承载后续版本的实验字段。

## 3. 顶层结构

```yaml
schema_version: "1.0"
project: {}
source: {}
characters: []
relationships: []
story_graph: {}
script: {}
storyboard: {}
review: {}
quality: {}
export: {}
extensions: {}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| schema_version | string | 是 | Schema 版本号 |
| project | object | 是 | 项目元信息 |
| source | object | 是 | 原始小说和章节解析信息 |
| characters | array | 是 | 人物列表 |
| relationships | array | 是 | 人物关系列表 |
| story_graph | object | 是 | 故事图谱 |
| script | object | 是 | 剧本内容 |
| storyboard | object | 否 | 分镜脚本 |
| review | object | 否 | AI 审校结果 |
| quality | object | 否 | 剧本质量评估 |
| export | object | 是 | 导出信息 |
| extensions | object | 否 | 扩展字段 |

## 4. 字段定义

### 4.1 project

项目元信息。

```yaml
project:
  id: "project_001"
  title: "示例小说改编"
  description: "基于示例小说生成的影视化剧本"
  creator: "user_001"
  created_at: "2026-06-05T13:00:00+08:00"
  updated_at: "2026-06-05T13:30:00+08:00"
  status: "draft"
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 项目唯一标识 |
| title | string | 是 | 项目标题 |
| description | string | 否 | 项目简介 |
| creator | string | 否 | 创建者标识 |
| created_at | string | 是 | ISO 8601 创建时间 |
| updated_at | string | 是 | ISO 8601 更新时间 |
| status | string | 是 | 项目状态 |

`status` 可选值：`draft`、`processing`、`reviewing`、`completed`、`archived`。

### 4.2 source

原始小说文件和章节解析结果。

```yaml
source:
  document:
    id: "doc_001"
    filename: "novel.docx"
    file_type: "docx"
    language: "zh-CN"
    checksum: "sha256:example"
  parse_result:
    chapter_count: 2
    total_characters: 36800
    parser_version: "parser-1.0"
  chapters:
    - id: "chapter_001"
      index: 1
      title: "第一章 雨夜"
      summary: "主角在雨夜抵达旧城。"
      word_count: 8200
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| document.id | string | 是 | 原始文档 ID |
| document.filename | string | 是 | 文件名 |
| document.file_type | string | 是 | 文件类型 |
| document.language | string | 否 | 文本语言 |
| document.checksum | string | 否 | 文件校验值 |
| parse_result.chapter_count | integer | 是 | 章节数量 |
| parse_result.total_characters | integer | 否 | 总字符数 |
| parse_result.parser_version | string | 否 | 解析器版本 |
| chapters | array | 是 | 章节列表 |

`document.file_type` 可选值：`txt`、`docx`。

章节对象字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 章节 ID |
| index | integer | 是 | 章节序号，从 1 开始 |
| title | string | 是 | 章节标题 |
| summary | string | 否 | 章节摘要 |
| word_count | integer | 否 | 章节字数 |

### 4.3 characters

人物列表。

```yaml
characters:
  - id: "char_001"
    name: "林澈"
    aliases: ["阿澈"]
    identity: "青年侦探"
    description: "冷静、敏锐，正在调查旧城失踪案。"
    first_appearance:
      chapter_id: "chapter_001"
      excerpt: "林澈推开旧旅馆的门。"
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 人物 ID |
| name | string | 是 | 人物名称 |
| aliases | array | 否 | 别名列表 |
| identity | string | 否 | 身份 |
| description | string | 否 | 人物简介 |
| first_appearance | object | 否 | 首次出现信息 |

### 4.4 relationships

人物关系。

```yaml
relationships:
  - id: "rel_001"
    from_character_id: "char_001"
    to_character_id: "char_002"
    type: "ally"
    label: "合作"
    description: "两人共同调查失踪案。"
    evidence:
      chapter_id: "chapter_002"
      excerpt: "他们决定暂时联手。"
    confidence: 0.86
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 关系 ID |
| from_character_id | string | 是 | 起点人物 ID |
| to_character_id | string | 是 | 终点人物 ID |
| type | string | 是 | 关系类型 |
| label | string | 是 | 展示名称 |
| description | string | 否 | 关系说明 |
| evidence | object | 否 | 证据来源 |
| confidence | number | 否 | 置信度，范围 0 到 1 |

`type` 建议值：`family`、`enemy`、`ally`、`lover`、`mentor`、`student`、`colleague`、`unknown`。

### 4.5 story_graph

故事图谱，包含事件、地点、时间线以及图谱边。

```yaml
story_graph:
  events:
    - id: "event_001"
      title: "抵达旧城"
      summary: "林澈在暴雨夜抵达旧城并入住旅馆。"
      chapter_id: "chapter_001"
      participants: ["char_001"]
      location_id: "loc_001"
      time_label: "雨夜"
      timeline_order: 1
      evidence:
        excerpt: "雨水淹没了旧城的石板路。"
  locations:
    - id: "loc_001"
      name: "旧城旅馆"
      description: "靠近码头的老式旅馆。"
  timeline:
    - order: 1
      event_id: "event_001"
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| events | array | 是 | 故事事件 |
| locations | array | 是 | 地点列表 |
| timeline | array | 是 | 时间线 |

事件对象字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 事件 ID |
| title | string | 是 | 事件标题 |
| summary | string | 是 | 事件摘要 |
| chapter_id | string | 是 | 来源章节 ID |
| participants | array | 是 | 参与人物 ID 列表 |
| location_id | string | 否 | 地点 ID |
| time_label | string | 否 | 时间描述 |
| timeline_order | integer | 是 | 时间线顺序 |
| evidence | object | 否 | 来源证据 |

地点对象字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 地点 ID |
| name | string | 是 | 地点名称 |
| description | string | 否 | 地点描述 |

### 4.6 script

剧本内容。

```yaml
script:
  id: "script_001"
  title: "旧城雨夜"
  style: "film"
  version: "v1"
  logline: "青年侦探在旧城雨夜卷入失踪谜案。"
  source_event_ids: ["event_001"]
  scenes:
    - id: "scene_001"
      index: 1
      title: "雨夜抵达"
      location: "旧城旅馆外"
      time: "夜"
      characters: ["char_001"]
      source_event_ids: ["event_001"]
      synopsis: "林澈抵达旧城旅馆。"
      beats:
        - type: "action"
          content: "暴雨中，林澈拖着行李箱停在旅馆门前。"
        - type: "dialogue"
          character_id: "char_001"
          character_name: "林澈"
          content: "这里就是最后的地址。"
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 剧本 ID |
| title | string | 是 | 剧本标题 |
| style | string | 是 | 剧本风格 |
| version | string | 是 | 剧本版本 |
| logline | string | 否 | 一句话梗概 |
| source_event_ids | array | 否 | 关联故事事件 |
| scenes | array | 是 | 场次列表 |

`style` 可选值：`film`、`tv_series`、`short_drama`、`animation`。

场次对象字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 场次 ID |
| index | integer | 是 | 场次序号 |
| title | string | 是 | 场次标题 |
| location | string | 是 | 场景地点 |
| time | string | 是 | 场景时间 |
| characters | array | 是 | 出场人物 ID |
| source_event_ids | array | 否 | 来源事件 ID |
| synopsis | string | 否 | 场次摘要 |
| beats | array | 是 | 动作与对白列表 |

剧本片段 `beats` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| type | string | 是 | 片段类型 |
| content | string | 是 | 文本内容 |
| character_id | string | 否 | 对白人物 ID |
| character_name | string | 否 | 对白人物名称 |
| emotion | string | 否 | 情绪提示 |

`type` 可选值：`action`、`dialogue`、`transition`、`note`。

### 4.7 storyboard

分镜脚本。

```yaml
storyboard:
  shots:
    - id: "shot_001"
      scene_id: "scene_001"
      index: 1
      image_description: "雨夜街道远景，旅馆招牌在风中摇晃。"
      shot_size: "wide"
      camera_movement: "slow_push_in"
      lighting: "冷色雨夜光，旅馆门口有暖色灯光"
      duration_seconds: 6
      audio: "雨声、远处汽笛声"
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| shots | array | 是 | 镜头列表 |

镜头对象字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 镜头 ID |
| scene_id | string | 是 | 对应场次 ID |
| index | integer | 是 | 镜头序号 |
| image_description | string | 是 | 画面描述 |
| shot_size | string | 是 | 景别 |
| camera_movement | string | 是 | 运镜方式 |
| lighting | string | 否 | 光线建议 |
| duration_seconds | number | 否 | 镜头时长 |
| audio | string | 否 | 声音建议 |

`shot_size` 建议值：`extreme_wide`、`wide`、`medium`、`close_up`、`extreme_close_up`。

`camera_movement` 建议值：`static`、`pan`、`tilt`、`dolly`、`tracking`、`handheld`、`slow_push_in`。

### 4.8 review

AI 剧本审校结果。

```yaml
review:
  reviewed_at: "2026-06-05T13:20:00+08:00"
  model: "llm-name"
  issues:
    - id: "issue_001"
      type: "timeline"
      severity: "medium"
      scene_id: "scene_001"
      beat_index: 2
      message: "该对白暗示角色已知道后续事件，可能存在时间线提前。"
      suggestion: "调整对白，使其只表达当前场景可知信息。"
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| reviewed_at | string | 是 | 审校时间 |
| model | string | 否 | 使用的模型 |
| issues | array | 是 | 问题列表 |

问题对象字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 问题 ID |
| type | string | 是 | 问题类型 |
| severity | string | 是 | 严重程度 |
| scene_id | string | 否 | 关联场次 |
| beat_index | integer | 否 | 关联片段序号 |
| message | string | 是 | 问题说明 |
| suggestion | string | 是 | 修改建议 |

`type` 可选值：`character_consistency`、`timeline`、`scene_integrity`、`dialogue_distribution`、`continuity`、`other`。

`severity` 可选值：`low`、`medium`、`high`、`critical`。

### 4.9 quality

剧本质量评估。

```yaml
quality:
  total_score: 82
  dimensions:
    - name: "完整性"
      key: "completeness"
      score: 85
      comment: "主要场次完整，但结尾动机还可加强。"
    - name: "一致性"
      key: "consistency"
      score: 80
      comment: "人物行为基本一致。"
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| total_score | number | 是 | 总分，范围 0 到 100 |
| dimensions | array | 是 | 维度评分 |

维度对象字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 维度中文名 |
| key | string | 是 | 维度键 |
| score | number | 是 | 维度分，范围 0 到 100 |
| comment | string | 是 | 评分说明 |

`key` 建议值：`completeness`、`consistency`、`scene_continuity`、`dialogue_distribution`、`adaptation_fidelity`。

### 4.10 export

导出信息。

```yaml
export:
  exported_at: "2026-06-05T13:30:00+08:00"
  exporter_version: "exporter-1.0"
  validated: true
  validation_errors: []
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| exported_at | string | 是 | 导出时间 |
| exporter_version | string | 否 | 导出器版本 |
| validated | boolean | 是 | 是否通过 Schema 校验 |
| validation_errors | array | 是 | 校验错误列表 |

## 5. 最小可用示例

```yaml
schema_version: "1.0"
project:
  id: "project_001"
  title: "旧城雨夜"
  description: "小说影视化改编示例"
  creator: "user_001"
  created_at: "2026-06-05T13:00:00+08:00"
  updated_at: "2026-06-05T13:30:00+08:00"
  status: "draft"
source:
  document:
    id: "doc_001"
    filename: "old_city.docx"
    file_type: "docx"
    language: "zh-CN"
    checksum: "sha256:example"
  parse_result:
    chapter_count: 1
    total_characters: 8200
    parser_version: "parser-1.0"
  chapters:
    - id: "chapter_001"
      index: 1
      title: "第一章 雨夜"
      summary: "林澈抵达旧城旅馆。"
      word_count: 8200
characters:
  - id: "char_001"
    name: "林澈"
    aliases: ["阿澈"]
    identity: "青年侦探"
    description: "冷静、敏锐，正在调查旧城失踪案。"
    first_appearance:
      chapter_id: "chapter_001"
      excerpt: "林澈推开旧旅馆的门。"
relationships: []
story_graph:
  events:
    - id: "event_001"
      title: "抵达旧城"
      summary: "林澈在暴雨夜抵达旧城并入住旅馆。"
      chapter_id: "chapter_001"
      participants: ["char_001"]
      location_id: "loc_001"
      time_label: "雨夜"
      timeline_order: 1
      evidence:
        excerpt: "雨水淹没了旧城的石板路。"
  locations:
    - id: "loc_001"
      name: "旧城旅馆"
      description: "靠近码头的老式旅馆。"
  timeline:
    - order: 1
      event_id: "event_001"
script:
  id: "script_001"
  title: "旧城雨夜"
  style: "film"
  version: "v1"
  logline: "青年侦探在旧城雨夜卷入失踪谜案。"
  source_event_ids: ["event_001"]
  scenes:
    - id: "scene_001"
      index: 1
      title: "雨夜抵达"
      location: "旧城旅馆外"
      time: "夜"
      characters: ["char_001"]
      source_event_ids: ["event_001"]
      synopsis: "林澈抵达旧城旅馆。"
      beats:
        - type: "action"
          content: "暴雨中，林澈拖着行李箱停在旅馆门前。"
        - type: "dialogue"
          character_id: "char_001"
          character_name: "林澈"
          emotion: "低声"
          content: "这里就是最后的地址。"
storyboard:
  shots:
    - id: "shot_001"
      scene_id: "scene_001"
      index: 1
      image_description: "雨夜街道远景，旅馆招牌在风中摇晃。"
      shot_size: "wide"
      camera_movement: "slow_push_in"
      lighting: "冷色雨夜光，旅馆门口有暖色灯光"
      duration_seconds: 6
      audio: "雨声、远处汽笛声"
review:
  reviewed_at: "2026-06-05T13:20:00+08:00"
  model: "llm-name"
  issues: []
quality:
  total_score: 82
  dimensions:
    - name: "完整性"
      key: "completeness"
      score: 85
      comment: "主要场次完整。"
    - name: "一致性"
      key: "consistency"
      score: 80
      comment: "人物行为基本一致。"
export:
  exported_at: "2026-06-05T13:30:00+08:00"
  exporter_version: "exporter-1.0"
  validated: true
  validation_errors: []
extensions: {}
```

## 6. 校验规则

1. `schema_version` 必须存在，当前版本为 `"1.0"`。
2. `project.id`、`project.title`、`source.document.id`、`script.id` 必须存在。
3. `source.document.file_type` 只能是 `txt` 或 `docx`。
4. `script.style` 只能是 `film`、`tv_series`、`short_drama`、`animation`。
5. `script.scenes` 至少包含一个场次。
6. 每个 `scene.id` 在同一剧本内必须唯一。
7. 每个 `character.id` 在同一文件内必须唯一。
8. `relationships.from_character_id` 和 `relationships.to_character_id` 必须能在 `characters` 中找到。
9. `story_graph.events.participants` 中的人物 ID 必须能在 `characters` 中找到。
10. `storyboard.shots.scene_id` 必须能在 `script.scenes` 中找到。
11. `quality.total_score` 和各维度 `score` 范围为 0 到 100。
12. `review.issues.severity` 只能是 `low`、`medium`、`high`、`critical`。

## 7. 版本扩展策略

1. 兼容性字段新增时，不修改已有字段含义。
2. 破坏性变更必须提升 `schema_version` 主版本号。
3. 实验性字段应放入 `extensions`。
4. 后端导入旧版本 YAML 时，应先执行版本迁移再进入业务流程。
