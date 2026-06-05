# Novel2Screen Frontend

当前前端是一个可直接运行的零依赖静态单页应用，目标不是只做视觉占位，而是先把文档约束下的前端工作流跑通。

## 目录结构

| 文件 | 说明 |
| --- | --- |
| `index.html` | 页面骨架，挂载侧边栏、Hero 区和主内容区域 |
| `styles.css` | 整体视觉系统、响应式布局和各模块样式 |
| `data.js` | 演示数据、图谱/剧本/分镜/评分生成逻辑 |
| `yaml.js` | YAML 结构生成与 Schema 规则校验 |
| `app.js` | 页面渲染、状态管理、交互逻辑、文件上传与工作流联动 |

## 当前能力

1. 项目工作台：展示任务进度、活动日志、MVP 闭环与前端能力框架。
2. 小说上传：支持 TXT / DOCX 文件选择与拖拽，TXT 会做前端章节拆分，DOCX 先走占位流程。
3. 图谱构建：展示人物关系图谱、角色详情和事件时间线，可重新执行前端模拟抽取。
4. 剧本编辑：支持风格切换、重新生成剧本、保存场次、增删场次、调整顺序和编辑片段。
5. 审校评分：生成启发式审校问题与多维质量评分。
6. 分镜脚本：根据当前剧本生成镜头建议，并支持按场次过滤查看。
7. YAML 导出：按 `schema_version: "1.0"` 生成预览，校验结构并下载文件。

## 与文档的对齐

1. `docs/requirement.md`
   前端页面模块覆盖上传、图谱、剧本、审校、分镜、导出等 MVP 环节。
2. `docs/schema_design.md`
   YAML 预览和校验围绕 `project/source/characters/story_graph/script/storyboard/review/quality/export/extensions` 组织。
3. `docs/architecture.md`
   页面中的任务状态、服务命名和工作流顺序对齐了 Project / Parser / Extraction / Script / Review / Storyboard / Export 这些模块边界。

## 运行方式

直接在浏览器里打开 `frontend/index.html`。

## 后续建议

1. 接入真实后端时，优先把 `data.js` 中的模拟生成逻辑替换为 API 调用。
2. 如果后续安装 Node.js，可以把当前这套结构迁移到 Vite + React + TypeScript，同时复用数据对象设计和页面布局。
