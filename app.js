(function () {
  const STORAGE_KEY = "header-exporter-people-v2";
  const encoder = new TextEncoder();
  const state = {
    people: [],
    filtered: [],
    files: [],
    mode: "manual"
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const els = {
    manualName: $("#manualName"),
    manualRoll: $("#manualRoll"),
    manualClass: $("#manualClass"),
    manualPanel: $(".manual-panel"),
    manualHint: $("#manualHint"),
    personName: $("#personName"),
    personRoll: $("#personRoll"),
    personClass: $("#personClass"),
    peoplePanel: $(".people-panel"),
    peopleHint: $("#peopleHint"),
    searchBox: $("#searchBox"),
    peopleList: $("#peopleList"),
    countText: $("#countText"),
    fileInput: $("#sourceFiles"),
    fileCount: $("#fileCount"),
    clearFiles: $("#clearFiles"),
    fileList: $("#fileList"),
    dropZone: $("#dropZone"),
    statusText: $("#statusText"),
    dialog: $("#messageDialog"),
    dialogTitle: $("#dialogTitle"),
    dialogText: $("#dialogText"),
    dialogCancel: $("#dialogCancel")
  };

  function getMode() {
    return document.querySelector("input[name='mode']:checked").value;
  }

  function getExportType() {
    return document.querySelector("input[name='exportType']:checked").value;
  }

  function getHeaderStyle() {
    return document.querySelector("input[name='headerStyle']:checked").value;
  }

  function setStatus(text) {
    els.statusText.textContent = text || "";
  }

  function showMessage(title, text) {
    els.dialogTitle.textContent = title;
    els.dialogText.textContent = text;
    els.dialogCancel.hidden = true;
    els.dialog.showModal();
  }

  function showModeHint(target) {
    const hint = target === "manual" ? els.manualHint : els.peopleHint;
    hint.hidden = false;
    hint.classList.remove("pulse");
    void hint.offsetWidth;
    hint.classList.add("pulse");
    setStatus(target === "manual"
      ? "Manual Entry is disabled while People Database is selected."
      : "People Database is disabled while Manual Entry is selected.");
  }

  function confirmMessage(title, text) {
    els.dialogTitle.textContent = title;
    els.dialogText.textContent = text;
    els.dialogCancel.hidden = false;
    els.dialog.showModal();
    return new Promise((resolve) => {
      els.dialog.addEventListener("close", () => resolve(els.dialog.returnValue === "ok"), { once: true });
    });
  }

  function readPeople() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      state.people = Array.isArray(saved)
        ? saved.map((person) => ({
            Name: String(person.Name || ""),
            "Roll No": String(person["Roll No"] || ""),
            Class: String(person.Class || ""),
            selected: false
          }))
        : [];
    } catch {
      state.people = [];
    }
  }

  function savePeople() {
    const clean = state.people.map(({ Name, "Roll No": roll, Class }) => ({
      Name,
      "Roll No": roll,
      Class
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean, null, 2));
  }

  function personFromEditor() {
    return {
      Name: els.personName.value.trim(),
      "Roll No": els.personRoll.value.trim(),
      Class: els.personClass.value.trim(),
      selected: false
    };
  }

  function manualPerson() {
    return {
      Name: els.manualName.value.trim(),
      "Roll No": els.manualRoll.value.trim(),
      Class: els.manualClass.value.trim()
    };
  }

  function setEditor(person) {
    els.personName.value = person ? person.Name : "";
    els.personRoll.value = person ? person["Roll No"] : "";
    els.personClass.value = person ? person.Class : "";
  }

  function selectedPeople() {
    return state.people.filter((person) => person.selected);
  }

  function applySearch() {
    const query = els.searchBox.value.trim().toLowerCase();
    state.filtered = query
      ? state.people.filter((person) =>
          person.Name.toLowerCase().includes(query) ||
          person["Roll No"].toLowerCase().includes(query) ||
          person.Class.toLowerCase().includes(query))
      : state.people.slice();
    renderPeople();
  }

  function updateSelectedCount() {
    els.countText.textContent = `Selected: ${selectedPeople().length} / Total: ${state.people.length}`;
  }

  function renderPeople() {
    els.peopleList.innerHTML = "";
    if (!state.filtered.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = state.people.length ? "No matching records" : "No records";
      els.peopleList.append(empty);
      updateSelectedCount();
      return;
    }

    const disabled = state.mode === "manual";
    for (const person of state.filtered) {
      const row = document.createElement("label");
      row.className = "person-row";
      row.setAttribute("role", "listitem");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = person.selected;
      checkbox.disabled = disabled;
      checkbox.addEventListener("change", () => {
        person.selected = checkbox.checked;
        const selected = selectedPeople();
        if (selected.length === 1) setEditor(selected[0]);
        updateSelectedCount();
      });

      const text = document.createElement("span");
      text.textContent = `${person.Name} | ${person["Roll No"]} | ${person.Class}`;

      row.append(checkbox, text);
      els.peopleList.append(row);
    }
    updateSelectedCount();
  }

  function updateModeUI() {
    state.mode = getMode();
    const manual = state.mode === "manual";
    [els.manualName, els.manualRoll, els.manualClass].forEach((input) => { input.disabled = !manual; });
    [els.personName, els.personRoll, els.personClass].forEach((input) => { input.disabled = manual; });
    ["#addPerson", "#updatePerson", "#deletePerson", "#selectVisible", "#clearAll", "#sortName", "#exportPeople"]
      .forEach((selector) => { $(selector).disabled = manual; });
    $("#importPeople").disabled = manual;
    $(".file-button").classList.toggle("disabled", manual);
    els.manualHint.hidden = true;
    els.peopleHint.hidden = true;
    renderPeople();
  }

  function addPerson() {
    const person = personFromEditor();
    if (!person.Name || !person["Roll No"] || !person.Class) return;
    state.people.push(person);
    savePeople();
    setEditor(null);
    applySearch();
  }

  function updatePerson() {
    const selected = selectedPeople();
    if (!selected.length) {
      showMessage("No Selection", "Please select a record to update.");
      return;
    }
    if (selected.length !== 1) {
      showMessage("Multiple Selection", "Select only one record to update.");
      return;
    }
    const next = personFromEditor();
    selected[0].Name = next.Name;
    selected[0]["Roll No"] = next["Roll No"];
    selected[0].Class = next.Class;
    savePeople();
    applySearch();
  }

  async function deletePerson() {
    const selected = selectedPeople();
    if (!selected.length) {
      showMessage("No Selection", "Please select at least one record to delete.");
      return;
    }
    const ok = await confirmMessage("Confirm Delete", `Delete ${selected.length} selected record(s)?`);
    if (!ok) return;
    state.people = state.people.filter((person) => !person.selected);
    savePeople();
    setEditor(null);
    applySearch();
  }

  function selectVisible() {
    for (const person of state.filtered) person.selected = true;
    renderPeople();
  }

  function clearAll() {
    for (const person of state.people) person.selected = false;
    setEditor(null);
    renderPeople();
  }

  function sortByName() {
    state.people.sort((a, b) => a.Name.localeCompare(b.Name, undefined, { sensitivity: "base" }));
    applySearch();
  }

  function exportPeople() {
    const blob = new Blob([localStorage.getItem(STORAGE_KEY) || "[]"], { type: "application/json" });
    downloadBlob(blob, "people.json");
  }

  async function importPeople(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data)) throw new Error("Invalid database");
      state.people = data.map((person) => ({
        Name: String(person.Name || "").trim(),
        "Roll No": String(person["Roll No"] || "").trim(),
        Class: String(person.Class || "").trim(),
        selected: false
      })).filter((person) => person.Name && person["Roll No"] && person.Class);
      savePeople();
      applySearch();
      setStatus(`Imported ${state.people.length} record(s).`);
    } catch {
      showMessage("Import Failed", "Choose a valid people.json file.");
    } finally {
      event.target.value = "";
    }
  }

  function setFiles(files) {
    state.files = Array.from(files).filter((file) => /\.(c|txt)$/i.test(file.name));
    renderFiles();
  }

  function clearFiles() {
    state.files = [];
    els.fileInput.value = "";
    renderFiles();
    setStatus("");
  }

  function removeFile(index) {
    state.files.splice(index, 1);
    els.fileInput.value = "";
    renderFiles();
    setStatus("");
  }

  function renderFiles() {
    els.fileList.innerHTML = "";
    els.fileCount.textContent = state.files.length
      ? `${state.files.length} file(s) selected`
      : "No files selected";
    els.clearFiles.disabled = !state.files.length;

    state.files.forEach((file, index) => {
      const row = document.createElement("div");
      row.className = "file-item";
      const size = `${Math.max(1, Math.round(file.size / 1024))} KB`;
      const details = document.createElement("div");
      details.className = "file-details";
      const name = document.createElement("span");
      const meta = document.createElement("strong");
      const remove = document.createElement("button");

      name.textContent = file.name;
      meta.textContent = size;
      remove.type = "button";
      remove.className = "danger small-button";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => removeFile(index));

      details.append(name, meta);
      row.append(details, remove);
      els.fileList.append(row);
    });
  }

  function baseName(filename) {
    return filename.replace(/\.[^.]*$/, "");
  }

  function buildHeader(person, program) {
    const sep = "-".repeat(50);
    const body =
      `Name        : ${person.Name}\n` +
      `Roll No     : ${person["Roll No"]}\n` +
      `Class       : ${person.Class}\n` +
      `Program     : ${program}\n` +
      `${sep}\n`;
    return getHeaderStyle() === "comment" ? `/*\n${body}*/\n\n` : `${body}\n`;
  }

  function outputName(file, person, usedNames) {
    const suffix = $("#nameSuffix").checked ? `_${person.Name.replace(/\W+/g, "")}` : "";
    const extension = getExportType();
    const wanted = `${baseName(file.name)}${suffix}.${extension}`;
    if (!usedNames.has(wanted)) {
      usedNames.add(wanted);
      return wanted;
    }
    let index = 2;
    let next = `${baseName(file.name)}${suffix}_${index}.${extension}`;
    while (usedNames.has(next)) {
      index += 1;
      next = `${baseName(file.name)}${suffix}_${index}.${extension}`;
    }
    usedNames.add(next);
    return next;
  }

  async function exportFiles() {
    setStatus("");
    if (!state.files.length) {
      showMessage("No Files Selected", "Please select at least one .c or .txt source file before exporting.");
      return;
    }

    const people = state.mode === "manual" ? [manualPerson()] : selectedPeople();
    if (!people.length) {
      showMessage("No Selection", "Please select at least one record to export.");
      return;
    }
    if (people.some((person) => !person.Name || !person["Roll No"] || !person.Class)) {
      showMessage("Missing Details", "Name, Roll No, and Class are required.");
      return;
    }

    const usedNames = new Set();
    const entries = [];
    for (const person of people) {
      for (const file of state.files) {
        const program = baseName(file.name);
        const content = await file.text();
        entries.push({
          name: outputName(file, person, usedNames),
          data: encoder.encode(buildHeader(person, program) + content)
        });
      }
    }

    const zipBlob = makeZip(entries);
    downloadBlob(zipBlob, "header_export.zip");
    setStatus(`Exported ${entries.length} file(s).`);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function makeCrcTable() {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let value = i;
      for (let j = 0; j < 8; j += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      table[i] = value >>> 0;
    }
    return table;
  }

  const crcTable = makeCrcTable();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function dosTime(date) {
    return ((date.getHours() & 31) << 11) | ((date.getMinutes() & 63) << 5) | ((date.getSeconds() / 2) & 31);
  }

  function dosDate(date) {
    return (((date.getFullYear() - 1980) & 127) << 9) | (((date.getMonth() + 1) & 15) << 5) | (date.getDate() & 31);
  }

  function u16(value) {
    return [value & 255, (value >>> 8) & 255];
  }

  function u32(value) {
    return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
  }

  function makeZip(entries) {
    const now = new Date();
    const chunks = [];
    const central = [];
    let offset = 0;

    for (const entry of entries) {
      const name = encoder.encode(entry.name);
      const data = entry.data;
      const crc = crc32(data);
      const common = [
        ...u16(20), ...u16(0), ...u16(0), ...u16(dosTime(now)), ...u16(dosDate(now)),
        ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0)
      ];
      const local = new Uint8Array([...u32(0x04034b50), ...common, ...name]);
      chunks.push(local, data);
      central.push(new Uint8Array([
        ...u32(0x02014b50), ...u16(20), ...common, ...u16(0), ...u16(0), ...u16(0),
        ...u16(0), ...u16(0), ...u32(offset), ...name
      ]));
      offset += local.length + data.length;
    }

    const centralOffset = offset;
    let centralSize = 0;
    for (const chunk of central) {
      centralSize += chunk.length;
      chunks.push(chunk);
    }

    chunks.push(new Uint8Array([
      ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length),
      ...u32(centralSize), ...u32(centralOffset), ...u16(0)
    ]));

    return new Blob(chunks, { type: "application/zip" });
  }

  function bindEvents() {
    $$("input[name='mode']").forEach((radio) => radio.addEventListener("change", updateModeUI));
    $("#addPerson").addEventListener("click", addPerson);
    $("#updatePerson").addEventListener("click", updatePerson);
    $("#deletePerson").addEventListener("click", deletePerson);
    $("#selectVisible").addEventListener("click", selectVisible);
    $("#clearAll").addEventListener("click", clearAll);
    $("#sortName").addEventListener("click", sortByName);
    $("#exportPeople").addEventListener("click", exportPeople);
    $("#importPeople").addEventListener("change", importPeople);
    $("#exportFiles").addEventListener("click", exportFiles);
    els.clearFiles.addEventListener("click", clearFiles);
    els.manualPanel.addEventListener("pointerdown", () => {
      if (state.mode !== "manual") showModeHint("manual");
    }, true);
    els.peoplePanel.addEventListener("pointerdown", () => {
      if (state.mode === "manual") showModeHint("people");
    }, true);
    els.searchBox.addEventListener("input", applySearch);
    els.fileInput.addEventListener("change", (event) => setFiles(event.target.files));

    ["dragenter", "dragover"].forEach((name) => {
      els.dropZone.addEventListener(name, (event) => {
        event.preventDefault();
        els.dropZone.classList.add("dragging");
      });
    });
    ["dragleave", "drop"].forEach((name) => {
      els.dropZone.addEventListener(name, () => els.dropZone.classList.remove("dragging"));
    });
    els.dropZone.addEventListener("drop", (event) => {
      event.preventDefault();
      setFiles(event.dataTransfer.files);
    });
  }

  readPeople();
  bindEvents();
  applySearch();
  updateModeUI();
}());
