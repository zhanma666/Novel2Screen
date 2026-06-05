# Novel2Screen 系统架构设计

## 1. 文档目标

本文档基于 `README.md`、`docs/requirement.md` 与 `docs/schema_design.md`，定义 Novel2Screen 的模块架构、数据流、服务边界和核心处理链路。

Novel2Screen 的核心目标是打通以下闭环：

小说上传与解析 -> 人物关系图谱 -> 故事图谱 -> 多风格剧本改编 -> AI 剧本审校 -> 人机协同编辑 -> 分镜脚本生成 -> 剧本质量评估 -> YAML 导出。

## 2. 架构原则

1. 分层清晰：前端、后端、AI 适配、数据存储和导出逻辑分层管理。
2. 模块解耦：小说解析、信息抽取、图谱构建、剧本生成、审校、分镜、评分和导出分别封装。
3. 可追溯：AI 生成内容必须能追溯到章节、事件、场次或提示词版本。
4. 可替换：大语言模型供应商、图谱渲染库、存储方案应可替换。
5. 可扩展：剧本风格、审校规则、质量评分维度和 YAML Schema 能继续扩展。
6. 首版务实：MVP 优先使用单体后端和本地/轻量数据库，先完成业务闭环。

## 3. 总体架构

```text
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                              │
│  项目管理 | 文件上传 | 图谱查看 | 剧本编辑 | 审校面板 | 导出  │
└───────────────────────────────┬──────────────────────────────┘
                                │ HTTP / WebSocket
┌───────────────────────────────▼──────────────────────────────┐
│                       Backend API                             │
│  Project API | Upload API | Graph API | Script API | Export   │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────┐
│                    Application Services                       │
│ Parser | Extractor | Graph Builder | Script Generator          │
│ Review | Quality Scoring | Storyboard | YAML Export            │
└───────────────┬───────────────────────────────┬──────────────┘
                │                               │
┌───────────────▼──────────────┐   ┌────────────▼───────────────┐
│        AI Adapter Layer       │   │       Data Access Layer     │
│ Prompt | Model Client | Logs   │   │ Repository | Schema Check   │
└───────────────┬──────────────┘   └────────────┬───────────────┘
                │                               │
┌───────────────▼──────────────┐   ┌────────────▼───────────────┐
│        LLM Provider           │   │       Storage Layer         │
│ OpenAI / Local / Others       │   │ DB | Object Files | YAML    │
└──────────────────────────────┘   └────────────────────────────┘
```

## 4. 技术分层

| 层级 | 职责 | 首版建议 |
| --- | --- | --- |
| Frontend | 页面交互、图谱展示、剧本编辑、任务状态展示 | Web 单页应用 |
| Backend API | 对外提供 REST API 和任务状态接口 | Python Web 服务 |
| Application Services | 承载核心业务逻辑 | 模块化服务类 |
| AI Adapter Layer | 统一封装大模型调用、提示词和响应解析 | Provider 适配器 |
| Data Access Layer | 统一读写项目、章节、人物、剧本等数据 | Repository 模式 |
| Storage Layer | 存储结构化数据、上传文件和导出文件 | SQLite/PostgreSQL + 文件存储 |

首版不建议拆成多个微服务。当前项目仍处于骨架阶段，单体模块化更适合快速验证需求；等任务量、并发和团队规模上来后，再拆分异步 Worker 或独立 AI 服务。

## 5. 前端模块

### 5.1 Project Workspace

项目工作台，负责展示项目列表、项目状态和最近编辑内容。

主要能力：

1. 创建项目。
2. 打开项目。
3. 查看项目处理进度。
4. 跳转到上传、图谱、剧本、审校、分镜和导出视图。

### 5.2 Upload View

小说上传与解析页面。

主要能力：

1. 上传 TXT/DOCX。
2. 展示文件解析状态。
3. 展示章节列表。
4. 展示解析错误。

### 5.3 Graph View

图谱展示页面。

主要能力：

1. 展示人物关系图谱。
2. 展示故事图谱。
3. 查看人物、关系、事件、地点和时间线详情。
4. 支持人工修正图谱数据。

### 5.4 Script Editor

剧本编辑页面。

主要能力：

1. 展示剧本场次。
2. 编辑场次标题、地点、时间、动作描述和对白。
3. 新增、删除、重排场次。
4. 手动触发审校、评分和分镜生成。

### 5.5 Review Panel

