const agentList = document.querySelector('#agent-list');
const agentCount = document.querySelector('#agent-count');
const selectedName = document.querySelector('#selected-name');
const selectedDescription = document.querySelector('#selected-description');
const selectedAvatar = document.querySelector('#selected-avatar');
const messages = document.querySelector('#messages');
const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const dialog = document.querySelector('#create-dialog');
const createForm = document.querySelector('#create-form');
let agents = [];
let selectedAgent = null;

function initials(name) {
  return (name || 'A').trim().slice(0, 1).toUpperCase();
}

function renderAgents() {
  agentCount.textContent = agents.length;
  agentList.innerHTML = agents.map((agent) => `
    <button class="agent-row ${selectedAgent?.id === agent.id ? 'selected' : ''}" data-agent-id="${agent.id}">
      <span class="agent-avatar small">${initials(agent.name)}</span>
      <span class="agent-copy"><strong>${agent.name}</strong><small>${agent.description}</small></span>
      <span class="status-dot"></span>
    </button>`).join('');
  agentList.querySelectorAll('[data-agent-id]').forEach((row) => row.addEventListener('click', () => selectAgent(row.dataset.agentId)));
}

function selectAgent(id) {
  selectedAgent = agents.find((agent) => agent.id === id) || null;
  if (!selectedAgent) return;
  selectedName.textContent = selectedAgent.name;
  selectedDescription.textContent = selectedAgent.description;
  selectedAvatar.textContent = initials(selectedAgent.name);
  messages.innerHTML = `<div class="welcome-message"><span class="agent-avatar">${initials(selectedAgent.name)}</span><div><strong>${selectedAgent.name} 已准备就绪</strong><p>告诉我你想完成什么，我会根据当前角色开始工作。</p></div></div>`;
  renderAgents();
  chatInput.focus();
}

function addMessage(text, type) {
  const item = document.createElement('div');
  item.className = `message ${type}`;
  item.textContent = text;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

async function loadAgents() {
  const response = await fetch('/api/agents');
  const data = await response.json();
  agents = data.agents;
  renderAgents();
  if (!selectedAgent && agents[0]) selectAgent(agents[0].id);
}

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message || !selectedAgent) return;
  addMessage(message, 'user-message');
  chatInput.value = '';
  const response = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ agentId: selectedAgent.id, message }) });
  const data = await response.json();
  addMessage(data.reply || data.error, 'assistant-message');
});

document.querySelector('#open-create').addEventListener('click', () => dialog.showModal());
document.querySelector('#refresh-agents').addEventListener('click', loadAgents);
createForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(createForm);
  const response = await fetch('/api/agents', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(formData)) });
  if (!response.ok) return;
  const data = await response.json();
  agents = [data.agent, ...agents];
  createForm.reset();
  dialog.close();
  selectAgent(data.agent.id);
});

loadAgents();
