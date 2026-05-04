const form = document.getElementById("uploadForm");
const uploadPersonNameEl = document.getElementById("uploadPersonName");
const photoEl = document.getElementById("photoFile");
const resultEl = document.getElementById("result");
const newPersonNameEl = document.getElementById("newPersonName");
const addPersonBtn = document.getElementById("addPersonBtn");

const urlParams = new URLSearchParams(window.location.search || "");
const prefillName = (urlParams.get("name") || "").trim();
if (prefillName) {
  uploadPersonNameEl.value = prefillName;
}

async function getOrCreatePersonIdByName(name) {
  const normalizedName = String(name || "").trim();
  if (!normalizedName) {
    throw new Error("Please enter a person name.");
  }

  const listResponse = await fetch("/api/persons");
  const persons = await listResponse.json();
  if (!listResponse.ok) {
    throw new Error(persons.error || "Could not load persons");
  }

  const existing = Array.isArray(persons)
    ? persons.find((person) => String(person.name || "").toLowerCase() === normalizedName.toLowerCase())
    : null;
  if (existing && existing.id) {
    return existing.id;
  }

  const createResponse = await fetch("/api/persons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: normalizedName })
  });
  const created = await createResponse.json();
  if (!createResponse.ok) {
    throw new Error(created.error || "Failed to create person");
  }
  return created.id;
}

async function addPerson() {
  const name = (newPersonNameEl.value || "").trim();
  if (!name) {
    resultEl.textContent = "Enter person name before adding.";
    return;
  }
  addPersonBtn.disabled = true;
  resultEl.textContent = "Adding person...";
  try {
    const response = await fetch("/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to add person");
    }
    resultEl.textContent = `Added person: ${data.name} (id: ${data.id})`;
    newPersonNameEl.value = "";
    uploadPersonNameEl.value = data.name || "";
  } catch (err) {
    resultEl.textContent = "Add person failed: " + err.message;
  } finally {
    addPersonBtn.disabled = false;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const uploadPersonName = String(uploadPersonNameEl.value || "").trim();
  const files = photoEl.files ? Array.from(photoEl.files) : [];
  if (files.length === 0) {
    resultEl.textContent = "Please select one or more photo files.";
    return;
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("photo", file);
  }
  resultEl.textContent = `Uploading ${files.length} file(s)...`;
  try {
    const personId = await getOrCreatePersonIdByName(uploadPersonName);
    const response = await fetch(`/api/persons/${personId}/photo`, {
      method: "POST",
      body: formData
    });
    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      data = { error: "Invalid server response" };
    }
    resultEl.textContent = JSON.stringify(data, null, 2);
    if (!response.ok) {
      resultEl.textContent = `HTTP ${response.status}\n` + resultEl.textContent;
    }
  } catch (err) {
    resultEl.textContent = "Upload failed: " + err.message + ". Check if app is running at http://127.0.0.1:5000";
  }
});

addPersonBtn.addEventListener("click", addPerson);

