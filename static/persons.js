const contentEl = document.getElementById("content");
const searchInputEl = document.getElementById("searchInput");
let allPersons = [];

function renderPersons(persons) {
  if (!Array.isArray(persons) || persons.length === 0) {
    contentEl.textContent = "No matching people found.";
    return;
  }

  const rows = persons.map((person) => `
    <tr>
      <td>${person.id ?? ""}</td>
      <td>${person.name ?? ""}</td>
      <td>${Number(person.photo_count ?? 0)}</td>
      <td>${person.created_at ?? ""}</td>
      <td><a class="btn" href="/upload?name=${encodeURIComponent(person.name ?? "")}">Add Photos</a></td>
    </tr>
  `).join("");

  contentEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Photo Count</th>
          <th>Created At</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function applySearch() {
  const query = String(searchInputEl.value || "").trim().toLowerCase();
  if (!query) {
    renderPersons(allPersons);
    return;
  }
  const filtered = allPersons.filter((person) => {
    const name = String(person.name || "").toLowerCase();
    const idText = String(person.id || "");
    return name.includes(query) || idText.includes(query);
  });
  renderPersons(filtered);
}

async function loadPersons() {
  try {
    const response = await fetch("/api/persons");
    const persons = await response.json();
    if (!response.ok) {
      throw new Error(persons.error || "Unable to load persons");
    }
    if (!Array.isArray(persons) || persons.length === 0) {
      contentEl.textContent = "No registered people found.";
      return;
    }
    allPersons = persons;
    applySearch();
  } catch (err) {
    contentEl.textContent = "Failed to load registered people: " + err.message;
  }
}

searchInputEl.addEventListener("input", applySearch);
loadPersons();

