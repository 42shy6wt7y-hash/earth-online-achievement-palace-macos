const state = {
  achievements: [],
  selectedIds: new Set(),
  deleteMode: false,
  currentId: null,
  editing: false,
  draft: null,
  pendingImages: {
    thumbImageData: null,
    detailImageData: null
  }
};

const el = {
  grid: document.querySelector("#achievementGrid"),
  counterText: document.querySelector("#counterText"),
  modeText: document.querySelector("#modeText"),
  normalActions: document.querySelector("#normalActions"),
  deleteActions: document.querySelector("#deleteActions"),
  createButton: document.querySelector("#createButton"),
  deleteModeButton: document.querySelector("#deleteModeButton"),
  cancelDeleteButton: document.querySelector("#cancelDeleteButton"),
  confirmDeleteButton: document.querySelector("#confirmDeleteButton"),
  openArchiveButton: document.querySelector("#openArchiveButton"),
  openLetterButton: document.querySelector("#openLetterButton"),
  letterLayer: document.querySelector("#letterLayer"),
  closeLetterButton: document.querySelector("#closeLetterButton"),
  modalLayer: document.querySelector("#modalLayer"),
  detailCard: document.querySelector(".detail-card"),
  closeDetailButton: document.querySelector("#closeDetailButton"),
  statusSwitch: document.querySelector("#statusSwitch"),
  statusText: document.querySelector("#statusText"),
  detailImage: document.querySelector("#detailImage"),
  detailView: document.querySelector("#detailView"),
  detailForm: document.querySelector("#detailForm"),
  detailTitle: document.querySelector("#detailTitle"),
  detailSummary: document.querySelector("#detailSummary"),
  detailCondition: document.querySelector("#detailCondition"),
  detailAchievedAt: document.querySelector("#detailAchievedAt"),
  titleInput: document.querySelector("#titleInput"),
  summaryInput: document.querySelector("#summaryInput"),
  conditionInput: document.querySelector("#conditionInput"),
  achievedAtInput: document.querySelector("#achievedAtInput"),
  thumbInput: document.querySelector("#thumbInput"),
  detailInput: document.querySelector("#detailInput"),
  editButton: document.querySelector("#editButton"),
  deleteCurrentButton: document.querySelector("#deleteCurrentButton"),
  discardEditButton: document.querySelector("#discardEditButton"),
  saveEditButton: document.querySelector("#saveEditButton"),
  confirmLayer: document.querySelector("#confirmLayer"),
  confirmTitle: document.querySelector("#confirmTitle"),
  confirmMessage: document.querySelector("#confirmMessage"),
  confirmActions: document.querySelector("#confirmActions")
};

function api(path, options = {}) {
  return fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "请求失败");
    }
    return data;
  });
}

function currentAchievement() {
  return state.achievements.find((item) => item.id === state.currentId) || null;
}

function displayText(value, fallback = "未命名成就") {
  const text = String(value ?? "");
  return text.length ? text : fallback;
}

function setText(node, value, fallback = "") {
  node.textContent = displayText(value, fallback);
}

function isUnlocked(achievement) {
  return achievement?.status === "unlocked";
}

function imageMarkup(src, status) {
  if (src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    return img;
  }
  const mark = document.createElement("div");
  mark.className = "placeholder-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.dataset.status = status;
  return mark;
}

function renderCard(achievement) {
  const card = document.createElement("article");
  card.className = `achievement-card ${isUnlocked(achievement) ? "unlocked" : "locked"}`;
  card.tabIndex = 0;
  card.dataset.id = achievement.id;

  const thumb = document.createElement("div");
  thumb.className = "thumb-frame";
  thumb.appendChild(imageMarkup(achievement.thumbImage || achievement.detailImage, achievement.status));

  const content = document.createElement("div");
  content.className = "card-content";

  const title = document.createElement("h2");
  title.className = "card-title";
  setText(title, achievement.title, "未命名成就");

  const line = document.createElement("div");
  line.className = "card-line";

  const summary = document.createElement("p");
  summary.className = "card-summary";
  setText(summary, achievement.summary, "尚未写入描述");

  content.append(title, line, summary);
  card.append(thumb, content);

  if (state.deleteMode) {
    const check = document.createElement("div");
    check.className = `card-check ${state.selectedIds.has(achievement.id) ? "selected" : ""}`;
    card.appendChild(check);
  }

  card.addEventListener("click", () => {
    if (state.deleteMode) {
      toggleSelected(achievement.id);
      return;
    }
    openDetail(achievement.id);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (state.deleteMode) toggleSelected(achievement.id);
    else openDetail(achievement.id);
  });

  return card;
}

