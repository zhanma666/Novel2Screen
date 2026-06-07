(function () {
  console.log("app.js starting...");

  // 安全获取 dataApi 和 yamlApi，确保可用
  let dataApi = window.ScenecraftData;
  let yamlApi = window.ScenecraftYaml;

  console.log("dataApi:", dataApi);
  console.log("yamlApi:", yamlApi);

  // 如果 yamlApi 还没有加载，提供临时对象
  if (!yamlApi) {
    console.warn("yamlApi not found!");
    yamlApi = {
      buildExportModel: function(project) {
        return project;
      },
      validateProjectModel: function(model) {
        return {
          valid: true,
          errors: []
        };
      },
      stringifyYaml: function(obj, indent) {
        return "# YAML export is not available in offline mode";
      }
    };
  }

  // 如果 dataApi 还没有加载，尝试等待或提供默认值
  if (!dataApi) {
    console.warn("dataApi not found!");
    // 创建一个完整的 dataApi 临时对象
    dataApi = {
      styleLibrary: {
        film: {
          label: "电影",
          description: "压缩事件数量，强化氛围和镜头感。",
          actionTone: "镜头缓慢推进，环境先于人物进入叙事。",
          dialogueTone: "对白克制，强调潜台词。",
          emotion: "低声",
          pacing: "集中",
          shotSizes: ["wide", "medium", "close_up"],
          cameraMoves: ["slow_push_in", "tracking", "static"],
          lighting: "冷色雨夜光与局部暖光形成对照。",
          audio: "雨声、脚步声、低频环境音",
        },
        tv_series: {
          label: "电视剧",
          description: "保留更多铺垫与人物互动，适合分集推进。",
          actionTone: "镜头服务对白与角色关系，保留更多交互信息。",
          dialogueTone: "对白更完整，交代动机与关系。",
          emotion: "沉稳",
          pacing: "层层递进",
          shotSizes: ["medium", "close_up", "wide"],
          cameraMoves: ["pan", "static", "dolly"],
          lighting: "自然光与实景光源并重。",
          audio: "对白主导，环境音作为铺底",
        },
        short_drama: {
          label: "短剧",
          description: "强调冲突和反转，单场信息密度更高。",
          actionTone: "切入更直接，场次落点更明确。",
          dialogueTone: "对白短促有钩子，适合推进冲突。",
          emotion: "急促",
          pacing: "高压推进",
          shotSizes: ["close_up", "medium", "wide"],
          cameraMoves: ["handheld", "slow_push_in", "pan"],
          lighting: "对比更强，重点压住人物表情。",
          audio: "节奏性音乐与近距离收音",
        },
        animation: {
          label: "动漫",
          description: "强化视觉奇观和动作节奏，允许更夸张的表演。",
          actionTone: "动作描述更视觉化，强调构图和节奏。",
          dialogueTone: "对白更具角色感，可容纳夸张反应。",
          emotion: "锐利",
          pacing: "张弛分明",
          shotSizes: ["extreme_wide", "medium", "close_up"],
          cameraMoves: ["tracking", "tilt", "slow_push_in"],
          lighting: "允许更风格化的色彩分区和轮廓光。",
          audio: "环境音、拟音和节奏点配合动作",
        },
      },
      deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
      },
      nowIso: function() {
        return new Date().toISOString();
      },
      createEmptyProject: function() {
        return {
          schema_version: "1.0",
          project: {
            id: "project_001",
            title: "新项目",
            description: "一个新的小说影视化改编项目。",
            creator: "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: "editing",
          },
          source: { document: null, parse_result: null, chapters: [] },
          characters: [],
          relationships: [],
          story_graph: { events: [], locations: [], timeline: [] },
          script: { id: "script_001", title: "新项目", style: "film", version: "v1", logline: "", source_event_ids: [], scenes: [] },
          storyboard: { shots: [] },
          review: { reviewed_at: null, model: null, issues: [] },
          quality: { total_score: 0, dimensions: [] },
          export: { exported_at: null, exporter_version: null, validated: false, validation_errors: [] },
          extensions: {},
          meta: { graph_stale: false, review_stale: false, quality_stale: false, storyboard_stale: false, export_stale: false, graph_mode: "edit", layout: {} },
          tasks: [],
          activity_log: [],
        };
      },
      createDemoProject: function() {
        return this.createEmptyProject();
      },
      nextVersion: function(version) {
        const match = version.match(/v(\d+)/);
        const num = match ? parseInt(match[1], 10) : 1;
        return "v" + (num + 1);
      },
      buildExtractionFromSource: function(project) {
        return {
          characters: [],
          relationships: [],
          story_graph: { events: [], locations: [], timeline: [] }
        };
      },
      buildScriptFromStoryGraph: function(project, style) {
        return {
          id: "script_001",
          title: project.project.title || "新项目",
          style: style || "film",
          version: this.nextVersion(project.script.version),
          logline: "",
          source_event_ids: [],
          scenes: []
        };
      },
      buildReviewFromScript: function(project) {
        return {
          reviewed_at: new Date().toISOString(),
          model: "local",
          issues: []
        };
      },
      buildQualityFromReview: function(project) {
        return {
          total_score: 0,
          dimensions: []
        };
      },
      buildStoryboardFromScript: function(project) {
        return {
          shots: []
        };
      }
    };
  }

  // 缓存 DOM 查询结果，避免重复查询
  const domCache = {
    navList: null,
    sidebarProject: null,
    hero: null,
    sectionBody: null,
    toastStack: null,
    fileInput: null,
    uploadZone: null,
    beatEditor: null,
  };

  function getCachedElement(id) {
    if (!domCache[id]) {
      domCache[id] = document.getElementById(id);
    }
    return domCache[id];
  }

  const sectionDefinitions = [
    {
      key: "workspace",
      label: "项目工作台",
      eyebrow: "Operating Deck",
      description: "围绕根目录 README 中的 9 项核心功能，汇总项目、任务、活动与能力覆盖。",
    },
    {
      key: "upload",
      label: "小说上传与解析",
      eyebrow: "Source Intake",
      description: "处理 TXT / DOCX 输入，展示章节解析结果，并标记下游模块刷新状态。",
    },
    {
      key: "graph",
      label: "人物与故事图谱",
      eyebrow: "Knowledge Graph",
      description: "同时承载人物关系图谱与故事图谱，为剧本生成提供结构化上下文。",
    },
    {
      key: "script",
      label: "剧本改编与协同创作",
      eyebrow: "Script Editor",
      description: "支持多风格剧本改编，并通过在线编辑完成前端的人机协同创作流程。",
    },
    {
      key: "review",
      label: "AI审校与质量评估",
      eyebrow: "Review & Score",
      description: "覆盖 AI 剧本审校与剧本质量评估，让修改路径更可解释。",
    },
    {
      key: "storyboard",
      label: "分镜脚本生成",
      eyebrow: "Storyboard",
      description: "根据场次内容生成镜头设计、景别、运镜、光线和时长建议。",
    },
    {
      key: "export",
      label: "YAML剧本导出",
      eyebrow: "Schema Export",
      description: "按统一 Schema 导出 YAML 格式剧本文件，并在导出前执行结构校验。",
    },
  ];

  const taskDefinitions = {
    source_parse: { label: "小说上传与解析", short: "上传", group: "source" },
    graph_extract: { label: "人物/故事图谱", short: "图谱", group: "graph" },
    script_generation: { label: "多风格剧本改编", short: "改编", group: "script" },
    script_review: { label: "AI剧本审校", short: "审校", group: "review" },
    quality_scoring: { label: "剧本质量评估", short: "评分", group: "quality" },
    storyboard_generation: { label: "分镜脚本生成", short: "分镜", group: "storyboard" },
    yaml_export: { label: "YAML剧本导出", short: "导出", group: "export" },
  };

  const shotSizeLabels = {
    extreme_wide: "大全景",
    wide: "远景",
    medium: "中景",
    close_up: "近景",
    extreme_close_up: "特写",
  };

  const cameraLabels = {
    static: "静止",
    pan: "平移",
    tilt: "俯仰",
    dolly: "推拉",
    tracking: "跟拍",
    handheld: "手持",
    slow_push_in: "缓慢推进",
  };

  const beatTypeLabels = {
    action: "动作",
    dialogue: "对白",
    transition: "转场",
    note: "备注",
  };

  const validSectionKeys = new Set(sectionDefinitions.map(function (section) {
    return section.key;
  }));

  const initialSection = window.location.hash.replace(/^#/, "");

  const state = {
    hasEntered: false,
    data: dataApi.createEmptyProject(),
    ui: {
      activeSection: validSectionKeys.has(initialSection) ? initialSection : "workspace",
      selectedSceneId: "",
      selectedCharacterId: "",
      storyboardFilter: "all",
      pendingStyle: "film",
      toasts: [],
    },
  };

  state.ui.selectedSceneId = state.data.script.scenes[0] ? state.data.script.scenes[0].id : "";
  state.ui.selectedCharacterId = state.data.characters[0] ? state.data.characters[0].id : "";
  state.ui.pendingStyle = state.data.script.style;

  function escapeHtml(value) {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");  // 增强：防止 XSS
  }

  function safeGet(obj, path, defaultValue) {
    // 安全的深度属性访问
    return path.split('.').reduce((acc, part) => {
      return acc && acc[part] !== undefined ? acc[part] : defaultValue;
    }, obj);
  }

  function safeNumber(value, defaultValue = 0) {
    const num = Number(value);
    return Number.isNaN(num) ? defaultValue : num;
  }

  function safeDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    if (!value) {
      return "未记录";
    }

    const date = safeDate(value);
    if (!date) {
      return String(value);
    }

    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("zh-CN").format(safeNumber(value, 0));
  }

  function statusLabel(status) {
    switch (status) {
      case "succeeded":
        return "已完成";
      case "running":
        return "进行中";
      case "failed":
        return "失败";
      case "canceled":
        return "已取消";
      default:
        return "待处理";
    }
  }

  function statusTone(status) {
    switch (status) {
      case "succeeded":
        return "success";
      case "running":
        return "info";
      case "failed":
        return "danger";
      case "canceled":
        return "muted";
      default:
        return "warning";
    }
  }

  function severityLabel(severity) {
    switch (severity) {
      case "critical":
        return "严重";
      case "high":
        return "高";
      case "medium":
        return "中";
      default:
        return "低";
    }
  }

  function ensureSelection() {
    const scenes = state.data.script && state.data.script.scenes;
    const characters = state.data.characters;

    if (scenes && scenes.length > 0) {
      const existingSceneIds = new Set(scenes.map((scene) => scene.id));
      if (!state.ui.selectedSceneId || !existingSceneIds.has(state.ui.selectedSceneId)) {
        state.ui.selectedSceneId = scenes[0].id;
      }
    } else {
      state.ui.selectedSceneId = "";
    }

    if (characters && characters.length > 0) {
      const existingCharacterIds = new Set(characters.map((character) => character.id));
      if (!state.ui.selectedCharacterId || !existingCharacterIds.has(state.ui.selectedCharacterId)) {
        state.ui.selectedCharacterId = characters[0].id;
      }
    } else {
      state.ui.selectedCharacterId = "";
    }

    const currentStyle = state.data.script && state.data.script.style;
    if (currentStyle) {
      state.ui.pendingStyle = currentStyle;
    }
  }

  function getTask(type) {
    if (!state.data.tasks) return null;
    const task = state.data.tasks.find((task) => task.type === type);
    if (task) return task;
    
    // 如果没有找到任务，返回一个默认的空任务
    return {
      type: type,
      status: "pending",
      progress: 0,
      message: "等待开始创作，先上传或输入小说内容。",
      updated_at: state.data.project.created_at
    };
  }

  function updateTask(type, status, progress, message) {
    let task = state.data.tasks.find((t) => t.type === type);
    
    if (!task) {
      // 如果任务不存在，创建一个新任务
      task = {
        id: "task_" + Date.now(),
        type: type,
        status: status,
        progress: safeNumber(progress, 0),
        message: message,
        updated_at: dataApi.nowIso()
      };
      state.data.tasks.push(task);
    } else {
      // 如果任务存在，更新它
      task.status = status;
      task.progress = safeNumber(progress, 0);
      task.message = message;
      task.updated_at = dataApi.nowIso();
    }
  }

  function updateProjectTimestamp() {
    state.data.project.updated_at = dataApi.nowIso();
  }

  function pushToast(message) {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(16).slice(2, 8);
    state.ui.toasts.push({ id: id, message: message });

    window.setTimeout(() => {
      state.ui.toasts = state.ui.toasts.filter((toast) => toast.id !== id);
      renderToasts();
    }, 3200);

    renderToasts();
  }

  function addActivity(title, detail) {
    state.data.activity_log.unshift({
      id: "log_" + Date.now(),
      time: dataApi.nowIso(),
      title: title,
      detail: detail,
    });
    state.data.activity_log = state.data.activity_log.slice(0, 8);
  }

  function getCurrentTask() {
    if (state.data.tasks.length === 0) {
      return {
        type: "source_parse",
        status: "pending",
        progress: 0,
        message: "等待开始创作，先上传或输入小说内容。",
        updated_at: state.data.project.created_at
      };
    }

    const runningTask = state.data.tasks.find((task) => task.status === "running");
    if (runningTask) {
      return runningTask;
    }

    const pendingTask = state.data.tasks.find((task) => task.status === "pending");
    if (pendingTask) {
      return pendingTask;
    }

    return state.data.tasks
      .slice()
      .sort(function (a, b) {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })[0];
  }

  function getProjectProgress() {
    const completed = state.data.tasks.filter((task) => task.status === "succeeded").length;
    const total = state.data.tasks.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      completed: completed,
      total: total,
      percent: percent,
    };
  }

  function getActiveScene() {
    ensureSelection();
    const scene = state.data.script.scenes.find((scene) => scene.id === state.ui.selectedSceneId);
    if (scene) return scene;
    
    // 如果没有找到场景，返回一个默认的空对象
    return {
      id: "",
      index: 0,
      title: "未选择场次",
      location: "",
      time: "",
      synopsis: "",
      characters: [],
      beats: [],
      source_event_ids: []
    };
  }

  function getSelectedCharacter() {
    ensureSelection();
    const character = state.data.characters.find((character) => character.id === state.ui.selectedCharacterId);
    if (character) return character;
    
    // 如果没有找到人物，返回一个默认的空对象
    return {
      id: "",
      name: "未选择人物",
      identity: "",
      description: "",
      first_appearance: {
        chapter_id: "",
        excerpt: ""
      }
    };
  }

  function getEventById(eventId) {
    return state.data.story_graph.events.find((event) => event.id === eventId);
  }

  function getSceneById(sceneId) {
    return state.data.script.scenes.find((scene) => scene.id === sceneId);
  }

  function getCharacterName(characterId) {
    const character = state.data.characters.find((item) => item.id === characterId);
    return character ? character.name : "未匹配人物";
  }

  function getDurationSummary(shots) {
    return shots.reduce((sum, shot) => sum + Number(shot.duration_seconds || 0), 0);
  }

  function collectExportWarnings() {
    const warnings = [];

    if (state.data.meta.graph_stale) {
      warnings.push("图谱结果已过期，建议重新执行抽取后再导出。");
    }

    if (state.data.meta.review_stale) {
      warnings.push("剧本最近有修改，但审校结果尚未刷新。");
    }

    if (state.data.meta.quality_stale) {
      warnings.push("质量评分依赖旧版本剧本，建议重新计算。");
    }

    if (state.data.meta.storyboard_stale) {
      warnings.push("分镜脚本未同步最新剧本内容。");
    }

    if (state.data.source.parse_result && state.data.source.parse_result.parser_version === "browser-docx-placeholder") {
      warnings.push("当前 DOCX 章节为前端占位解析结果，后续需接入后端 Parser Service。");
    }

    return warnings;
  }

  function getExportSnapshot() {
    const model = yamlApi.buildExportModel(state.data);
    const validation = yamlApi.validateProjectModel(model);
    const warnings = collectExportWarnings();
    const yamlText = yamlApi.stringifyYaml(model, 0);

    return {
      model: model,
      validation: validation,
      warnings: warnings,
      yamlText: yamlText,
    };
  }

  function markGraphDirty(message) {
    state.data.meta.graph_stale = true;
    state.data.meta.review_stale = true;
    state.data.meta.quality_stale = true;
    state.data.meta.storyboard_stale = true;
    state.data.meta.export_stale = true;
    updateTask("graph_extract", "pending", 0, "等待重新抽取人物、关系与事件。");
    updateTask("script_generation", "pending", 0, "等待图谱更新后重新生成剧本。");
    updateTask("script_review", "pending", 0, "剧本未确认，审校结果待刷新。");
    updateTask("quality_scoring", "pending", 0, "等待新的审校结果。");
    updateTask("storyboard_generation", "pending", 0, "等待新的剧本版本。");
    updateTask("yaml_export", "pending", 0, "等待数据刷新后重新导出。");
    addActivity("源文件更新", message);
  }

  function markScriptDirty(message) {
    state.data.meta.review_stale = true;
    state.data.meta.quality_stale = true;
    state.data.meta.storyboard_stale = true;
    state.data.meta.export_stale = true;
    updateTask("script_review", "pending", 0, "剧本已更新，等待重新审校。");
    updateTask("quality_scoring", "pending", 0, "等待重新评分。");
    updateTask("storyboard_generation", "pending", 0, "等待根据最新剧本重生成分镜。");
    updateTask("yaml_export", "pending", 0, "导出内容依赖最新剧本，等待刷新。");
    addActivity("更新剧本", message);
  }

  function syncSceneIndices() {
    state.data.script.scenes.forEach((scene, index) => {
      scene.index = index + 1;
    });
  }

  function renderNavigation() {
    const navList = getCachedElement('navList');
    if (!navList) return;

    navList.innerHTML = sectionDefinitions
      .map((section) => {
        const active = state.ui.activeSection === section.key ? "active" : "";
        const index = sectionDefinitions.findIndex((item) => item.key === section.key);
        return (
          '<button class="nav-item ' +
          active +
          '" data-section="' +
          section.key +
          '" type="button">' +
          '<span class="nav-number">0' +
          (index + 1) +
          "</span>" +
          '<span class="nav-copy"><strong>' +
          section.label +
          "</strong><small>" +
          section.eyebrow +
          "</small></span>" +
          "</button>"
        );
      })
      .join("");
  }

  function renderSidebarProject() {
    const sidebar = getCachedElement('sidebarProject');
    if (!sidebar) return;

    const progress = getProjectProgress();
    const currentTask = getCurrentTask();

    sidebar.innerHTML =
      '<div class="project-card">' +
      '<p class="sidebar-label">当前项目</p>' +
      "<h2>" +
      escapeHtml(state.data.project.title) +
      "</h2>" +
      "<p>" +
      escapeHtml(state.data.project.description) +
      "</p>" +
      '<div class="project-meta-row">' +
      '<span class="status-pill ' +
      statusTone(currentTask.status) +
      '">' +
      statusLabel(currentTask.status) +
      "</span>" +
      '<span class="project-percent">' +
      progress.percent +
      "%</span>" +
      "</div>" +
      '<div class="progress-bar"><span style="width:' +
      progress.percent +
      '%;"></span></div>' +
      '<dl class="project-mini-stats">' +
      "<div><dt>任务完成</dt><dd>" +
      progress.completed +
      " / " +
      progress.total +
      "</dd></div>" +
      "<div><dt>当前风格</dt><dd>" +
      dataApi.styleLibrary[state.data.script.style].label +
      "</dd></div>" +
      "<div><dt>最近操作</dt><dd>" +
      formatDate(state.data.project.updated_at) +
      "</dd></div>" +
      "</dl>" +
      "</div>";
  }

  function renderHero() {
    const hero = getCachedElement('hero');
    if (!hero) return;

    const progress = getProjectProgress();
    const currentTask = getCurrentTask();
    const section = sectionDefinitions.find((item) => item.key === state.ui.activeSection);
    const exportSnapshot = getExportSnapshot();

    hero.innerHTML =
      '<div class="hero-copy">' +
      '<p class="hero-eyebrow">' +
      section.eyebrow +
      "</p>" +
      "<h2>" +
      section.label +
      "</h2>" +
      "<p>" +
      section.description +
      "</p>" +
      '<div class="hero-tags">' +
      '<span class="hero-tag">Schema ' +
      escapeHtml(state.data.schema_version) +
      "</span>" +
      '<span class="hero-tag">' +
      escapeHtml(dataApi.styleLibrary[state.ui.pendingStyle].label) +
      "工作流</span>" +
      '<span class="hero-tag">' +
      escapeHtml(state.data.project.status) +
      "</span>" +
      "</div>" +
      "</div>" +
      '<div class="hero-metrics">' +
      '<article class="hero-stat">' +
      "<span>总体进度</span>" +
      "<strong>" +
      progress.percent +
      "%</strong>" +
      "<small>" +
      progress.completed +
      " / " +
      progress.total +
      " 个任务完成</small>" +
      "</article>" +
      '<article class="hero-stat">' +
      "<span>当前任务</span>" +
      "<strong>" +
      escapeHtml(taskDefinitions[currentTask.type].label) +
      "</strong>" +
      "<small>" +
      escapeHtml(currentTask.message) +
      "</small>" +
      "</article>" +
      '<article class="hero-stat">' +
      "<span>导出状态</span>" +
      "<strong>" +
      (exportSnapshot.validation.valid ? "结构通过" : "待修正") +
      "</strong>" +
      "<small>错误 " +
      exportSnapshot.validation.errors.length +
      " / 警告 " +
      exportSnapshot.warnings.length +
      "</small>" +
      "</article>" +
      "</div>";
  }

  function renderWorkspaceSection() {
    const progress = getProjectProgress();
    const currentTask = getCurrentTask();

    const tasksContent = state.data.tasks.length === 0 
      ? '<div class="empty-state" style="padding: var(--gap-lg); text-align: center; color: var(--color-text-subtle);">' +
        '<p>暂无任务记录，先开始创作吧！</p>' +
        '</div>'
      : state.data.tasks
        .map((task) => {
          return (
            '<article class="task-row">' +
            '<div class="task-row-head"><strong>' +
            escapeHtml(taskDefinitions[task.type].label) +
            "</strong>" +
            '<span class="status-pill ' +
            statusTone(task.status) +
            '">' +
            statusLabel(task.status) +
            "</span></div>" +
            "<p>" +
            escapeHtml(task.message) +
            "</p>" +
            '<div class="progress-bar compact"><span style="width:' +
            Math.max(task.progress || 0, 4) +
            '%;"></span></div>' +
            '<small>最近更新：' +
            formatDate(task.updated_at) +
            "</small>" +
            "</article>"
          );
        })
        .join("");

    const activityContent = state.data.activity_log.length === 0
      ? '<div class="empty-state" style="padding: var(--gap-lg); text-align: center; color: var(--color-text-subtle);">' +
        '<p>暂无操作记录</p>' +
        '</div>'
      : state.data.activity_log
        .map((item) => {
          return (
            '<article class="activity-item">' +
            '<span class="activity-time">' +
            formatDate(item.time) +
            "</span>" +
            "<strong>" +
            escapeHtml(item.title) +
            "</strong>" +
            "<p>" +
            escapeHtml(item.detail) +
            "</p>" +
            "</article>"
          );
        })
        .join("");

    return (
      '<div class="workspace-grid">' +
      '<section class="metrics-grid">' +
      renderMetricCard("章节", state.data.source.chapters.length, "TXT / DOCX 章节结果") +
      renderMetricCard("人物", state.data.characters.length, "图谱可用角色节点") +
      renderMetricCard("场次", state.data.script.scenes.length, "当前剧本版本") +
      renderMetricCard("镜头", state.data.storyboard.shots.length, "分镜脚本条目") +
      renderMetricCard("质量分", state.data.quality.total_score || "--", "基于最新评分维度") +
      renderMetricCard("已导出", progress.completed + " / " + progress.total, "工作流闭环覆盖") +
      "</section>" +
      '<section class="panel workspace-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">核心功能</p><h3>阶段工作流</h3></div>' +
      '<button class="ghost-button" data-nav="upload" type="button">进入上传</button></div>' +
      '<div class="workflow-track">' +
      renderWorkflowStep("1", "小说上传与解析", getTask("source_parse"), "TXT / DOCX -> 章节拆分") +
      renderWorkflowStep("2", "人物关系与故事图谱", getTask("graph_extract"), "人物 / 关系 / 事件 / 时间线") +
      renderWorkflowStep("3", "多风格剧本改编", getTask("script_generation"), "电影 / 电视剧 / 短剧 / 动漫") +
      renderWorkflowStep("4", "AI 审校与质量评估", getTask("script_review"), "问题定位 + 评分解释") +
      renderWorkflowStep("5", "分镜与 YAML 导出", getTask("storyboard_generation"), "镜头设计 + 结构化导出") +
      "</div>" +
      "</section>" +
      '<section class="panel task-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">Task Service</p><h3>任务状态</h3></div>' +
      '<span class="status-pill ' +
      statusTone(currentTask.status) +
      '">' +
      statusLabel(currentTask.status) +
      "</span></div>" +
      tasksContent +
      "</section>" +
      '<section class="panel feature-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">Frontend Frame</p><h3>当前前端框架</h3></div>' +
      '<button class="ghost-button" data-nav="script" type="button">编辑剧本</button></div>' +
      '<ul class="feature-list">' +
      "<li>已覆盖 README 中的 9 项核心能力展示路径，而不只是单纯页面占位。</li>" +
      "<li>当前支持小说上传解析、人物关系图谱、故事图谱、剧本改编、审校评分、分镜与导出联动。</li>" +
      "<li>人机协同创作通过在线编辑场次、动作、对白及顺序调整进行前端模拟。</li>" +
      "<li>YAML 预览遵守 Schema 1.0，并带结构校验和 stale 警告。</li>" +
      "</ul>" +
      "</section>" +
      '<section class="panel activity-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">Activity Log</p><h3>最近操作</h3></div>' +
      '<button class="ghost-button" data-nav="export" type="button">查看导出</button></div>' +
      '<div class="activity-feed">' +
      activityContent +
      "</div></section>" +
      "</div>"
    );
  }

  function renderMetricCard(label, value, detail) {
    return (
      '<article class="metric-card">' +
      "<span>" +
      label +
      "</span>" +
      "<strong>" +
      value +
      "</strong>" +
      "<small>" +
      detail +
      "</small>" +
      "</article>"
    );
  }

  function renderWorkflowStep(order, title, task, detail) {
    return (
      '<article class="workflow-step ' +
      statusTone(task.status) +
      '">' +
      '<div class="workflow-step-top"><span>' +
      order +
      "</span>" +
      '<em class="' +
      statusTone(task.status) +
      '">' +
      statusLabel(task.status) +
      "</em></div>" +
      "<h4>" +
      title +
      "</h4>" +
      "<p>" +
      detail +
      "</p>" +
      "<small>" +
      escapeHtml(task.message) +
      "</small>" +
      "</article>"
    );
  }

  function renderUploadSection() {
    const documentMeta = state.data.source.document;
    const parseMeta = state.data.source.parse_result;
    const hasChapters = state.data.source.chapters && state.data.source.chapters.length > 0;

    // 解析概况内容
    const metaContent = !parseMeta 
      ? '<div class="empty-state" style="padding: var(--gap-lg); text-align: center; color: var(--color-text-subtle);">' +
        '<p>暂无解析结果</p>' +
        '<p style="font-size: 0.9rem; margin-top: 0.5rem;">输入小说内容后点击"开始解析"</p>' +
        '</div>'
      : '<dl class="meta-list">' +
        "<div><dt>章节数</dt><dd>" +
        formatNumber(parseMeta.chapter_count) +
        "</dd></div>" +
        "<div><dt>总字数</dt><dd>" +
        formatNumber(parseMeta.total_characters) +
        "</dd></div>" +
        "<div><dt>最后更新</dt><dd>" +
        formatDate(getTask("source_parse").updated_at) +
        "</dd></div>" +
        "</dl>" +
        '<article class="task-inline">' +
        "<strong>" +
        escapeHtml(getTask("source_parse").message) +
        "</strong>" +
        '<div class="progress-bar compact"><span style="width:' +
        Math.max(getTask("source_parse").progress, 5) +
        '%;"></span></div>' +
        "<small>解析时间：" +
        formatDate(getTask("source_parse").updated_at) +
        "</small>" +
        "</article>";

    // 章节预览内容
    const chaptersContent = !hasChapters
      ? '<div class="empty-state" style="padding: var(--gap-lg); text-align: center; color: var(--color-text-subtle);">' +
        '<p>暂无章节预览</p>' +
        '<p style="font-size: 0.9rem; margin-top: 0.5rem;">解析完成后会在这里显示章节</p>' +
        '</div>'
      : '<div class="chapter-grid">' +
        state.data.source.chapters
          .map((chapter) => {
            return (
              '<article class="chapter-card">' +
              "<span>Chapter " +
              chapter.index +
              "</span>" +
              "<h4>" +
              escapeHtml(chapter.title) +
              "</h4>" +
              "<p>" +
              escapeHtml(chapter.summary || "暂无摘要。") +
              "</p>" +
              "<small>" +
              formatNumber(chapter.word_count) +
              " 字</small>" +
              "</article>"
            );
          })
          .join("") +
        "</div>";

    return (
      '<div class="upload-grid">' +
      '<section class="panel upload-panel">' +
      '<div class="panel-head">' +
      '<div><p class="panel-kicker">小说输入</p><h3>原始小说</h3></div>' +
      '<div class="panel-actions">' +
      '<button class="ghost-button" data-action="load-sample" type="button">载入示例</button>' +
      '<button class="primary-button" data-action="parse-text" type="button">开始解析</button>' +
      '</div>' +
      '</div>' +
      
      '<div class="text-input-section">' +
      '<div class="input-row">' +
      '<div class="input-group">' +
      '<label>标题</label>' +
      '<input type="text" id="novelTitle" placeholder="请输入小说标题" value="' + escapeHtml(state.data.project.title) + '" />' +
      '</div>' +
      '<div class="input-group">' +
      '<label>作者</label>' +
      '<input type="text" id="novelAuthor" placeholder="请输入作者名" />' +
      '</div>' +
      '</div>' +
      '<div class="input-group">' +
      '<label>类型</label>' +
      '<select id="novelGenre">' +
      '<option value="Drama">Drama</option>' +
      '<option value="Action">Action</option>' +
      '<option value="Romance">Romance</option>' +
      '<option value="Comedy">Comedy</option>' +
      '<option value="Thriller">Thriller</option>' +
      '<option value="Fantasy">Fantasy</option>' +
      '<option value="Sci-Fi">Sci-Fi</option>' +
      '<option value="Horror">Horror</option>' +
      '</select>' +
      '</div>' +
      '<div class="input-group">' +
      '<div class="input-label-row">' +
      '<label>小说正文（≥ 3 章，建议以 "第X章" 或 "Chapter X" 分隔）</label>' +
      '<span class="word-count" id="wordCount">0 字</span>' +
      '</div>' +
      '<textarea id="novelText" placeholder="请输入或粘贴小说内容..." rows="15"></textarea>' +
      '</div>' +
      '</div>' +
      
      '<div class="upload-zone" id="uploadZone">' +
      '<input class="visually-hidden" id="fileInput" type="file" accept=".txt,.docx" />' +
      '<div class="upload-ornament">📄</div>' +
      "<h4>或拖入文件上传</h4>" +
      "<p>TXT 文件会自动拆分章节，DOCX 文件将做预处理。</p>" +
      "</div>" +
      
      '</section>' +
      
      '<section class="panel upload-meta-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">解析概况</p><h3>解析结果</h3></div>' +
      '<span class="status-pill ' +
      statusTone(getTask("source_parse").status) +
      '">' +
      statusLabel(getTask("source_parse").status) +
      "</span></div>" +
      metaContent +
      "</section>" +
      
      '<section class="panel chapters-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">章节列表</p><h3>章节预览</h3></div>' +
      '<button class="ghost-button" data-nav="graph" type="button">生成图谱</button></div>' +
      chaptersContent +
      "</section>" +
      "</div>"
    );
  }

  function renderGraphSection() {
    const selectedCharacter = getSelectedCharacter();
    const layout = state.data.meta.layout || {};
    const selectedRelationships = state.data.relationships.filter(
      (relationship) =>
        relationship.from_character_id === selectedCharacter.id ||
        relationship.to_character_id === selectedCharacter.id,
    );
    const hasCharacters = state.data.characters && state.data.characters.length > 0;

    // 图谱区域内容
    const graphContent = !hasCharacters
      ? '<div class="empty-state" style="padding: var(--gap-xl); text-align: center; color: var(--color-text-subtle);">' +
        '<div style="font-size: 3rem; margin-bottom: 1rem;">🧩</div>' +
        '<p>暂无人际关系图谱</p>' +
        '<p style="font-size: 0.9rem; margin-top: 0.5rem;">解析小说后会自动抽取出人物关系</p>' +
        '</div>'
      : '<div class="graph-stage">' +
        '<svg class="graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none">' +
        state.data.relationships
          .map((relationship) => {
            const from = layout[relationship.from_character_id];
            const to = layout[relationship.to_character_id];
            if (!from || !to) {
              return "";
            }

            return (
              '<line x1="' +
              from.x +
              '" y1="' +
              from.y +
              '" x2="' +
              to.x +
              '" y2="' +
              to.y +
              '"></line>'
            );
          })
          .join("") +
        "</svg>" +
        state.data.characters
          .map((character) => {
            const point = layout[character.id] || { x: 50, y: 50 };
            return (
              '<button class="graph-node ' +
              (character.id === selectedCharacter.id ? "selected" : "") +
              '" style="left:' +
              point.x +
              "%; top:" +
              point.y +
              '%;" data-character-id="' +
              character.id +
              '" type="button">' +
              "<strong>" +
              escapeHtml(character.name) +
              "</strong>" +
              "<small>" +
              escapeHtml(character.identity || "未标注身份") +
              "</small>" +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        '<div class="inline-note">' +
        "<strong>当前模式：</strong>" +
        escapeHtml(state.data.meta.graph_mode === "demo" ? "演示数据" : "前端模拟抽取") +
        (state.data.meta.graph_stale ? " · 结果待刷新" : " · 结果已同步") +
        "</div>";

    // 人物详情内容
    const characterDetailContent = !hasCharacters
      ? '<div class="empty-state" style="padding: var(--gap-lg); text-align: center; color: var(--color-text-subtle);">' +
        '<p>暂无角色信息</p>' +
        '</div>'
      : '<article class="panel character-panel">' +
        '<div class="panel-head"><div><p class="panel-kicker">人物关系图谱</p><h3>' +
        escapeHtml(selectedCharacter.name) +
        "</h3></div>" +
        '<span class="status-pill info">' +
        escapeHtml(selectedCharacter.identity || "未标注身份") +
        "</span></div>" +
        "<p>" +
        escapeHtml(selectedCharacter.description || "暂无简介。") +
        "</p>" +
        '<dl class="meta-list compact">' +
        "<div><dt>首次出现</dt><dd>" +
        escapeHtml(selectedCharacter.first_appearance.chapter_id) +
        "</dd></div>" +
        "<div><dt>原文证据</dt><dd>" +
        escapeHtml(selectedCharacter.first_appearance.excerpt) +
        "</dd></div>" +
        "</dl>" +
        '<div class="relation-stack">' +
        selectedRelationships
          .map((relationship) => {
            const targetId =
              relationship.from_character_id === selectedCharacter.id
                ? relationship.to_character_id
                : relationship.from_character_id;
            return (
              '<article class="relation-chip">' +
              "<strong>" +
            escapeHtml(relationship.label) +
            "</strong>" +
            "<span>" +
            escapeHtml(getCharacterName(targetId)) +
            " · " +
            escapeHtml(relationship.description || "") +
            "</span>" +
            "</article>"
          );
        })
        .join("") +
      "</div></article>";

    // 时间线内容
    const hasEvents = state.data.story_graph && state.data.story_graph.events && state.data.story_graph.events.length > 0;
    const timelineContent = !hasEvents
      ? '<article class="panel timeline-panel">' +
        '<div class="panel-head"><div><p class="panel-kicker">故事图谱</p><h3>事件时间线</h3></div>' +
        '<span class="status-pill ' +
        (state.data.meta.graph_stale ? "warning" : "success") +
        '">' +
        (state.data.meta.graph_stale ? "待刷新" : "已同步") +
        "</span></div>" +
        '<div class="empty-state" style="padding: var(--gap-lg); text-align: center; color: var(--color-text-subtle);">' +
        '<p>暂无事件时间线</p>' +
        '</div></article>'
      : '<article class="panel timeline-panel">' +
        '<div class="panel-head"><div><p class="panel-kicker">故事图谱</p><h3>事件时间线</h3></div>' +
        '<span class="status-pill ' +
        (state.data.meta.graph_stale ? "warning" : "success") +
        '">' +
        (state.data.meta.graph_stale ? "待刷新" : "已同步") +
        "</span></div>" +
        '<div class="timeline-list">' +
        state.data.story_graph.events
          .slice()
          .sort((a, b) => a.timeline_order - b.timeline_order)
          .map((event) => {
            return (
              '<article class="timeline-item">' +
              "<span>0" +
              event.timeline_order +
              "</span>" +
              "<div><strong>" +
              escapeHtml(event.title) +
              "</strong>" +
              "<p>" +
              escapeHtml(event.summary) +
              "</p>" +
              "<small>" +
              escapeHtml(getCharacterName(event.participants[0])) +
              " · " +
              escapeHtml(event.time_label || "未标注时间") +
              "</small></div></article>"
            );
          })
          .join("") +
        "</div></article>";

    return (
      '<div class="graph-layout">' +
      '<section class="panel graph-stage-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">Graph View</p><h3>人物关系图谱与故事图谱</h3></div>' +
      '<div class="toolbar-inline">' +
      '<button class="secondary-button" data-action="run-extraction" type="button">重新抽取</button>' +
      '<button class="ghost-button" data-nav="script" type="button">去生成剧本</button>' +
      "</div></div>" +
      graphContent +
      "</section>" +
      '<section class="graph-side-column">' +
      characterDetailContent +
      timelineContent +
      "</section></div>"
    );
  }

  function renderScriptSection() {
    const hasScenes = state.data.script.scenes && state.data.script.scenes.length > 0;
    
    if (!hasScenes) {
      return '<div class="empty-state" style="padding: var(--gap-xl); text-align: center; color: var(--color-text-subtle);">' +
        '<div style="font-size: 3rem; margin-bottom: 1rem;">🎬</div>' +
        '<p>暂无场次</p>' +
        '<p style="font-size: 0.9rem; margin-top: 0.5rem;">解析小说后会自动生成，或手动添加场次</p>' +
        '</div>';
    }
    
    const scene = getActiveScene();
    const sourceEvents = (scene.source_event_ids || []).map(getEventById).filter(Boolean);

    return (
      '<div class="script-layout">' +
      '<section class="panel script-toolbar-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">多风格剧本改编</p><h3>剧本改编与人机协同创作</h3></div>' +
      '<div class="toolbar-inline">' +
      '<button class="secondary-button" data-action="generate-script" type="button">基于图谱生成</button>' +
      '<button class="ghost-button" data-nav="review" type="button">查看审校</button>' +
      "</div></div>" +
      '<div class="script-toolbar">' +
      '<label><span>剧本风格</span><select id="styleSelect">' +
      Object.keys(dataApi.styleLibrary)
        .map((styleKey) => {
          return (
            '<option value="' +
            styleKey +
            '"' +
            (state.ui.pendingStyle === styleKey ? " selected" : "") +
            ">" +
            escapeHtml(dataApi.styleLibrary[styleKey].label) +
            "</option>"
          );
        })
        .join("") +
      "</select></label>" +
      '<button class="secondary-button" data-action="add-scene" type="button">新增场次</button>' +
      '<button class="secondary-button" data-action="move-scene-up" type="button">上移</button>' +
      '<button class="secondary-button" data-action="move-scene-down" type="button">下移</button>' +
      '<button class="secondary-button" data-action="delete-scene" type="button">删除</button>' +
      '<button class="primary-button" data-action="save-scene" type="button">保存当前场次</button>' +
      "</div>" +
      '<div class="inline-note">' +
      "<strong>当前版本：</strong>" +
      escapeHtml(state.data.script.version) +
      " · " +
      escapeHtml(dataApi.styleLibrary[state.data.script.style].description) +
      "</div></section>" +
      '<section class="scene-rail">' +
      state.data.script.scenes
        .map((item) => {
          return (
            '<button class="scene-chip ' +
            (item.id === scene.id ? "selected" : "") +
            '" data-scene-id="' +
            item.id +
            '" type="button">' +
            "<span>Scene " +
            item.index +
            "</span>" +
            "<strong>" +
            escapeHtml(item.title) +
            "</strong>" +
            "<small>" +
            escapeHtml(item.location) +
            " · " +
            escapeHtml(item.time) +
            "</small>" +
            "</button>"
          );
        })
        .join("") +
      "</section>" +
      '<section class="panel editor-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">Scene Editor</p><h3>' +
      escapeHtml(scene.title) +
      "</h3></div>" +
      '<span class="status-pill ' +
      (state.data.meta.review_stale ? "warning" : "success") +
      '">' +
      (state.data.meta.review_stale ? "待重审" : "已审校") +
      "</span></div>" +
      '<div class="editor-grid">' +
      renderFormField("场次标题", "sceneTitleInput", scene.title) +
      renderFormField("场景地点", "sceneLocationInput", scene.location) +
      renderFormField("场景时间", "sceneTimeInput", scene.time) +
      renderTextareaField("场次摘要", "sceneSynopsisInput", scene.synopsis) +
      "</div>" +
      '<div class="cast-row"><span>出场人物</span>' +
      scene.characters
        .map(function (characterId) {
          return '<em>' + escapeHtml(getCharacterName(characterId)) + "</em>";
        })
        .join("") +
      "</div>" +
      '<div class="beat-editor" id="beatEditor">' +
      scene.beats.map(function (beat) {
        return renderBeatEditorRow(beat);
      }).join("") +
      "</div>" +
      '<div class="editor-actions">' +
      '<button class="secondary-button" data-action="add-beat" type="button">新增片段</button>' +
      '<button class="secondary-button" data-action="run-review" type="button">运行审校</button>' +
      '<button class="secondary-button" data-action="generate-storyboard" type="button">生成分镜</button>' +
      "</div>" +
      '<article class="source-card">' +
      "<strong>当前场次来源</strong>" +
      (sourceEvents.length
        ? sourceEvents
            .map(function (event) {
              return (
                '<p><span>' +
                escapeHtml(event.title) +
                "</span>" +
                escapeHtml(event.summary) +
                "</p>"
              );
            })
            .join("")
        : "<p>当前场次尚未绑定 story_graph 事件。</p>") +
      "</article></section></div>"
    );
  }

  function renderFormField(label, id, value) {
    return (
      '<label class="field">' +
      "<span>" +
      label +
      "</span>" +
      '<input id="' +
      id +
      '" type="text" value="' +
      escapeHtml(value || "") +
      '" />' +
      "</label>"
    );
  }

  function renderTextareaField(label, id, value) {
    return (
      '<label class="field full">' +
      "<span>" +
      label +
      "</span>" +
      '<textarea id="' +
      id +
      '" rows="3">' +
      escapeHtml(value || "") +
      "</textarea>" +
      "</label>"
    );
  }

  function renderBeatEditorRow(beat) {
    return (
      '<article class="beat-row" data-beat-row>' +
      '<label><span>类型</span><select data-role="beat-type">' +
      Object.keys(beatTypeLabels)
        .map(function (type) {
          return (
            '<option value="' +
            type +
            '"' +
            (beat.type === type ? " selected" : "") +
            ">" +
            beatTypeLabels[type] +
            "</option>"
          );
        })
        .join("") +
      "</select></label>" +
      '<label><span>角色</span><input data-role="beat-speaker" type="text" value="' +
      escapeHtml(beat.character_name || "") +
      '" placeholder="对白角色，可留空" /></label>' +
      '<label class="beat-content"><span>内容</span><textarea data-role="beat-content" rows="2">' +
      escapeHtml(beat.content || "") +
      "</textarea></label>" +
      '<button class="icon-button" data-action="remove-beat" type="button">移除</button>' +
      "</article>"
    );
  }

  function renderReviewSection() {
    const hasIssues = state.data.review.issues && state.data.review.issues.length > 0;
    const hasDimensions = state.data.quality.dimensions && state.data.quality.dimensions.length > 0;
    
    if (!hasIssues && !hasDimensions) {
      return '<div class="empty-state" style="padding: var(--gap-xl); text-align: center; color: var(--color-text-subtle);">' +
        '<div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>' +
        '<p>暂无审校结果</p>' +
        '<p style="font-size: 0.9rem; margin-top: 0.5rem;">先生成剧本，然后运行审校</p>' +
        '</div>';
    }
    
    const issues = state.data.review.issues || [];

    return (
      '<div class="review-layout">' +
      '<section class="review-main-column">' +
      '<article class="score-hero">' +
      "<span>总分</span>" +
      "<strong>" +
      (state.data.quality.total_score || "--") +
      "</strong>" +
      "<p>结合审校问题与结构完整性得到的当前版本评分。</p>" +
      '<div class="toolbar-inline">' +
      '<button class="secondary-button" data-action="run-review" type="button">重新审校</button>' +
      '<button class="primary-button" data-action="run-quality" type="button">刷新评分</button>' +
      "</div></article>" +
      '<section class="panel dimensions-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">剧本质量评估</p><h3>维度评分</h3></div>' +
      '<span class="status-pill ' +
      (state.data.meta.quality_stale ? "warning" : "success") +
      '">' +
      (state.data.meta.quality_stale ? "待刷新" : "已同步") +
      "</span></div>" +
      '<div class="dimension-list">' +
      state.data.quality.dimensions
        .map(function (dimension) {
          return (
            '<article class="dimension-row">' +
            '<div class="dimension-head"><strong>' +
            escapeHtml(dimension.name) +
            "</strong><span>" +
            dimension.score +
            "</span></div>" +
            '<div class="progress-bar compact"><span style="width:' +
            dimension.score +
            '%;"></span></div>' +
            "<p>" +
            escapeHtml(dimension.comment) +
            "</p></article>"
          );
        })
        .join("") +
      "</div></section></section>" +
      '<section class="panel review-issues-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">AI 剧本审校</p><h3>审校问题</h3></div>' +
      '<span class="status-pill ' +
      (state.data.meta.review_stale ? "warning" : "success") +
      '">' +
      (state.data.meta.review_stale ? "待刷新" : "已同步") +
      "</span></div>" +
      '<div class="issue-stack">' +
      (issues.length
        ? issues
            .map(function (issue) {
              const scene = issue.scene_id ? getSceneById(issue.scene_id) : null;
              return (
                '<article class="issue-card">' +
                '<div class="issue-head"><span class="severity-pill ' +
                issue.severity +
                '">' +
                severityLabel(issue.severity) +
                "</span>" +
                "<strong>" +
                escapeHtml(issue.type) +
                "</strong></div>" +
                "<p>" +
                escapeHtml(issue.message) +
                "</p>" +
                '<small>' +
                (scene ? escapeHtml(scene.title) : "未定位场次") +
                (issue.beat_index ? " · beat " + issue.beat_index : "") +
                "</small>" +
                '<div class="issue-suggestion">' +
                escapeHtml(issue.suggestion) +
                "</div></article>"
              );
            })
            .join("")
        : '<div class="empty-state"><strong>暂无审校问题</strong><p>当前剧本通过了这组前端启发式检查。</p></div>') +
      "</div></section></div>"
    );
  }

  function renderStoryboardSection() {
    const hasShots = state.data.storyboard.shots && state.data.storyboard.shots.length > 0;
    
    if (!hasShots) {
      return '<div class="empty-state" style="padding: var(--gap-xl); text-align: center; color: var(--color-text-subtle);">' +
        '<div style="font-size: 3rem; margin-bottom: 1rem;">🎞️</div>' +
        '<p>暂无分镜</p>' +
        '<p style="font-size: 0.9rem; margin-top: 0.5rem;">先生成剧本，然后生成分镜</p>' +
        '</div>';
    }
    
    const filterSceneId = state.ui.storyboardFilter;
    const filteredShots =
      filterSceneId === "all"
        ? state.data.storyboard.shots
        : state.data.storyboard.shots.filter((shot) => shot.scene_id === filterSceneId);

    return (
      '<div class="storyboard-layout">' +
      '<section class="panel storyboard-top-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">分镜脚本生成</p><h3>镜头设计</h3></div>' +
      '<button class="primary-button" data-action="generate-storyboard" type="button">重新生成分镜</button></div>' +
      '<div class="storyboard-overview">' +
      renderMetricCard("镜头总数", state.data.storyboard.shots.length, "覆盖全部场次") +
      renderMetricCard("总时长", getDurationSummary(state.data.storyboard.shots) + "s", "粗略镜头时长") +
      renderMetricCard("覆盖场次", new Set(state.data.storyboard.shots.map((shot) => shot.scene_id)).size, "已映射 scene_id") +
      "</div>" +
      '<div class="filter-row">' +
      '<button class="filter-chip ' +
      (filterSceneId === "all" ? "selected" : "") +
      '" data-storyboard-scene="all" type="button">全部场次</button>' +
      state.data.script.scenes
        .map(function (scene) {
          return (
            '<button class="filter-chip ' +
            (filterSceneId === scene.id ? "selected" : "") +
            '" data-storyboard-scene="' +
            scene.id +
            '" type="button">' +
            escapeHtml(scene.title) +
            "</button>"
          );
        })
        .join("") +
      "</div></section>" +
      '<section class="shot-grid">' +
      filteredShots
        .map(function (shot) {
          const scene = getSceneById(shot.scene_id);
          return (
            '<article class="shot-card">' +
            "<span>" +
            escapeHtml(scene ? scene.title : shot.scene_id) +
            " · 镜头 " +
            shot.index +
            "</span>" +
            "<h4>" +
            escapeHtml(shot.image_description) +
            "</h4>" +
            '<dl class="shot-meta">' +
            "<div><dt>景别</dt><dd>" +
            escapeHtml(shotSizeLabels[shot.shot_size] || shot.shot_size) +
            "</dd></div>" +
            "<div><dt>运镜</dt><dd>" +
            escapeHtml(cameraLabels[shot.camera_movement] || shot.camera_movement) +
            "</dd></div>" +
            "<div><dt>时长</dt><dd>" +
            shot.duration_seconds +
            " 秒</dd></div>" +
            "</dl>" +
            "<p>" +
            escapeHtml(shot.lighting || "暂无光线建议。") +
            "</p>" +
            '<small>' +
            escapeHtml(shot.audio || "暂无声音建议。") +
            "</small></article>"
          );
        })
        .join("") +
      "</section></div>"
    );
  }

  function renderExportSection() {
    const exportSnapshot = getExportSnapshot();

    return (
      '<div class="export-layout">' +
      '<section class="export-sidebar-column">' +
      '<article class="panel export-summary-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">导出 YAML 格式剧本</p><h3>导出检查</h3></div>' +
      '<span class="status-pill ' +
      (exportSnapshot.validation.valid ? "success" : "danger") +
      '">' +
      (exportSnapshot.validation.valid ? "结构通过" : "存在错误") +
      "</span></div>" +
      '<div class="export-summary-grid">' +
      renderMetricCard("Schema", escapeHtml(state.data.schema_version), "当前结构版本") +
      renderMetricCard("错误", exportSnapshot.validation.errors.length, "阻断导出的问题") +
      renderMetricCard("警告", exportSnapshot.warnings.length, "建议先刷新的内容") +
      renderMetricCard("最近导出", formatDate(state.data.export.exported_at), "记录于 export.exported_at") +
      "</div>" +
      '<div class="toolbar-inline">' +
      '<button class="secondary-button" data-action="refresh-export" type="button">刷新校验</button>' +
      '<button class="primary-button" data-action="download-yaml" type="button">下载 YAML</button>' +
      "</div></article>" +
      '<article class="panel export-checklist-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">Schema Fields</p><h3>结构清单</h3></div>' +
      '<button class="ghost-button" data-nav="workspace" type="button">回到工作台</button></div>' +
      '<ul class="check-list">' +
      Object.keys(exportSnapshot.model)
        .map(function (key) {
          return (
            "<li><strong>" +
            key +
            "</strong><span>" +
            (exportSnapshot.model[key] ? "已生成" : "缺失") +
            "</span></li>"
          );
        })
        .join("") +
      "</ul></article>" +
      '<article class="panel export-issues-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">Validation Output</p><h3>错误与警告</h3></div></div>' +
      '<div class="issue-stack compact">' +
      (exportSnapshot.validation.errors.length
        ? exportSnapshot.validation.errors
            .map(function (message) {
              return '<article class="issue-card danger"><p>' + escapeHtml(message) + "</p></article>";
            })
            .join("")
        : '<article class="issue-card success"><p>当前结构没有阻断性错误。</p></article>') +
      exportSnapshot.warnings
        .map(function (message) {
          return '<article class="issue-card warning"><p>' + escapeHtml(message) + "</p></article>";
        })
        .join("") +
      "</div></article></section>" +
      '<section class="panel yaml-panel">' +
      '<div class="panel-head"><div><p class="panel-kicker">YAML Preview</p><h3>YAML 结构预览</h3></div>' +
      '<span class="status-pill info">schema_version 1.0</span></div>' +
      '<pre class="yaml-preview"><code>' +
      escapeHtml(exportSnapshot.yamlText) +
      "</code></pre></section></div>"
    );
  }

  function bindSectionEvents() {}

  function renderSectionBody() {
    const container = getCachedElement('sectionBody');
    if (!container) return;

    const renderers = {
      workspace: renderWorkspaceSection,
      upload: renderUploadSection,
      graph: renderGraphSection,
      script: renderScriptSection,
      review: renderReviewSection,
      storyboard: renderStoryboardSection,
      export: renderExportSection,
    };

    const renderer = renderers[state.ui.activeSection] || renderWorkspaceSection;
    container.innerHTML = renderer();
    bindSectionEvents();
    
    // 如果是 upload 页面，更新字数统计
    if (state.ui.activeSection === "upload") {
      updateWordCount();
    }
  }

  function renderToasts() {
    const toastStack = getCachedElement('toastStack');
    if (!toastStack) return;

    toastStack.innerHTML = state.ui.toasts
      .map(function (toast) {
        return '<div class="toast">' + escapeHtml(toast.message) + "</div>";
      })
      .join("");
  }

  function enterApp() {
    console.log("enterApp called!");
    state.hasEntered = true;
    state.ui.activeSection = "upload"; // 直接进入 upload 页面
    console.log("State updated, calling renderApp...");
    renderApp();
    console.log("renderApp completed!");
  }

  function renderApp() {
    console.log("renderApp called! state.hasEntered =", state.hasEntered);
    const welcomePage = document.getElementById("welcomePage");
    const appShell = document.getElementById("appShell");
    console.log("welcomePage:", welcomePage);
    console.log("appShell:", appShell);

    if (state.hasEntered) {
      console.log("Entering app mode...");
      welcomePage.style.display = "none";
      appShell.style.display = "grid";
      ensureSelection();
      renderNavigation();
      renderSidebarProject();
      renderHero();
      renderSectionBody();
      renderToasts();
    } else {
      console.log("Showing welcome page...");
      welcomePage.style.display = "flex";
      appShell.style.display = "none";
    }
  }

  function chooseFileInput() {
    const fileInput = document.querySelector("#fileInput");
    if (fileInput) {
      fileInput.click();
    }
  }

  function createSummaryFromText(text) {
    const compact = String(text || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!compact) {
      return "暂无摘要。";
    }

    return compact.length > 54 ? compact.slice(0, 54) + "..." : compact;
  }

  function buildChaptersFromText(text) {
    const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
    if (!normalized) {
      return [
        {
          id: "chapter_001",
          index: 1,
          title: "第一章 自动生成预览",
          summary: "源文件为空或不可读取，当前仅保留占位章节。",
          word_count: 0,
        },
      ];
    }

    const lines = normalized.split("\n");
    const chapterPattern = /^\s*(第[一二三四五六七八九十百千万0-9]+[章节回幕]|chapter\s+\d+)/i;
    const buckets = [];
    let current = null;

    lines.forEach(function (line) {
      if (chapterPattern.test(line.trim())) {
        if (current) {
          buckets.push(current);
        }

        current = {
          title: line.trim(),
          content: [],
        };
        return;
      }

      if (!current) {
        current = {
          title: "第一章 自动识别章节",
          content: [],
        };
      }

      current.content.push(line.trim());
    });

    if (current) {
      buckets.push(current);
    }

    const chapters = buckets
      .filter(function (bucket) {
        return bucket.title || bucket.content.join("").trim();
      })
      .map(function (bucket, index) {
        const contentText = bucket.content.join(" ").replace(/\s+/g, " ").trim();
        return {
          id: "chapter_" + String(index + 1).padStart(3, "0"),
          index: index + 1,
          title: bucket.title || "第 " + (index + 1) + " 章",
          summary: createSummaryFromText(contentText),
          word_count: contentText.length,
        };
      });

    return chapters.length ? chapters : [{ id: "chapter_001", index: 1, title: "第一章 自动识别章节", summary: createSummaryFromText(normalized), word_count: normalized.length }];
  }

  function createPlaceholderChapters(fileName) {
    const base = fileName.replace(/\.[^.]+$/, "");
    return [
      {
        id: "chapter_001",
        index: 1,
        title: "第一章 " + base + " · 开场",
        summary: "DOCX 文件已接收，当前前端仅生成占位章节供流程演示。",
        word_count: 2600,
      },
      {
        id: "chapter_002",
        index: 2,
        title: "第二章 核心冲突",
        summary: "等待后端 Parser Service 与 Extraction Service 接入后替换真实章节。",
        word_count: 2400,
      },
      {
        id: "chapter_003",
        index: 3,
        title: "第三章 转折信息",
        summary: "保留上传成功、章节列表和下游 stale 流程，方便先做前端联调。",
        word_count: 2300,
      },
    ];
  }

  function applyUploadedSource(file, chapters, parserVersion) {
    state.data.source.document.filename = file.name;
    state.data.source.document.file_type = file.name.split(".").pop().toLowerCase();
    state.data.source.document.checksum = "browser:" + file.size + ":" + file.lastModified;
    state.data.source.parse_result.chapter_count = chapters.length;
    state.data.source.parse_result.total_characters = chapters.reduce(function (sum, chapter) {
      return sum + Number(chapter.word_count || 0);
    }, 0);
    state.data.source.parse_result.parser_version = parserVersion;
    state.data.source.chapters = chapters;
    state.data.project.title = file.name.replace(/\.[^.]+$/, "");
    state.data.project.description = "由上传文件驱动的前端工作台项目。";
    updateProjectTimestamp();
    markGraphDirty("已替换源文件为 " + file.name + "，等待重新抽取图谱和重建下游结果。");
    updateTask("source_parse", "succeeded", 100, "已解析 " + chapters.length + " 个章节。");
    state.data.project.status = "processing";
    pushToast("已载入 " + file.name + "，下游模块已标记为待刷新。");
    renderApp();
  }

  function handleUploadedFile(file) {
    if (!file) {
      return;
    }

    updateTask("source_parse", "running", 30, "正在读取并分析上传内容。");
    addActivity("上传源文件", "接收到 " + file.name + "，开始更新章节与任务状态。");
    renderApp();

    const extension = file.name.split(".").pop().toLowerCase();
    if (extension === "txt") {
      const reader = new FileReader();
      reader.onload = function () {
        const chapters = buildChaptersFromText(reader.result || "");
        applyUploadedSource(file, chapters, "browser-text-parser-0.1");
      };
      reader.readAsText(file, "utf-8");
      return;
    }

    window.setTimeout(function () {
      applyUploadedSource(file, createPlaceholderChapters(file.name), "browser-docx-placeholder");
    }, 520);
  }

  function parseTextInput() {
    const titleInput = document.getElementById("novelTitle");
    const textInput = document.getElementById("novelText");
    const title = titleInput ? titleInput.value.trim() : "未命名小说";
    const text = textInput ? textInput.value.trim() : "";

    if (!text) {
      pushToast("请先输入小说内容！");
      return;
    }

    const fakeFile = {
      name: title + ".txt",
      size: text.length,
      lastModified: Date.now(),
    };

    updateTask("source_parse", "running", 30, "正在解析小说内容...");
    addActivity("输入源文件", "开始解析用户输入的小说内容。");
    renderApp();

    window.setTimeout(function () {
      const chapters = buildChaptersFromText(text);
      applyUploadedSource(fakeFile, chapters, "browser-text-input-0.1");
      state.data.project.title = title;
      updateProjectTimestamp();
      renderApp();
    }, 300);
  }

  function updateWordCount() {
    const textInput = document.getElementById("novelText");
    const wordCountEl = document.getElementById("wordCount");
    if (textInput && wordCountEl) {
      const text = textInput.value;
      // 统计中文字符和英文字母（不包括空格和换行）
      const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
      const total = chineseChars + Math.ceil(englishChars / 5); // 英文按5个字母算一个字
      wordCountEl.textContent = total + " 字";
    }
  }

  function loadSample() {
    const sampleText = `第一章 雨下的初遇

暴雨如注，街道上行人稀少。林雨躲在咖啡店的屋檐下，看着豆大的雨点打在玻璃上，形成一道道水痕。

"你也没带伞吗？"

一个温和的声音从旁边传来。林雨转过头，看到一个穿着白色衬衫的年轻人，手里拿着一把黑色的伞，正微笑着看着她。

"是啊，天气预报说今天不会下雨的。"林雨有些尴尬地笑了笑。

"我叫陈阳，"年轻人伸出手，"不介意的话，我送你一程？"

林雨犹豫了一下，然后点了点头，握住了那只温暖的手。

第二章 老照片

第二天清晨，雨停了。林雨在书桌上翻找东西时，不小心碰掉了一个旧相框。相框落在地上，玻璃碎了一地。

她蹲下来捡碎片，却发现相框里夹着一张老照片。照片上是一个穿着校服的女孩，笑得很灿烂，旁边站着一个男孩，正是陈阳。

"这是...陈阳？"林雨愣住了。

照片的背面写着一行字："2018年6月7日，毕业快乐，陈阳。"

林雨的心跳开始加速。2018年...那是她的毕业年份，可是她完全不记得陈阳这个人。

第三章 重逢的咖啡馆

下午，林雨来到昨天那家咖啡店。她刚推开门，就看到陈阳坐在靠窗的位置，手里拿着一本书，正在认真地阅读。

阳光透过窗户洒在他的脸上，给他镀上了一层金色的光芒。林雨看着这一幕，心跳又开始加速。

"林雨，你来了。"陈阳抬起头，看到她，脸上露出了微笑。

"你...你怎么知道我叫林雨？"林雨有些紧张地问。

陈阳放下书，指了指她放在桌上的照片："因为...我们早就认识了。"

"什么意思？"林雨更加困惑了。

"2018年6月7日，毕业典礼那天，"陈阳的声音变得温柔起来，"你忘了吗？那天，也是这样的雨天，我第一次遇到了你。"

林雨看着陈阳的眼睛，突然觉得有些记忆的碎片开始在脑海中浮现...

第四章 记忆的碎片

"喝杯咖啡吧，慢慢想。"陈阳把一杯热咖啡推到林雨面前。

林雨端起咖啡，温热的感觉从手心传到心里。她开始努力回想2018年的那场毕业典礼。

"我...我好像有点印象了，"林雨皱着眉头，"那天是下着雨，我好像在礼堂门口遇到了一个人..."

"对，那个人就是我，"陈阳微笑着说，"你当时把毕业帽掉在地上，我帮你捡了起来。"

林雨闭上眼睛，一些模糊的画面开始变得清晰起来：她确实在那天掉了毕业帽，也确实有个男生帮她捡起来了。只是当时人太多，她没有看清那个男生的脸。

"后来呢？"林雨问道。

"后来...我向你表白了，但你拒绝了我，"陈阳的笑容有些苦涩，"你说你要专注于学业，不想谈恋爱。"

林雨震惊地看着陈阳，她完全不记得这件事了。

"对不起，我...我真的不记得了，"林雨道歉说。

"没关系，"陈阳摇了摇头，"现在，我们又相遇了，不是吗？"

第五章 新的开始

从那天起，林雨和陈阳经常见面。他们一起喝咖啡，一起散步，一起谈论过去的事情。

林雨渐渐发现，陈阳是一个很温柔、很体贴的人。他总是能注意到她的情绪变化，总是能在她需要帮助的时候出现。

"林雨，"一天晚上，陈阳在送她回家的路上说，"我想再问你一次...这次，你愿意和我在一起吗？"

林雨停下脚步，看着陈阳的眼睛。她看到了真诚，看到了期待，也看到了一丝紧张。

"我...我愿意，"林雨微笑着说。

陈阳愣住了，然后脸上露出了灿烂的笑容。他伸出手，紧紧握住了林雨的手。

雨又开始下了，但这一次，他们不再是躲避在屋檐下的陌生人，而是携手共进的恋人。

"真好，"林雨轻声说，"我们又相遇了。"

"是啊，"陈阳笑着说，"这一次，我们不会再错过了。"

两个身影在雨中渐行渐远，留下一串幸福的脚印...`;

    const titleInput = document.getElementById("novelTitle");
    const textInput = document.getElementById("novelText");
    if (titleInput) titleInput.value = "暴雨夜";
    if (textInput) textInput.value = sampleText;
    
    updateWordCount();
    pushToast("示例小说已载入！");
  }

  function runExtraction() {
    updateTask("graph_extract", "running", 35, "正在根据章节摘要模拟抽取人物、关系和事件。");
    renderApp();

    window.setTimeout(function () {
      const extraction = dataApi.buildExtractionFromSource(state.data);
      state.data.characters = extraction.characters;
      state.data.relationships = extraction.relationships;
      state.data.story_graph = extraction.story_graph;
      state.data.meta.layout = extraction.layout;
      state.data.meta.graph_stale = false;
      state.data.meta.review_stale = true;
      state.data.meta.quality_stale = true;
      state.data.meta.storyboard_stale = true;
      state.data.meta.export_stale = true;
      state.data.meta.graph_mode = "simulated";
      state.ui.selectedCharacterId = state.data.characters[0] ? state.data.characters[0].id : "";
      state.data.project.status = "reviewing";
      updateProjectTimestamp();
      updateTask("graph_extract", "succeeded", 100, "图谱抽取完成，可继续生成剧本。");
      updateTask("script_generation", "pending", 0, "图谱已更新，等待新的剧本生成。");
      updateTask("script_review", "pending", 0, "等待基于新剧本执行审校。");
      updateTask("quality_scoring", "pending", 0, "等待新的评分结果。");
      updateTask("storyboard_generation", "pending", 0, "等待新的剧本和分镜。");
      updateTask("yaml_export", "pending", 0, "等待数据刷新后重新导出。");
      addActivity("重建图谱", "已根据当前章节重算人物关系和故事事件。");
      pushToast("图谱抽取完成，现在可以重新生成剧本。");
      renderApp();
    }, 720);
  }

  function generateScript() {
    updateTask("script_generation", "running", 40, "正在根据 story_graph 生成新剧本。");
    renderApp();

    window.setTimeout(function () {
      const nextVersion = dataApi.nextVersion(state.data.script.version);
      state.data.script = dataApi.buildScriptFromStoryGraph(
        state.data,
        state.ui.pendingStyle,
        nextVersion,
      );
      state.data.meta.review_stale = true;
      state.data.meta.quality_stale = true;
      state.data.meta.storyboard_stale = true;
      state.data.meta.export_stale = true;
      state.ui.selectedSceneId = state.data.script.scenes[0] ? state.data.script.scenes[0].id : "";
      updateProjectTimestamp();
      updateTask("script_generation", "succeeded", 100, dataApi.styleLibrary[state.ui.pendingStyle].label + "风格剧本已生成。");
      updateTask("script_review", "pending", 0, "等待对新剧本执行审校。");
      updateTask("quality_scoring", "pending", 0, "等待新的质量评分。");
      updateTask("storyboard_generation", "pending", 0, "等待根据新剧本生成分镜。");
      updateTask("yaml_export", "pending", 0, "导出内容等待同步最新剧本。");
      addActivity("重生成剧本", "剧本已切换为 " + dataApi.styleLibrary[state.ui.pendingStyle].label + " 风格，版本更新到 " + state.data.script.version + "。");
      pushToast("剧本已按 " + dataApi.styleLibrary[state.ui.pendingStyle].label + " 风格更新。");
      renderApp();
    }, 680);
  }

  function readSceneFromEditor() {
    const scene = getActiveScene();
    if (!scene) {
      return null;
    }

    const titleInput = document.querySelector("#sceneTitleInput");
    const locationInput = document.querySelector("#sceneLocationInput");
    const timeInput = document.querySelector("#sceneTimeInput");
    const synopsisInput = document.querySelector("#sceneSynopsisInput");
    const beatRows = document.querySelectorAll("[data-beat-row]");

    const beats = Array.from(beatRows)
      .map(function (row) {
        const type = row.querySelector('[data-role="beat-type"]').value;
        const speaker = row.querySelector('[data-role="beat-speaker"]').value.trim();
        const content = row.querySelector('[data-role="beat-content"]').value.trim();

        if (!content) {
          return null;
        }

        const matchedCharacter = state.data.characters.find(function (character) {
          return character.name === speaker;
        });

        return {
          type: type,
          content: content,
          character_id: type === "dialogue" && matchedCharacter ? matchedCharacter.id : undefined,
          character_name: type === "dialogue" ? speaker : undefined,
          emotion: type === "dialogue" ? dataApi.styleLibrary[state.ui.pendingStyle].emotion : undefined,
        };
      })
      .filter(Boolean);

    return {
      id: scene.id,
      index: scene.index,
      title: titleInput ? titleInput.value.trim() || scene.title : scene.title,
      location: locationInput ? locationInput.value.trim() || scene.location : scene.location,
      time: timeInput ? timeInput.value.trim() || scene.time : scene.time,
      synopsis: synopsisInput ? synopsisInput.value.trim() || scene.synopsis : scene.synopsis,
      characters: scene.characters.slice(),
      source_event_ids: scene.source_event_ids.slice(),
      beats: beats.length ? beats : [{ type: "action", content: "补充动作描述。"}],
    };
  }

  function saveScene() {
    const updatedScene = readSceneFromEditor();
    if (!updatedScene) {
      return;
    }

    const index = state.data.script.scenes.findIndex(function (scene) {
      return scene.id === updatedScene.id;
    });
    state.data.script.scenes[index] = updatedScene;
    updateProjectTimestamp();
    markScriptDirty("已保存场次“" + updatedScene.title + "”，下游结果已标记为待刷新。");
    pushToast("当前场次已保存。");
    renderApp();
  }

  function addBeatRow() {
    const container = document.querySelector("#beatEditor");
    if (!container) {
      return;
    }

    container.insertAdjacentHTML(
      "beforeend",
      renderBeatEditorRow({
        type: "action",
        content: "",
        character_name: "",
      }),
    );
  }

  function removeBeatRow(button) {
    const row = button.closest("[data-beat-row]");
    const container = document.querySelector("#beatEditor");
    if (!row || !container) {
      return;
    }

    if (container.querySelectorAll("[data-beat-row]").length === 1) {
      row.querySelector('[data-role="beat-content"]').value = "";
      row.querySelector('[data-role="beat-speaker"]').value = "";
      return;
    }

    row.remove();
  }

  function addScene() {
    const nextIndex = state.data.script.scenes.length + 1;
    const nextId = "scene_" + String(nextIndex).padStart(3, "0");
    const firstEvent = state.data.story_graph.events[0];
    const firstCharacterIds = state.data.characters.slice(0, 2).map(function (character) {
      return character.id;
    });

    state.data.script.scenes.push({
      id: nextId,
      index: nextIndex,
      title: "新场次 " + nextIndex,
      location: firstEvent ? state.data.story_graph.locations[0].name : "未标注地点",
      time: firstEvent ? firstEvent.time_label : "未标注时间",
      characters: firstCharacterIds,
      source_event_ids: firstEvent ? [firstEvent.id] : [],
      synopsis: "在这里补充新的剧情推进或转折。",
      beats: [{ type: "action", content: "补充动作描述。" }],
    });

    state.ui.selectedSceneId = nextId;
    updateProjectTimestamp();
    markScriptDirty("新增了一个空白场次，等待继续编辑。");
    pushToast("已新增场次。");
    renderApp();
  }

  function moveScene(direction) {
    const currentIndex = state.data.script.scenes.findIndex(function (scene) {
      return scene.id === state.ui.selectedSceneId;
    });

    if (currentIndex < 0) {
      return;
    }

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= state.data.script.scenes.length) {
      pushToast("当前场次已经在边界位置。");
      return;
    }

    const scenes = state.data.script.scenes;
    const temp = scenes[currentIndex];
    scenes[currentIndex] = scenes[targetIndex];
    scenes[targetIndex] = temp;
    syncSceneIndices();
    updateProjectTimestamp();
    markScriptDirty("调整了场次顺序。");
    renderApp();
  }

  function deleteScene() {
    if (state.data.script.scenes.length <= 1) {
      pushToast("至少保留一个场次。");
      return;
    }

    const currentIndex = state.data.script.scenes.findIndex(function (scene) {
      return scene.id === state.ui.selectedSceneId;
    });
    const removedScene = state.data.script.scenes[currentIndex];
    state.data.script.scenes.splice(currentIndex, 1);
    syncSceneIndices();
    state.ui.selectedSceneId =
      state.data.script.scenes[Math.max(0, currentIndex - 1)].id;
    updateProjectTimestamp();
    markScriptDirty("删除了场次“" + removedScene.title + "”。");
    pushToast("已删除当前场次。");
    renderApp();
  }

  function performReview(silent) {
    updateTask("script_review", "running", 35, "正在重新分析角色一致性、时间线与对白分布。");
    renderApp();

    window.setTimeout(function () {
      state.data.review = dataApi.buildReviewFromScript(state.data);
      state.data.meta.review_stale = false;
      state.data.meta.quality_stale = true;
      state.data.meta.export_stale = true;
      updateProjectTimestamp();
      updateTask(
        "script_review",
        "succeeded",
        100,
        "审校完成，发现 " + state.data.review.issues.length + " 个问题。",
      );
      updateTask("quality_scoring", "pending", 0, "等待基于最新审校结果重新评分。");
      updateTask("yaml_export", "pending", 0, "等待导出最新审校结果。");
      addActivity("执行审校", "已生成 " + state.data.review.issues.length + " 条审校结论。");
      if (!silent) {
        pushToast("审校结果已刷新。");
      }
      renderApp();
    }, 520);
  }

  function performQuality() {
    if (state.data.meta.review_stale) {
      pushToast("先刷新审校，再计算质量评分。");
      return;
    }

    updateTask("quality_scoring", "running", 35, "正在根据审校结果重算多维评分。");
    renderApp();

    window.setTimeout(function () {
      state.data.quality = dataApi.buildQualityFromReview(state.data);
      state.data.meta.quality_stale = false;
      state.data.meta.export_stale = true;
      updateProjectTimestamp();
      updateTask("quality_scoring", "succeeded", 100, "评分完成，总分 " + state.data.quality.total_score + "。");
      updateTask("yaml_export", "pending", 0, "等待导出最新评分结果。");
      addActivity("刷新评分", "最新剧本质量总分为 " + state.data.quality.total_score + "。");
      pushToast("质量评分已刷新。");
      renderApp();
    }, 540);
  }

  function generateStoryboard() {
    updateTask("storyboard_generation", "running", 35, "正在根据场次内容生成镜头建议。");
    renderApp();

    window.setTimeout(function () {
      state.data.storyboard = dataApi.buildStoryboardFromScript(state.data);
      state.data.meta.storyboard_stale = false;
      state.data.meta.export_stale = true;
      updateProjectTimestamp();
      updateTask(
        "storyboard_generation",
        "succeeded",
        100,
        "已生成 " + state.data.storyboard.shots.length + " 个镜头。",
      );
      updateTask("yaml_export", "pending", 0, "等待导出包含分镜的新结构。");
      addActivity("重建分镜", "分镜已根据当前剧本重新生成。");
      pushToast("分镜脚本已更新。");
      renderApp();
    }, 620);
  }

  function refreshExport() {
    const exportSnapshot = getExportSnapshot();
    state.data.export.exported_at = dataApi.nowIso();
    state.data.export.validated = exportSnapshot.validation.valid;
    state.data.export.validation_errors = exportSnapshot.validation.errors.slice();
    state.data.meta.export_stale = false;
    state.data.project.status = exportSnapshot.validation.valid ? "completed" : state.data.project.status;
    updateProjectTimestamp();
    updateTask(
      "yaml_export",
      exportSnapshot.validation.valid ? "succeeded" : "failed",
      100,
      exportSnapshot.validation.valid
        ? "YAML 已完成校验，可继续下载。"
        : "YAML 校验失败，请先修复结构错误。",
    );
    addActivity(
      "刷新导出",
      exportSnapshot.validation.valid
        ? "结构通过校验，当前可下载 YAML。"
        : "结构存在 " + exportSnapshot.validation.errors.length + " 个错误。",
    );
    pushToast(
      exportSnapshot.validation.valid
        ? "YAML 校验通过。"
        : "YAML 仍有结构错误，请查看校验面板。",
    );
    renderApp();
  }

  function downloadYaml() {
    refreshExport();

    const exportSnapshot = getExportSnapshot();
    if (!exportSnapshot.validation.valid) {
      return;
    }

    const blob = new Blob([exportSnapshot.yamlText], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = state.data.project.id + ".yaml";
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast("YAML 已触发下载。");
  }

  function changeSection(sectionKey) {
    state.ui.activeSection = sectionKey;
    if (window.location.hash !== "#" + sectionKey) {
      window.location.hash = sectionKey;
    }
    renderApp();
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("button");
    if (!target) {
      return;
    }

    if (target.dataset.section) {
      changeSection(target.dataset.section);
      return;
    }

    if (target.dataset.nav) {
      changeSection(target.dataset.nav);
      return;
    }

    if (target.dataset.characterId) {
      state.ui.selectedCharacterId = target.dataset.characterId;
      renderApp();
      return;
    }

    if (target.dataset.sceneId) {
      state.ui.selectedSceneId = target.dataset.sceneId;
      renderApp();
      return;
    }

    if (target.dataset.storyboardScene) {
      state.ui.storyboardFilter = target.dataset.storyboardScene;
      renderApp();
      return;
    }

    switch (target.dataset.action) {
      case "choose-file":
        chooseFileInput();
        break;
      case "parse-text":
        parseTextInput();
        break;
      case "load-sample":
        loadSample();
        break;
      case "run-extraction":
        runExtraction();
        break;
      case "generate-script":
        generateScript();
        break;
      case "save-scene":
        saveScene();
        break;
      case "add-beat":
        addBeatRow();
        break;
      case "remove-beat":
        removeBeatRow(target);
        break;
      case "add-scene":
        addScene();
        break;
      case "move-scene-up":
        moveScene(-1);
        break;
      case "move-scene-down":
        moveScene(1);
        break;
      case "delete-scene":
        deleteScene();
        break;
      case "run-review":
        performReview(false);
        break;
      case "run-quality":
        performQuality();
        break;
      case "generate-storyboard":
        generateStoryboard();
        break;
      case "refresh-export":
        refreshExport();
        break;
      case "download-yaml":
        downloadYaml();
        break;
      default:
        break;
    }
  });

  document.addEventListener("change", function (event) {
    const target = event.target;

    if (target.id === "styleSelect") {
      state.ui.pendingStyle = target.value;
      return;
    }

    if (target.id === "fileInput") {
      handleUploadedFile(target.files[0]);
    }
  });

  document.addEventListener("input", function (event) {
    const target = event.target;
    if (target.id === "novelText") {
      updateWordCount();
    }
  });

  document.addEventListener("dragover", function (event) {
    const uploadZone = event.target.closest("#uploadZone");
    if (!uploadZone) {
      return;
    }

    event.preventDefault();
    uploadZone.classList.add("dragging");
  });

  document.addEventListener("dragleave", function (event) {
    const uploadZone = event.target.closest("#uploadZone");
    if (!uploadZone) {
      return;
    }

    uploadZone.classList.remove("dragging");
  });

  document.addEventListener("drop", function (event) {
    const uploadZone = event.target.closest("#uploadZone");
    if (!uploadZone) {
      return;
    }

    event.preventDefault();
    uploadZone.classList.remove("dragging");
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleUploadedFile(event.dataTransfer.files[0]);
    }
  });

  // 全局错误处理
  window.addEventListener("error", function (event) {
    console.error("Global error:", event.error);
    pushToast("发生错误，请刷新页面重试");
  });

  window.addEventListener("unhandledrejection", function (event) {
    console.error("Unhandled promise rejection:", event.reason);
    pushToast("操作失败，请重试");
  });

  // 欢迎页按钮事件 - 确保 DOM 加载完成后绑定
  function bindEvents() {
    console.log("Binding events...");
    document.addEventListener("click", function (event) {
      console.log("Document clicked, target:", event.target);
      const target = event.target.closest("#enterBtn");
      if (target) {
        console.log("enterBtn clicked!");
        enterApp();
      }
    });
    console.log("Events bound!");
  }

  // 检查 DOM 是否加载完成
  if (document.readyState === "loading") {
    console.log("DOM still loading, waiting for DOMContentLoaded...");
    document.addEventListener("DOMContentLoaded", function() {
      console.log("DOMContentLoaded fired!");
      bindEvents();
      renderApp();
    });
  } else {
    console.log("DOM already loaded, binding events immediately...");
    bindEvents();
    renderApp();
  }
})();
