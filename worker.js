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
    query: { name: Peername }
  });

  socket.on('peerJoined', (peerName) => {
    const peerDiv = document.createElement('div');
    peerDiv.classList.add('peer_joined');
    peerDiv.textContent = `+ ${peerName} has joined the chat.`;
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

  socket.on('nameplate', ({ Peername: actualname, id: peername }) => {
    if (peername != lastpeer) {
      lastpeer = peername;
      const peerDiv = document.createElement('div');
      peerDiv.innerHTML = actualname;
      peerDiv.classList.add('nameplate');
      chatBox.appendChild(peerDiv);
    }
  });

  socket.on('chatMessage', ({ id: id, msg }) => {
    const msgElement = document.createElement('div');
    msgElement.innerHTML = msg.replace(/\n/g, '<br>');
    msgElement.classList.add('msg_other');
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  socket.on('file-received', ({ id, name, type, size, content }) => {
    console.log(`Received file from ${id}: ${name}`);
    const filePayload = { name, type, size, content };
    appendFilePreview(filePayload, false);
  });

  document.querySelector("#fileInput").addEventListener("change", function (e) {
    const CHUNK_SIZE = 1024 * 512; // 512 KB per chunk
    const file = e.target.files[0];
    if (!file) return;
  
    let offset = 0; // Current position in the file
    const fr = new FileReader();
  
    // Read and send the next chunk
    const readNextChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      fr.readAsArrayBuffer(slice);
    };
  
    fr.onload = () => {
      const arrayBuffer = fr.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      const chunk = Array.from(uint8Array);
  
      // Send the current chunk
      socket.emit('file-chunk', {
        name: file.name,
        type: file.type,
        size: file.size,
        chunk,
        offset,
      });
  
      console.log(`Chunk sent: Offset ${offset} - Size ${chunk.length}`);
  
      offset += CHUNK_SIZE;
  
      // Read the next chunk if the file isn't fully sent
      if (offset < file.size) {
        readNextChunk();
      } else {
        // Notify the server that file transfer is complete
        socket.emit('file-complete', { name: file.name, size: file.size });
        console.log("File transfer complete");
      }
    };
  
    // Start reading chunks
    readNextChunk();
  });

  socket.on('file-chunk', ({ id, name, type, size, chunk, offset }) => {
    if (!window.fileChunks) {
      window.fileChunks = {};
    }

    if (!window.fileChunks[id]) {
      window.fileChunks[id] = { name, type, size, chunks: [] };
    }

    // Add the received chunk
    window.fileChunks[id].chunks.push(chunk);

    const receivedSize = window.fileChunks[id].chunks.reduce((total, c) => total + c.length, 0);
    console.log(`Received chunk: Offset ${offset} - Total received ${receivedSize} / ${size}`);

    // If all chunks are received, reassemble the file
    if (receivedSize >= size) {
      const fileContent = new Uint8Array(size);
      let position = 0;

      window.fileChunks[id].chunks.forEach(chunkArray => {
        fileContent.set(chunkArray, position);
        position += chunkArray.length;
      });

      // Create a file preview
      const filePayload = { name, type, size, content: Array.from(fileContent) };
      appendFilePreview(filePayload, false);

      // Clean up
      delete window.fileChunks[id];
      console.log(`File ${name} reassembled successfully`);
    }
  });

  socket.on('file-complete', ({ name }) => {
    console.log(`File transfer complete: ${name}`);
  });
};

function send() {
  const msg = message.value;
  if (msg) {
    socket.emit('peername', { id: socket.id, Peername });
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

  if (type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '500px';
    img.style.height = 'auto';
    img.classList.add(isSender ? 'chat-image-you' : 'chat-image-other');
    chatBox.appendChild(img);
  } else {
    const fileDiv = document.createElement('div');
    fileDiv.classList.add(isSender ? 'file-you' : 'file-other');

    const fileNameElement = document.createElement('div');
    fileNameElement.textContent = name;
    fileDiv.appendChild(fileNameElement);

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download';
    downloadButton.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
    });
    fileDiv.appendChild(downloadButton);

    chatBox.appendChild(fileDiv);
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

document.querySelector("#fileInput").addEventListener("change", function (e) {
  const CHUNK_SIZE = 1024 * 512; // 512 KB per chunk
  const file = e.target.files[0];
  if (!file) return;

  let offset = 0; // Current position in the file
  const fr = new FileReader();

  const readNextChunk = () => {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    fr.readAsArrayBuffer(slice);
  };

  fr.onload = () => {
    const arrayBuffer = fr.result;
    const uint8Array = new Uint8Array(arrayBuffer);
    const chunk = Array.from(uint8Array);

    // Emit the current chunk
    socket.emit('file-chunk', {
      name: file.name,
      type: file.type,
      size: file.size,
      chunk,
      offset,
    });

    document.querySelector("#fileInput").addEventListener("change", function (e) {
      const CHUNK_SIZE = 1024 * 512; // 512KB per chunk
    
      const file = e.target.files[0];
      if (!file) return;
      
      let offset = 0; // Start reading at the beginning of the file
      const fr = new FileReader();
      
      fr.onload = () => {
          const arrayBuffer = fr.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          const chunk = Array.from(uint8Array);
      
          const payload = {
              name: file.name,
              type: file.type,
              size: file.size,
              chunk, // Current chunk data
              offset, // Offset for tracking progress
          };
      
          // Send the chunk to the server
        socket.emit('file-chunk', payload);
        console.log("Sent file:", payload);
      
          offset += CHUNK_SIZE; // Move to the next chunk
          if (offset < file.size) {
              readNextChunk(); // Continue reading
          } else {
              // Notify server that file transfer is complete
              socket.emit('file-complete', { name: file.name, size: file.size });
              console.log("File transfer complete:", file.name);
              appendFilePreview(payload, true);
    
          }
      };
      
      const readNextChunk = () => {
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          fr.readAsArrayBuffer(slice);
      };
      
      // Start the chunking process
      socket.emit('peername', { id: socket.id, Peername });
      readNextChunk();
    
    });

    console.log(`Chunk sent: Offset ${offset} - Size ${chunk.length}`);

    offset += CHUNK_SIZE;

    // Read the next chunk if the file isn't fully sent
    if (offset < file.size) {
      readNextChunk();
    } else {
      // Notify the server that file transfer is complete
      socket.emit('file-complete', { name: file.name, size: file.size });
      console.log("File transfer complete");
    }
  };

  // Start reading chunks
  readNextChunk();
});


function setname() {
  const nameIn = document.getElementById("nameInput");
  Peername = nameIn.value;
  const overlay = document.getElementById("login-overlay");
  overlay.style.display = "none";
  initSocketConnection();
}
