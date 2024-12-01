const server = "https://pingsquad.onrender.com/";
// const server = "http://127.0.0.1:3000/";
const socket = io(server);
const chatBox = document.getElementById('chatbox');
const message = document.getElementById('msgInput');
const sendButton = document.getElementById('sendBtn');
var lastpeer = '';
var Peername = '';

socket.on('peerJoined', (peerId) => {
  const peerDiv = document.createElement('div');
  peerDiv.classList.add('peer_joined');
  peerDiv.textContent = `+ ${peerId} has joined the chat.`;
  chatBox.appendChild(peerDiv);
  lastpeer = '';
});

socket.on('nameplate', (peer) => {
  const peername = peer.slice(0,20);
  const actualname = peer.slice(20);
  console.log("recieved from: ",actualname);
  if (peername != lastpeer) {
    lastpeer = peername;
    const peer = document.createElement('div');
    peer.innerHTML = actualname;
    peer.classList.add('nameplate');
    chatBox.appendChild(peer);
  }
});

socket.on('peerLeft', (peerId) => {
  const peerDiv = document.createElement('div');
  peerDiv.classList.add('peer_left');
  peerDiv.textContent = `- ${peerId} has left the chat.`;
  chatBox.appendChild(peerDiv);
  lastpeer = '';
});

socket.on('chatMessage', ({ sk: peername, msg }) => {
  const msgElement = document.createElement('div');
  msgElement.innerHTML = msg.replace(/\n/g, '<br>');
  msgElement.classList.add('msg_other');
  chatBox.appendChild(msgElement);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('sentImg', ({ sk:peername, src }) => {
  const uint8Array = new Uint8Array(src.content);
  const blob = new Blob([uint8Array], { type: 'image/png' });
  const url = (window.URL || window.webkitURL).createObjectURL(blob);
  const img = document.createElement('img');
  img.src = url;
  img.width = 200;
  img.height = 200;
  img.classList.add('chat-image-other');
  chatBox.appendChild(img);
  chatBox.scrollTop = chatBox.scrollHeight;
});

function send() {
  console.log("Message sent");
  const msg = message.value;
  if (msg) {
    socket.emit('peername', socket.id+Peername);
    socket.emit('chatMessage', msg);
    const msgElement = document.createElement('div');
    msgElement.innerHTML = msg.replace(/\n/g, '<br>');
    msgElement.classList.add('msg_you');
    chatBox.appendChild(msgElement);

    message.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
    lastpeer = '';
  }
}

document.querySelector("#fileInput").addEventListener("change", function (e) {
  const fr = new FileReader();
  fr.onload = () => {
    const arrayBuffer = fr.result;
    const uint8Array = new Uint8Array(arrayBuffer);
    const payload = {
      content: Array.from(uint8Array),
    };
    socket.emit('peername', socket.id+Peername);
    socket.emit('image-data', payload);
    console.log("Sent image:", payload);
    const blob = new Blob([uint8Array], { type: 'image/png' });
    const url = (window.URL || window.webkitURL).createObjectURL(blob);
    const img = document.createElement('img');
    img.src = url;
    img.width = 200;
    img.height = 200;
    img.classList.add('chat-image-you');
    chatBox.appendChild(img);
    chatBox.scrollTop = chatBox.scrollHeight;
  };
  fr.readAsArrayBuffer(e.target.files[0]);
});

function setname() {
  const nameIn = document.getElementById("nameInput");
  Peername = nameIn.value;
  console.log(Peername);
  const overlay = document.getElementById("login-overlay")
  overlay.style.display="none";
}

message.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendButton.click();
  }
  if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault();
    message.value += '\n';
  }
});