审校和质量评估面板。

主要能力：

1. 展示角色一致性、时间线、场景完整性和对白分布问题。
2. 展示问题严重程度。
3. 展示修改建议。
4. 展示质量总分和维度分。

### 5.6 Storyboard View

分镜脚本页面。

主要能力：

1. 按场次展示镜头。
2. 展示景别、运镜、画面描述、光线建议和镜头时长。
3. 编辑单个镜头。
4. 重新生成单场分镜。

### 5.7 Export View

导出页面。

主要能力：

1. 预览 YAML 导出结构。
2. 执行 Schema 校验。
3. 展示校验错误。
4. 下载 YAML 文件。

## 6. 后端模块

### 6.1 Project Service

负责项目生命周期管理。

职责：

1. 创建项目。
2. 查询项目。
3. 更新项目状态。
4. 聚合项目下的章节、图谱、剧本、审校、分镜和导出信息。

### 6.2 Document Parser Service

负责小说上传文件解析。

职责：

1. 校验文件类型。
2. 读取 TXT/DOCX 文本。
3. 清洗文本。
4. 识别章节标题。
5. 保存 `SourceDocument` 和 `Chapter`。

输出数据：

1. `source.document`
2. `source.parse_result`
3. `source.chapters`

### 6.3 Extraction Service

负责从章节文本中抽取人物、身份、人物关系、事件、地点和时间信息。

职责：

1. 按章节或文本块调用 AI 抽取。
2. 合并重复人物和地点。
3. 归一化人物别名。
4. 生成关系候选。
5. 生成事件候选。
6. 保存证据来源和置信度。

输出数据：

1. `characters`
2. `relationships`
3. `story_graph.events`
4. `story_graph.locations`
5. `story_graph.timeline`

### 6.4 Graph Builder Service

负责将抽取结果整理为前端可展示的图谱数据。

职责：

1. 生成人物图谱节点和边。
2. 生成故事图谱节点和边。
3. 支持按章节、人物、地点和时间线过滤。
4. 提供图谱数据修正后的重新计算能力。

输出数据：

1. 人物关系图谱视图模型。
2. 故事知识图谱视图模型。
3. 与 YAML Schema 对齐的结构化图谱数据。

### 6.5 Script Generation Service

负责多风格剧本生成。

职责：

1. 读取故事图谱和生成配置。
2. 组织剧本生成上下文。
3. 支持电影、电视剧、短剧、动漫风格。
4. 生成场次、动作描述和对白。
5. 建立剧本场次与故事事件的映射。

输出数据：

1. `script`
2. `script.scenes`
3. `script.scenes.beats`

### 6.6 Script Editing Service

负责用户编辑后的剧本保存和版本管理。

职责：

1. 保存场次修改。
2. 保存对白和动作描述修改。
3. 新增、删除、重排场次。
4. 记录剧本版本。
5. 标记审校和评分结果过期。

输出数据：

1. 最新剧本版本。
2. 剧本变更记录。

### 6.7 Review Service

负责 AI 剧本审校。

职责：

1. 检查角色一致性。
2. 检查时间线合理性。
3. 检查场景完整性。
4. 检查对白分布。
5. 输出问题位置、严重程度和修改建议。

输出数据：

1. `review.reviewed_at`
2. `review.model`
3. `review.issues`

### 6.8 Quality Scoring Service

负责剧本质量评估。

职责：

1. 根据剧本内容和审校问题计算总分。
2. 计算完整性、一致性、场景连续性、对白分布等维度评分。
3. 输出评分说明。
4. 将评分结果与审校问题关联。

输出数据：

1. `quality.total_score`
2. `quality.dimensions`

### 6.9 Storyboard Service

负责分镜脚本生成。

职责：

1. 按场次读取剧本内容。
2. 生成镜头设计。
3. 输出景别、运镜、光线建议和镜头时长。
4. 支持单场重新生成。
5. 支持分镜编辑保存。

输出数据：

1. `storyboard.shots`

### 6.10 YAML Export Service

负责 YAML 结构化导出。

职责：

1. 聚合项目完整数据。
2. 按 `docs/schema_design.md` 组织导出对象。
3. 执行 Schema 校验。
4. 生成 YAML 文件。
5. 保存导出记录。

输出数据：

1. `export.exported_at`
2. `export.exporter_version`
3. `export.validated`
4. `export.validation_errors`
5. YAML 文件路径或下载地址。

