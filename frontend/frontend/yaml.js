(function () {
  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  function quoteString(value) {
    return JSON.stringify(String(value));
  }

  function stringifyYaml(value, indentLevel) {
    const indent = "  ".repeat(indentLevel || 0);

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "[]";
      }

      return value
        .map((item) => {
          if (isPlainObject(item)) {
            const entries = Object.entries(item);
            if (entries.length === 0) {
              return indent + "- {}";
            }

            const [firstKey, firstValue] = entries[0];
            let result = indent + "- " + firstKey + ": " + stringifyInline(firstValue, indentLevel + 1);

            entries.slice(1).forEach(([key, nestedValue]) => {
              result += "\n" + indent + "  " + key + ": " + stringifyInline(nestedValue, indentLevel + 1);
            });

            return result;
          }

          return indent + "- " + stringifyInline(item, indentLevel + 1);
        })
        .join("\n");
    }

    if (isPlainObject(value)) {
      return Object.entries(value)
        .map(([key, nestedValue]) => indent + key + ": " + stringifyInline(nestedValue, indentLevel + 1))
        .join("\n");
    }

    return stringifyInline(value, indentLevel);
  }

  function stringifyInline(value, indentLevel) {
    if (Array.isArray(value) || isPlainObject(value)) {
      const nested = stringifyYaml(value, indentLevel || 0);
      return nested ? "\n" + nested : Array.isArray(value) ? " []" : " {}";
    }

    if (typeof value === "string") {
      return quoteString(value);
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (value === null) {
      return "null";
    }

    if (typeof value === "undefined") {
      return "\"\"";
    }

    return quoteString(String(value));
  }

  function buildExportModel(project) {
    return {
      schema_version: project.schema_version,
      project: project.project,
      source: project.source,
      characters: project.characters,
      relationships: project.relationships,
      story_graph: project.story_graph,
      script: project.script,
      storyboard: project.storyboard,
      review: project.review,
      quality: project.quality,
      export: project.export,
      extensions: {
        frontend: {
          prototype_mode: true,
          graph_stale: Boolean(project.meta && project.meta.graph_stale),
          review_stale: Boolean(project.meta && project.meta.review_stale),
          quality_stale: Boolean(project.meta && project.meta.quality_stale),
          storyboard_stale: Boolean(project.meta && project.meta.storyboard_stale),
          export_stale: Boolean(project.meta && project.meta.export_stale),
        },
      },
    };
  }

  function validateProjectModel(model) {
    const errors = [];

    const allowedFileTypes = ["txt", "docx"];
    const allowedStyles = ["film", "tv_series", "short_drama", "animation"];
    const allowedSeverity = ["low", "medium", "high", "critical"];

    if (!model.schema_version) {
      errors.push("schema_version 缺失。");
    } else if (model.schema_version !== "1.0") {
      errors.push("schema_version 必须为 \"1.0\"。");
    }

    if (!model.project || !model.project.id) {
      errors.push("project.id 缺失。");
    }

    if (!model.project || !model.project.title) {
      errors.push("project.title 缺失。");
    }

    if (!model.source || !model.source.document || !model.source.document.id) {
      errors.push("source.document.id 缺失。");
    }

    if (
      model.source &&
      model.source.document &&
      !allowedFileTypes.includes(model.source.document.file_type)
    ) {
      errors.push("source.document.file_type 只能是 txt 或 docx。");
    }

    if (!model.script || !model.script.id) {
      errors.push("script.id 缺失。");
    }

    if (model.script && !allowedStyles.includes(model.script.style)) {
      errors.push("script.style 不在允许范围内。");
    }

    if (!model.script || !Array.isArray(model.script.scenes) || model.script.scenes.length === 0) {
      errors.push("script.scenes 至少需要一个场次。");
    }

    const sceneIds = new Set();
    (model.script && model.script.scenes ? model.script.scenes : []).forEach((scene) => {
      if (sceneIds.has(scene.id)) {
        errors.push("scene.id 必须唯一：" + scene.id);
      }
      sceneIds.add(scene.id);
    });

    const characterIds = new Set();
    (model.characters || []).forEach((character) => {
      if (characterIds.has(character.id)) {
        errors.push("character.id 必须唯一：" + character.id);
      }
      characterIds.add(character.id);
    });

    (model.relationships || []).forEach((relationship) => {
      if (!characterIds.has(relationship.from_character_id)) {
        errors.push("relationship.from_character_id 未找到人物：" + relationship.from_character_id);
      }

      if (!characterIds.has(relationship.to_character_id)) {
        errors.push("relationship.to_character_id 未找到人物：" + relationship.to_character_id);
      }
    });

    ((model.story_graph && model.story_graph.events) || []).forEach((event) => {
      (event.participants || []).forEach((participantId) => {
        if (!characterIds.has(participantId)) {
          errors.push("story_graph.events.participants 未找到人物：" + participantId);
        }
      });
    });

    ((model.storyboard && model.storyboard.shots) || []).forEach((shot) => {
      if (!sceneIds.has(shot.scene_id)) {
        errors.push("storyboard.shots.scene_id 未找到场次：" + shot.scene_id);
      }
    });

    if (
      model.quality &&
      typeof model.quality.total_score === "number" &&
      (model.quality.total_score < 0 || model.quality.total_score > 100)
    ) {
      errors.push("quality.total_score 必须在 0 到 100 之间。");
    }

    (model.quality && model.quality.dimensions ? model.quality.dimensions : []).forEach(
      (dimension) => {
        if (dimension.score < 0 || dimension.score > 100) {
          errors.push("quality.dimensions.score 必须在 0 到 100 之间。");
        }
      },
    );

    (model.review && model.review.issues ? model.review.issues : []).forEach((issue) => {
      if (!allowedSeverity.includes(issue.severity)) {
        errors.push("review.issues.severity 不在允许范围内：" + issue.severity);
      }
    });

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  window.Novel2ScreenYaml = {
    buildExportModel: buildExportModel,
    validateProjectModel: validateProjectModel,
    stringifyYaml: stringifyYaml,
  };
})();