function renderGrid() {
  el.grid.innerHTML = "";
  const count = state.achievements.length;
  el.counterText.textContent = count ? `当前陈列 ${count} 项成就` : "当前没有成就";
  el.modeText.textContent = state.deleteMode ? `删除模式：已选择 ${state.selectedIds.size} 项` : "";

  if (!count) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "点击右上角创建，收入第一张人生存档。";
    el.grid.appendChild(empty);
    return;
  }

  state.achievements.forEach((achievement) => {
    el.grid.appendChild(renderCard(achievement));
  });
}

async function loadAchievements() {
  const data = await api("/api/achievements");
  state.achievements = data.achievements || [];
  renderGrid();
}

async function createAchievement() {
  const data = await api("/api/achievements", {
    method: "POST",
    body: JSON.stringify({ status: "locked" })
  });
  state.achievements = [data.achievement, ...state.achievements];
  renderGrid();
}

function enterDeleteMode() {
  state.deleteMode = true;
  state.selectedIds.clear();
  el.normalActions.classList.add("hidden");
  el.deleteActions.classList.remove("hidden");
  renderGrid();
}

function exitDeleteMode() {
  state.deleteMode = false;
  state.selectedIds.clear();
  el.normalActions.classList.remove("hidden");
  el.deleteActions.classList.add("hidden");
  renderGrid();
}

function toggleSelected(id) {
  if (state.selectedIds.has(id)) state.selectedIds.delete(id);
  else state.selectedIds.add(id);
  renderGrid();
}

async function confirmDeleteSelected() {
  if (!state.selectedIds.size) return;
  const ids = Array.from(state.selectedIds);
  showConfirm({
    title: "确认删除",
    message: `确定要从当前陈列馆移除 ${ids.length} 项成就吗？底层档案文件会保留。`,
    actions: [
      { label: "取消", variant: "ghost", action: hideConfirm },
      {
        label: "确认删除",
        variant: "danger",
        action: async () => {
          await api("/api/achievements/delete", {
            method: "POST",
            body: JSON.stringify({ ids })
          });
          hideConfirm();
          exitDeleteMode();
          await loadAchievements();
        }
      }
    ]
  });
}

function openDetail(id) {
  state.currentId = id;
  state.editing = false;
  state.draft = null;
  state.pendingImages = { thumbImageData: null, detailImageData: null };
  el.modalLayer.classList.remove("hidden");
  el.modalLayer.setAttribute("aria-hidden", "false");
  renderDetail();
}

function closeDetail() {
  if (state.editing) {
    askUnsavedExit();
    return;
  }
  el.modalLayer.classList.add("hidden");
  el.modalLayer.setAttribute("aria-hidden", "true");
  state.currentId = null;
}

function detailSource() {
  return state.editing ? state.draft : currentAchievement();
}

function renderDetailImage(achievement) {
  el.detailImage.innerHTML = "";
  const src = achievement?.detailImage || achievement?.thumbImage || "";
  el.detailImage.appendChild(imageMarkup(src, achievement?.status || "locked"));
}

function renderDetail() {
  const achievement = detailSource();
  if (!achievement) return;

  const locked = !isUnlocked(achievement);
  el.detailCard.classList.toggle("locked", locked);
  el.statusSwitch.checked = isUnlocked(achievement);
  el.statusText.textContent = isUnlocked(achievement) ? "已达成" : "未达成";

  renderDetailImage(achievement);

  if (state.editing) {
    el.detailView.classList.add("hidden");
    el.detailForm.classList.remove("hidden");
    el.editButton.classList.add("hidden");
    el.deleteCurrentButton.classList.add("hidden");
    el.discardEditButton.classList.remove("hidden");
    el.saveEditButton.classList.remove("hidden");

    el.titleInput.value = achievement.title || "";
    el.summaryInput.value = achievement.summary || "";
    el.conditionInput.value = achievement.condition || "";
    el.achievedAtInput.value = isUnlocked(achievement) ? achievement.achievedAt || "" : "未来";
    el.achievedAtInput.disabled = !isUnlocked(achievement);
  } else {
    el.detailView.classList.remove("hidden");
    el.detailForm.classList.add("hidden");
    el.editButton.classList.remove("hidden");
    el.deleteCurrentButton.classList.remove("hidden");
    el.discardEditButton.classList.add("hidden");
    el.saveEditButton.classList.add("hidden");

    setText(el.detailTitle, achievement.title, "未命名成就");
    setText(el.detailSummary, achievement.summary, "尚未写入描述");
    setText(el.detailCondition, achievement.condition, "尚未写入达成条件");
    el.detailAchievedAt.textContent = isUnlocked(achievement)
      ? displayText(achievement.achievedAt, "未记录")
      : "未来";
  }
}