### 6.11 Task Service

负责长耗时任务编排。

职责：

1. 创建异步任务。
2. 更新任务状态。
3. 记录失败原因。
4. 为前端提供轮询或 WebSocket 状态。

适用任务：

1. 文本解析。
2. 人物和事件抽取。
3. 图谱构建。
4. 剧本生成。
5. AI 审校。
6. 分镜生成。
7. YAML 导出。

## 7. AI 适配层

### 7.1 设计目标

AI 适配层用于隔离业务逻辑和具体模型供应商，避免后端服务直接依赖某一个模型 API。

```text
Application Service
       │
       ▼
Prompt Template -> Model Adapter -> Response Parser -> Result Validator
       │                │                 │                 │
       ▼                ▼                 ▼                 ▼
 Prompt Version     LLM Provider     Structured JSON     Domain Object
```

### 7.2 核心组件

| 组件 | 职责 |
| --- | --- |
| Prompt Template | 管理抽取、生成、审校、分镜等提示词模板 |
| Model Adapter | 封装模型调用参数、认证、重试和超时 |
| Response Parser | 将模型输出解析为结构化 JSON |
| Result Validator | 校验 AI 输出是否满足业务字段要求 |
| Generation Log | 记录模型、提示词版本、输入摘要、输出摘要和时间 |

### 7.3 AI 调用类型

| 调用类型 | 输入 | 输出 |
| --- | --- | --- |
| 人物抽取 | 章节文本 | 人物、身份、别名 |
| 关系抽取 | 章节文本、人物列表 | 人物关系 |
| 事件抽取 | 章节文本 | 事件、地点、时间 |
| 剧本生成 | 故事图谱、风格配置 | 场次、动作、对白 |
| 剧本审校 | 剧本、故事图谱 | 审校问题 |
| 质量评分 | 剧本、审校问题 | 总分、维度分 |
| 分镜生成 | 场次内容 | 镜头列表 |

## 8. 数据存储设计

### 8.1 存储分类

| 数据类型 | 示例 | 存储建议 |
| --- | --- | --- |
| 结构化业务数据 | 项目、章节、人物、事件、剧本 | 关系数据库 |
| 原始上传文件 | TXT、DOCX | 文件存储 |
| 导出文件 | YAML | 文件存储 |
| AI 调用日志 | 提示词版本、模型名、输出摘要 | 数据库 |
| 临时任务状态 | 任务进度、失败原因 | 数据库或缓存 |

### 8.2 核心表或集合

| 名称 | 对应对象 | 说明 |
| --- | --- | --- |
| projects | Project | 项目元信息 |
| source_documents | SourceDocument | 上传文件记录 |
| chapters | Chapter | 章节解析结果 |
| characters | Character | 人物信息 |
| relationships | Relationship | 人物关系 |
| story_events | StoryEvent | 故事事件 |
| locations | Location | 地点 |
| scripts | Script | 剧本版本 |
| scenes | Scene | 剧本场次 |
| script_beats | Dialogue/Action | 动作、对白、转场 |
| shots | Shot | 分镜镜头 |
| review_issues | ReviewIssue | 审校问题 |
| quality_scores | QualityScore | 质量评分 |
| export_files | ExportFile | YAML 导出记录 |
| ai_generation_logs | GenerationLog | AI 调用记录 |
| tasks | Task | 异步任务状态 |

### 8.3 ID 设计

业务对象建议使用带前缀的字符串 ID，便于调试和 YAML 阅读。

| 对象 | ID 示例 |
| --- | --- |
| Project | `project_001` |
| SourceDocument | `doc_001` |
| Chapter | `chapter_001` |
| Character | `char_001` |
| Relationship | `rel_001` |
| Event | `event_001` |
| Location | `loc_001` |
| Script | `script_001` |
| Scene | `scene_001` |
| Shot | `shot_001` |
| ReviewIssue | `issue_001` |

## 9. 核心数据流

### 9.1 小说上传与解析流

```text
User Upload
  -> Upload API
  -> Document Parser Service
  -> File Storage 保存原始文件
  -> Chapter Parser 拆分章节
  -> Database 保存 SourceDocument 和 Chapter
  -> Frontend 展示章节列表
```

关键输出：

1. `SourceDocument`
2. `Chapter[]`
3. 解析任务状态。

### 9.2 人物关系图谱数据流

