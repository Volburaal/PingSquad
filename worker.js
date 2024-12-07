// const server = "https://pingsquad.onrender.com/";
const server = "http://127.0.0.1:3000/";
let socket;
const chatBox = document.getElementById('chatbox');
const message = document.getElementById('msgInput');
const sendButton = document.getElementById('sendBtn');
var lastpeer = '';
let Peername = '';
let mapOpeers = new Map();

function initSocketConnection() {
  socket = io(server, {
    query: { name: Peername }  // Send the name as a query parameter during connection
  });
  socket.on('peerJoined', (peerId) => {
    const peerDiv = document.createElement('div');
    peerDiv.classList.add('peer_joined');
    peerDiv.textContent = `+ ${peerId} has joined the chat.`;
    chatBox.appendChild(peerDiv);
    lastpeer = '';
  });

  socket.on('peerLeft', (peerId) => {
    const peerDiv = document.createElement('div');
    peerDiv.classList.add('peer_left');
    peerDiv.textContent = `- ${peerId} has left the chat.`;
    chatBox.appendChild(peerDiv);
    lastpeer = '';
  });

  socket.on('mapUpdate', (peersArray) => {
    mapOpeers = new Map(peersArray);
    mapOpeers.delete(socket.id);

    const dmList = document.getElementById('dm_list');
    dmList.querySelectorAll('button').forEach(button => {
        if (button.id !== 'everyone') {
            dmList.removeChild(button);
        }
    });

    mapOpeers.forEach((peerName, socketID) => {
        const peerButton = document.createElement('button');
        peerButton.id = `dm_${socketID}`;
        peerButton.textContent = peerName;
        peerButton.onclick = () => buildConnection(socketID);
        dmList.appendChild(peerButton);
    });

    console.log('Updated peers:', mapOpeers);
  });

  socket.on('nameplate', (peer) => {
    const peername = peer.slice(0,20);
    const actualname = peer.slice(20);
    console.log("Received from: ", actualname);
    if (peername != lastpeer) {
      lastpeer = peername;
      const peerDiv = document.createElement('div');
      peerDiv.innerHTML = actualname;
      peerDiv.classList.add('nameplate');
      chatBox.appendChild(peerDiv);
    }
  });

  socket.on('chatMessage', ({ sk: peername, msg }) => {
    const msgElement = document.createElement('div');
    msgElement.innerHTML = msg.replace(/\n/g, '<br>');
    msgElement.classList.add('msg_other');
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  socket.on('file-received', ({ sk: peername, name, type, size, content }) => {
    console.log(`Received file from ${peername}: ${name}`);
    const filePayload = { name, type, size, content };
    appendFilePreview(filePayload, false);
  });

  socket.on('sentImg', ({ sk: peername, src }) => {
    const uint8Array = new Uint8Array(src.content);
    const blob = new Blob([uint8Array], { type: src.type || 'image/png' });
    const url = (window.URL || window.webkitURL).createObjectURL(blob);
    const img = document.createElement('img');
    img.src = url;
    img.width = 200;
    img.height = 200;
    img.classList.add('chat-image-other');
    chatBox.appendChild(img);
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

function send() {
  console.log("Message sent");
  const msg = message.value;
  if (msg) {
    socket.emit('peername', socket.id + Peername);
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

function appendFilePreview(filePayload, isSender) {
  const { name, type, content } = filePayload;

  const uint8Array = new Uint8Array(content);
  const blob = new Blob([uint8Array], { type });
  const url = (window.URL || window.webkitURL).createObjectURL(blob);

  if (type.startsWith('image/')){
     const guy = isSender ? 'you' : 'other';
      showImage(url, guy);
      return;
  }

  const fileDiv = document.createElement('div');
  fileDiv.classList.add(isSender ? 'file-you' : 'file-other');

  const fileNameElement = document.createElement('div');
  fileNameElement.textContent = name;
  fileDiv.appendChild(fileNameElement);

  const buttonsDiv = document.createElement('div');
  buttonsDiv.classList.add('file-buttons');

  if (type.startsWith('image/') || type.startsWith('text/')) {
    console.log("File gotten good")
    const previewButton = document.createElement('button');
    previewButton.textContent = 'Preview';
    previewButton.addEventListener('click', () => {
      if (type.startsWith('text/')) {
        console.log("TEXT")
        const reader = new FileReader();
        reader.onload = () => {
          alert(reader.result);
        };
        reader.readAsText(blob);
      }
    });
    buttonsDiv.appendChild(previewButton);
  }

  const downloadButton = document.createElement('button');
  downloadButton.textContent = 'Download';
  downloadButton.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  });
  buttonsDiv.appendChild(downloadButton);

  fileDiv.appendChild(buttonsDiv);

  chatBox.appendChild(fileDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showImage(url, guy){
  const img = document.createElement('img');
  img.src = url;
  img.width = 200;
  img.height = 200;
  console.log("appending chat-image-"+guy);
  img.classList.add('chat-image-'+guy);
  chatBox.appendChild(img);
  chatBox.scrollTop = chatBox.scrollHeight;
}


document.querySelector("#fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const fr = new FileReader();
  fr.onload = () => {
    const arrayBuffer = fr.result;
    const uint8Array = new Uint8Array(arrayBuffer);
    const payload = {
      name: file.name,
      type: file.type,
      size: file.size,
      content: Array.from(uint8Array),
    };
    socket.emit('peername', socket.id + Peername);
    socket.emit('file-data', payload);
    console.log("Sent file:", payload);

    appendFilePreview(payload, true);
  };
  fr.readAsArrayBuffer(file);
});

function setname() {
  const nameIn = document.getElementById("nameInput");
  Peername = nameIn.value;
  console.log(Peername);
  const overlay = document.getElementById("login-overlay")
  overlay.style.display = "none";
  initSocketConnection();
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

function showImageInModal(url) {
  const modalOverlay = document.createElement('div');
  modalOverlay.classList.add('modal-overlay');

  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');

  const img = document.createElement('img');
  img.src = url;
  img.classList.add('preview-image');

  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.classList.add('preview-image-close');
  closeButton.addEventListener('click', () => {
    modalContent.removeChild(closeButton);
    modalContent.removeChild(img);
    modalOverlay.removeChild(modalContent);
    document.body.removeChild(modalOverlay);
  });

  modalContent.appendChild(closeButton);
  modalContent.appendChild(img);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);
}

window.addEventListener('beforeunload', () => {
  socket.emit('disconnecting', Peername);
});