function startEdit() {
  const achievement = currentAchievement();
  if (!achievement) return;
  state.editing = true;
  state.draft = structuredClone(achievement);
  state.pendingImages = { thumbImageData: null, detailImageData: null };
  el.thumbInput.value = "";
  el.detailInput.value = "";
  renderDetail();
}

function applyFormToDraft() {
  if (!state.draft) return;
  state.draft.title = el.titleInput.value;
  state.draft.summary = el.summaryInput.value;
  state.draft.condition = el.conditionInput.value;
  if (isUnlocked(state.draft)) {
    state.draft.achievedAt = el.achievedAtInput.value;
  }
}

async function saveEdit() {
  applyFormToDraft();
  const original = currentAchievement();
  if (!original || !state.draft) return;

  const changes = {
    status: state.draft.status,
    title: state.draft.title,
    summary: state.draft.summary,
    condition: state.draft.condition,
    achievedAt: state.draft.achievedAt,
    tags: state.draft.tags || [],
    notes: state.draft.notes || "",
    points: state.draft.points ?? null
  };

  const data = await api(`/api/achievements/${encodeURIComponent(original.id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      changes,
      thumbImageData: state.pendingImages.thumbImageData,
      detailImageData: state.pendingImages.detailImageData
    })
  });

  const index = state.achievements.findIndex((item) => item.id === original.id);
  if (index >= 0 && data.achievement) {
    state.achievements[index] = data.achievement;
  }

  state.editing = false;
  state.draft = null;
  state.pendingImages = { thumbImageData: null, detailImageData: null };
  renderGrid();
  renderDetail();
}

function discardEdit() {
  state.editing = false;
  state.draft = null;
  state.pendingImages = { thumbImageData: null, detailImageData: null };
  renderDetail();
}

function askUnsavedExit() {
  showConfirm({
    title: "当前修改尚未保存",
    message: "请选择保存退出、不保存退出，或继续留在编辑状态。",
    actions: [
      { label: "继续编辑", variant: "ghost", action: hideConfirm },
      {
        label: "不保存退出",
        variant: "ghost",
        action: () => {
          hideConfirm();
          discardEdit();
          closeDetail();
        }
      },
      {
        label: "保存并退出",
        action: async () => {
          await saveEdit();
          hideConfirm();
          closeDetail();
        }
      }
    ]
  });
}

async function toggleStatus() {
  const target = state.editing ? state.draft : currentAchievement();
  if (!target) return;
  target.status = el.statusSwitch.checked ? "unlocked" : "locked";

  if (target.status === "unlocked" && !target.achievedAt) {
    target.achievedAt = new Date().toLocaleDateString("zh-CN");
  }

  if (state.editing) {
    renderDetail();
    return;
  }

  const data = await api(`/api/achievements/${encodeURIComponent(target.id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      changes: {
        status: target.status,
        achievedAt: target.achievedAt
      }
    })
  });
  const index = state.achievements.findIndex((item) => item.id === target.id);
  if (index >= 0 && data.achievement) {
    state.achievements[index] = data.achievement;
  }
  renderGrid();
  renderDetail();
}

function deleteCurrentAchievement() {
  const achievement = currentAchievement();
  if (!achievement) return;
  showConfirm({
    title: "确认删除",
    message: "确定要从当前陈列馆移除这项成就吗？底层档案文件会保留。",
    actions: [
      { label: "取消", variant: "ghost", action: hideConfirm },
      {
        label: "确认删除",
        variant: "danger",
        action: async () => {
          await api("/api/achievements/delete", {
            method: "POST",
            body: JSON.stringify({ ids: [achievement.id] })
          });
          hideConfirm();
          el.modalLayer.classList.add("hidden");
          el.modalLayer.setAttribute("aria-hidden", "true");
          state.currentId = null;
          await loadAchievements();
        }
      }
    ]
  });
}