```text
Chapter[]
  -> Extraction Service
  -> AI Adapter 抽取人物和关系
  -> Entity Merge 合并人物别名
  -> Relationship Normalize 归一化关系
  -> Graph Builder Service
  -> Database 保存 Character 和 Relationship
  -> Frontend 渲染人物关系图谱
```

关键输出：

1. `Character[]`
2. `Relationship[]`
3. 人物图谱节点和边。

### 9.3 故事图谱数据流

```text
Chapter[]
  -> Extraction Service
  -> AI Adapter 抽取事件、地点、时间
  -> Event Merge 合并重复事件
  -> Timeline Builder 计算故事顺序
  -> Graph Builder Service
  -> Database 保存 StoryEvent、Location、Timeline
  -> Frontend 渲染故事图谱
```

关键输出：

1. `StoryEvent[]`
2. `Location[]`
3. `Timeline[]`
4. 故事图谱视图模型。

### 9.4 剧本生成数据流

```text
User Generation Config
  -> Script API
  -> Script Generation Service
  -> 读取 Character、Relationship、StoryEvent、Timeline
  -> AI Adapter 生成剧本
  -> Response Parser 解析场次和对白
  -> Result Validator 校验字段
  -> Database 保存 Script、Scene、Beat
  -> Frontend 展示剧本编辑器
```

关键输出：

1. `Script`
2. `Scene[]`
3. `Beat[]`
4. 剧本与事件映射关系。

### 9.5 人机协同编辑数据流

```text
Frontend Script Editor
  -> Script Editing API
  -> Script Editing Service
  -> 保存最新剧本版本
  -> 标记 review 和 quality 为 stale
  -> Frontend 展示已保存状态
```

关键输出：

1. 最新剧本版本。
2. 过期的审校状态。
3. 过期的评分状态。

### 9.6 AI 审校与质量评估数据流

```text
Script
  -> Review Service
  -> AI Adapter 检查一致性、时间线、场景完整性、对白分布
  -> Database 保存 ReviewIssue
  -> Quality Scoring Service
  -> 计算总分和维度分
  -> Database 保存 QualityScore
  -> Frontend 展示审校问题和评分
```

关键输出：

1. `ReviewIssue[]`
2. `QualityScore`
3. 可操作修改建议。

### 9.7 分镜脚本生成数据流

```text
Script Scene
  -> Storyboard Service
  -> AI Adapter 生成镜头设计
  -> Response Parser 解析镜头字段
  -> Database 保存 Shot
  -> Frontend 展示分镜脚本
```

关键输出：

1. `Shot[]`
2. 场次与镜头映射。
3. 分镜总时长。

### 9.8 YAML 导出数据流

```text
Project ID
  -> YAML Export API
  -> YAML Export Service
  -> 聚合 Project、Source、Characters、Relationships、StoryGraph、Script、Storyboard、Review、Quality
  -> Schema Validator
  -> YAML Serializer
  -> File Storage 保存 YAML
  -> Frontend 下载 YAML
```

关键输出：

1. 通过校验的 YAML 文件。
2. 导出记录。
3. 校验错误列表。

## 10. API 边界

首版 API 以 REST 为主。耗时任务使用任务 ID 轮询，后续可以补 WebSocket。

### 10.1 Project API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects` | 查询项目列表 |
| GET | `/api/projects/{project_id}` | 查询项目详情 |
| PATCH | `/api/projects/{project_id}` | 更新项目元信息 |

### 10.2 Upload API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/projects/{project_id}/source` | 上传小说文件 |
| GET | `/api/projects/{project_id}/chapters` | 查询章节列表 |
| GET | `/api/chapters/{chapter_id}` | 查询章节详情 |

### 10.3 Graph API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/projects/{project_id}/extract` | 启动人物和故事抽取 |
| GET | `/api/projects/{project_id}/characters` | 查询人物 |
| GET | `/api/projects/{project_id}/relationships` | 查询人物关系 |
| GET | `/api/projects/{project_id}/story-graph` | 查询故事图谱 |
| PATCH | `/api/characters/{character_id}` | 修正人物信息 |
| PATCH | `/api/relationships/{relationship_id}` | 修正人物关系 |

### 10.4 Script API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/projects/{project_id}/scripts` | 生成剧本 |
| GET | `/api/scripts/{script_id}` | 查询剧本 |
| PATCH | `/api/scripts/{script_id}` | 更新剧本元信息 |
| PATCH | `/api/scenes/{scene_id}` | 更新场次 |
| POST | `/api/scripts/{script_id}/scenes` | 新增场次 |
| DELETE | `/api/scenes/{scene_id}` | 删除场次 |

### 10.5 Review and Quality API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/scripts/{script_id}/review` | 启动 AI 审校 |
| GET | `/api/scripts/{script_id}/review` | 查询审校结果 |
| POST | `/api/scripts/{script_id}/quality` | 启动质量评估 |
| GET | `/api/scripts/{script_id}/quality` | 查询质量评分 |

### 10.6 Storyboard API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/scripts/{script_id}/storyboard` | 生成分镜 |
| GET | `/api/scripts/{script_id}/storyboard` | 查询分镜 |
| PATCH | `/api/shots/{shot_id}` | 更新镜头 |
| POST | `/api/scenes/{scene_id}/storyboard/regenerate` | 重新生成单场分镜 |

### 10.7 Export API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/projects/{project_id}/exports/yaml` | 导出 YAML |
| GET | `/api/exports/{export_id}` | 查询导出结果 |
| GET | `/api/exports/{export_id}/download` | 下载 YAML |

### 10.8 Task API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/tasks/{task_id}` | 查询任务状态 |
| POST | `/api/tasks/{task_id}/cancel` | 取消任务 |

## 11. 任务状态模型

耗时任务统一使用以下状态：

| 状态 | 说明 |
| --- | --- |
| pending | 等待执行 |
| running | 执行中 |
| succeeded | 执行成功 |
| failed | 执行失败 |
| canceled | 已取消 |

任务对象建议字段：

```yaml
task:
  id: "task_001"
  project_id: "project_001"
  type: "script_generation"
  status: "running"
  progress: 45
  message: "正在生成第 3 场剧本"
  error: null
  created_at: "2026-06-05T13:00:00+08:00"
  updated_at: "2026-06-05T13:02:00+08:00"
```

## 12. YAML Schema 对接

`docs/schema_design.md` 是导出服务的结构标准。后端内部数据可以拆表保存，但导出时必须聚合为以下结构：

```text
Project           -> project
SourceDocument    -> source.document
Chapter[]         -> source.chapters
Character[]       -> characters
Relationship[]    -> relationships
StoryEvent[]      -> story_graph.events
Location[]        -> story_graph.locations
Timeline[]        -> story_graph.timeline
Script + Scene[]  -> script
Shot[]            -> storyboard.shots
ReviewIssue[]     -> review.issues
QualityScore      -> quality
ExportFile        -> export
```

导出前必须执行 Schema 校验。校验失败时不应生成正式下载文件，应返回 `validation_errors` 给前端。

## 13. 错误处理

| 场景 | 处理方式 |
| --- | --- |
| 上传非法格式 | 返回 400，并说明仅支持 TXT/DOCX |
| 文件解析失败 | 任务状态置为 failed，记录失败原因 |
| AI 输出无法解析 | 保留原始输出摘要，触发结构化重试 |
| AI 输出字段缺失 | Result Validator 返回字段错误 |
| 图谱引用不存在 | 阻止保存或标记为待修正 |
| 剧本编辑冲突 | 使用版本号检测冲突 |
| YAML 校验失败 | 返回 validation_errors |

## 14. 安全与隐私

1. 上传文件大小应设置上限。
2. 后端日志不得记录完整小说正文和完整剧本正文。
3. AI 调用日志只保存输入摘要、输出摘要和追溯 ID。
4. 导出文件应绑定项目 ID。
5. 后续加入用户系统后，所有项目数据必须按用户隔离。

## 15. MVP 实施顺序

1. 建立项目、上传和章节解析模块。
2. 建立基础数据模型和 Repository。
3. 实现人物、关系、事件、地点和时间抽取。
4. 实现图谱查询 API。
5. 实现剧本生成和剧本编辑。
6. 实现 AI 审校和质量评分。
7. 实现分镜生成。
8. 实现 YAML 导出和 Schema 校验。
9. 接入前端页面和任务状态展示。

## 16. 后续扩展方向

1. 多人协同编辑。
2. 更复杂的剧本版本对比。
3. 更强的图谱人工修正工具。
4. 多模型路由和成本控制。
5. 面向制片流程的镜头、场景、角色表导出。
6. 与外部分镜工具或制片管理工具集成。