function readFileAsData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleImagePick(event, role) {
  const file = event.target.files?.[0];
  if (!file || !state.draft) return;
  const dataUrl = await readFileAsData(file);
  const payload = {
    name: file.name,
    type: file.type,
    dataUrl
  };

  if (role === "thumb") {
    state.pendingImages.thumbImageData = payload;
    state.draft.thumbImage = dataUrl;
  } else {
    state.pendingImages.detailImageData = payload;
    state.draft.detailImage = dataUrl;
  }
  renderDetailImage(state.draft);
}

function showConfirm({ title, message, actions }) {
  el.confirmTitle.textContent = title;
  el.confirmMessage.textContent = message;
  el.confirmActions.innerHTML = "";
  actions.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `action-button ${item.variant || ""}`;
    button.textContent = item.label;
    button.addEventListener("click", item.action);
    el.confirmActions.appendChild(button);
  });
  el.confirmLayer.classList.remove("hidden");
  el.confirmLayer.setAttribute("aria-hidden", "false");
}

function hideConfirm() {
  el.confirmLayer.classList.add("hidden");
  el.confirmLayer.setAttribute("aria-hidden", "true");
}

function openLetter() {
  el.letterLayer.classList.remove("hidden");
  el.letterLayer.setAttribute("aria-hidden", "false");
}

function closeLetter() {
  el.letterLayer.classList.add("hidden");
  el.letterLayer.setAttribute("aria-hidden", "true");
}

async function openArchiveFolder() {
  try {
    const data = await api("/api/archive/open", {
      method: "POST",
      body: JSON.stringify({})
    });
    showConfirm({
      title: "本地档案库",
      message: `已尝试打开档案文件夹：${data.path}`,
      actions: [{ label: "知道了", action: hideConfirm }]
    });
  } catch (error) {
    showConfirm({
      title: "本地档案库",
      message: "档案保存在当前项目的 achievement-archive 文件夹中。创建、修改、删除都会留下事件文件，图片也会复制进去。",
      actions: [{ label: "知道了", action: hideConfirm }]
    });
  }
}

el.createButton.addEventListener("click", createAchievement);
el.deleteModeButton.addEventListener("click", enterDeleteMode);
el.cancelDeleteButton.addEventListener("click", exitDeleteMode);
el.confirmDeleteButton.addEventListener("click", confirmDeleteSelected);
el.openArchiveButton.addEventListener("click", openArchiveFolder);
el.openLetterButton.addEventListener("click", openLetter);
el.closeLetterButton.addEventListener("click", closeLetter);
el.closeDetailButton.addEventListener("click", closeDetail);
el.editButton.addEventListener("click", startEdit);
el.deleteCurrentButton.addEventListener("click", deleteCurrentAchievement);
el.discardEditButton.addEventListener("click", () => {
  showConfirm({
    title: "不保存退出编辑",
    message: "确定放弃本次修改吗？",
    actions: [
      { label: "继续编辑", variant: "ghost", action: hideConfirm },
      {
        label: "不保存退出",
        variant: "danger",
        action: () => {
          hideConfirm();
          discardEdit();
        }
      }
    ]
  });
});
el.saveEditButton.addEventListener("click", saveEdit);
el.statusSwitch.addEventListener("change", toggleStatus);
el.thumbInput.addEventListener("change", (event) => handleImagePick(event, "thumb"));
el.detailInput.addEventListener("change", (event) => handleImagePick(event, "detail"));

el.titleInput.addEventListener("input", () => {
  if (state.draft) state.draft.title = el.titleInput.value;
});
el.summaryInput.addEventListener("input", () => {
  if (state.draft) state.draft.summary = el.summaryInput.value;
});
el.conditionInput.addEventListener("input", () => {
  if (state.draft) state.draft.condition = el.conditionInput.value;
});
el.achievedAtInput.addEventListener("input", () => {
  if (state.draft && isUnlocked(state.draft)) state.draft.achievedAt = el.achievedAtInput.value;
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !el.letterLayer.classList.contains("hidden")) {
    closeLetter();
    return;
  }

  if (event.key === "Escape" && !el.modalLayer.classList.contains("hidden")) {
    closeDetail();
  }
});

loadAchievements().catch((error) => {
  el.counterText.textContent = `读取失败：${error.message}`;
});
