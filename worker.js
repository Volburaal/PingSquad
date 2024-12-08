// const server = "https://pingsquad.onrender.com/";
const server = "http://127.0.0.1:3000/";
let socket;
const chatBox = document.getElementById('chatbox');
const message = document.getElementById('msgInput');
const nameInpot = document.getElementById('nameInput');
const sendButton = document.getElementById('sendBtn');
var lastpeer = '';
let Peername = '';
var nameset = false;
let mapOpeers = new Map();

function initSocketConnection() {
  socket = io(server, {
    query: { name: Peername }
  });
  socket.on('peerJoined', ({id, peerName}) => {
    const peerDiv = document.createElement('div');
    peerDiv.classList.add('peer_joined');
    peerDiv.textContent = `+ ${peerName} has joined the chat.`;
    chatBox.appendChild(peerDiv);
    lastpeer = '';

    const chats = document.getElementById('chats');
    const peerChat = document.createElement('div');
    peerChat.id = `dm_chat_${id}`;
    peerChat.classList.add('chatbox');
    peerChat.style.display = 'none';
    chats.appendChild(peerChat);
    console.log(mapOpeers)
  });

  socket.on('peerLeft', ({id, peerName}) => {
    const peerDiv = document.createElement('div');
    console.log(peerName)
    peerDiv.classList.add('peer_left');
    peerDiv.textContent = `- ${peerName} has left the chat.`;
    chatBox.appendChild(peerDiv);
    lastpeer = '';

    const peerChat = document.getElementById(`dm_chat_${id}`);
    if(window.getComputedStyle(peerChat).display == 'flex'){
      document.getElementById('everyone').click();
    } 
    peerChat.style.display = 'none';
  });

  socket.on('loadPast', (peersArray) => {
    pastMap = new Map(peersArray);
    pastMap.delete(socket.id);
    const chats = document.getElementById('chats');
    pastMap.forEach((peerName, socketID) => {
      const peerChat = document.createElement('div');
      peerChat.id = `dm_chat_${socketID}`;
      peerChat.classList.add('chatbox');
      peerChat.style.display = 'none';
      chats.appendChild(peerChat);
    });
  });

  socket.on('mapUpdate', (peersArray) => {

    mapOpeers = new Map(peersArray);
    mapOpeers.delete(socket.id);

    const dmList = document.getElementById('dm_list');
    let unread = [];
    dmList.querySelectorAll('button').forEach(button => {
        if (button.id !== 'everyone') {
          if (window.getComputedStyle(button).backgroundColor == 'rgb(187, 44, 69)'){
            unread.push(button.id);
          }
          dmList.removeChild(button);
        }
    });
    console.log(unread);

    mapOpeers.forEach((peerName, socketID) => {
        const peerButton = document.createElement('button');
        peerButton.id = `dm_${socketID}`;
        peerButton.textContent = peerName;
        peerButton.onclick = () => buildConnection(socketID);
        if (unread.includes(`dm_${socketID}`)){
          peerButton.style.backgroundColor = '#bb2c45';
        }
        dmList.appendChild(peerButton);
    });

    console.log('Updated peers:', mapOpeers);
  });

  socket.on('nameplate', ( { Peername: actualname, id: peername}) => {
    console.log("Received from: ", actualname);
    if (peername != lastpeer) {
      lastpeer = peername;
      const peerDiv = document.createElement('div');
      peerDiv.innerHTML = actualname;
      peerDiv.classList.add('nameplate');
      chatBox.appendChild(peerDiv);
    }
  });

  socket.on('chatMessage', ({ id, msg, type }) => {

    const msgElement = document.createElement('div');
    msgElement.innerHTML = msg.replace(/\n/g, '<br>');
    msgElement.classList.add('msg_other');
    console.log(`message sent from ${id} to ${type}`)

    if (type === 'chatbox'){
      if (window.getComputedStyle(document.getElementById('everyone')).backgroundColor != 'rgb(77, 7, 99)'){
        document.getElementById('everyone').style.backgroundColor='#bb2c45';
      }
      chatBox.appendChild(msgElement);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
    else if (socket.id === type.slice(8)) {
      if (window.getComputedStyle(document.getElementById(`dm_${id}`)).backgroundColor != 'rgb(56, 56, 56)'){
        document.getElementById(`dm_${id}`).style.backgroundColor='#bb2c45';
      }
      console.log(`message sent from ${id} to ${type.slice(8)}`)
      const peerChat = document.getElementById(`dm_chat_${id}`);
      peerChat.appendChild(msgElement);
      peerChat.scrollTop = chatBox.scrollHeight;
    }
  });

  socket.on('file-received', (payload) => {
    console.log(`Received file from ${payload.id}: ${payload.name}`);
    appendFilePreview(payload, false);
  });
}

function send() {
  console.log("Message sent");
  const msg = message.value;

  let type = 'chatbox';

  if (msg) {
    const msgElement = document.createElement('div');
    msgElement.innerHTML = msg.replace(/\n/g, '<br>');
    msgElement.classList.add('msg_you');
    document.querySelectorAll('.chatbox').forEach(chatbox => {
      const style = window.getComputedStyle(chatbox);
      if (style.display === 'flex') {
        type = chatbox.id;
        chatbox.appendChild(msgElement);
      }
    });
    if (type === 'chatbox'){
      chatBox.appendChild(msgElement);
      socket.emit('peername', { id : socket.id, Peername});
    }
    socket.emit('chatMessage', {msg, type});
    message.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
    lastpeer = '';
  }
}


function appendFilePreview(filePayload, isSender) {
  const {id, name, type, content, destID } = filePayload;

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

  console.log(destID)

  if (destID === 'chatbox'){
    if (window.getComputedStyle(document.getElementById('everyone')).backgroundColor != 'rgb(77, 7, 99)'){
      document.getElementById('everyone').style.backgroundColor='#bb2c45';
    }
    chatBox.appendChild(fileDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  else if (socket.id === destID.slice(8)) {
    console.log('yes')

    if (window.getComputedStyle(document.getElementById(`dm_${id}`)).backgroundColor != 'rgb(56, 56, 56)'){
      document.getElementById(`dm_${id}`).style.backgroundColor='#bb2c45';
    }
    console.log(`message sent from ${id} to ${type.slice(8)}`)
    const peerChat = document.getElementById(`dm_chat_${id}`);
    peerChat.appendChild(fileDiv);
    peerChat.scrollTop = chatBox.scrollHeight;
  }else if (socket.id !== destID.slice(8) && isSender) {
    console.log('no')

    if (window.getComputedStyle(document.getElementById(`dm_${destID.slice(8)}`)).backgroundColor != 'rgb(56, 56, 56)'){
      document.getElementById(`dm_${destID.slice(8)}`).style.backgroundColor='#bb2c45';
    }

    const peerChat = document.getElementById(destID);
    peerChat.appendChild(fileDiv);
    peerChat.scrollTop = chatBox.scrollHeight;
  }
}

function showImage(url, guy){
  const img = document.createElement('img');
  img.src = url;
  img.style.maxWidth = '500px';
  img.style.height = 'auto';
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
    let destID = 'chatbox'
    document.querySelectorAll('.chatbox').forEach(chatbox => {
      if (window.getComputedStyle(chatbox).display === 'flex') {
        destID = chatbox.id;
      }
    });
    const arrayBuffer = fr.result;
    const uint8Array = new Uint8Array(arrayBuffer);
    const payload = {
      name: file.name,
      type: file.type,
      size: file.size,
      content: Array.from(uint8Array),
      destID
    };

    if (window.getComputedStyle(chatBox).display == 'flex'){
      socket.emit('peername', { id : socket.id, Peername});
    }
    socket.emit('file-data', payload);
    console.log("Sent file:", payload.content);
    appendFilePreview(payload, true);
  };
  fr.readAsArrayBuffer(file);
});

document.getElementById('everyone').addEventListener('click', () => {
  const dm_buttons = document.querySelectorAll('#dm_list button');
  dm_buttons.forEach(function(button){
    if (window.getComputedStyle(button).backgroundColor != 'rgb(187, 44, 69)'){
      button.style.backgroundColor='#696869';
    }
  })
  var every = document.getElementById('everyone');
  if (window.getComputedStyle(every).backgroundColor != 'rgb(187, 44, 69)'){
    every.style.backgroundColor = '#b530dd';
  }
  const chatboxes = document.querySelectorAll('.chatbox');
  chatboxes.forEach(chatbox => {
    chatbox.style.display = 'none';
  });
  const bootoom_text = document.getElementById("chat_with");
  var target = document.getElementById('everyone');
  target.style.backgroundColor = '#4d0763';
  bootoom_text.textContent = "Now Chatting with : Everyone";
  const chatbox = document.getElementById(`chatbox`);
  chatbox.style.display = 'flex';
});

function setname() {
  const nameIn = document.getElementById("nameInput");
  Peername = nameIn.value;
  if (Peername == ''){
    return;
  }
  console.log(Peername);
  const overlay = document.getElementById("login-overlay")
  overlay.style.display = "none";
  nameset = true;
  initSocketConnection();
}

nameInpot.addEventListener('keydown', (e) => {
  if(!nameset) {
    if (e.key === 'Enter') {
      e.preventDefault();
      setname();
    }
  }
});

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

function buildConnection(socketID){
  const dm_buttons = document.querySelectorAll('#dm_list button');
  dm_buttons.forEach(function(button){
    if (window.getComputedStyle(button).backgroundColor != 'rgb(187, 44, 69)'){
      button.style.backgroundColor='#696869';
    }
  })
  var every = document.getElementById('everyone');
  if (window.getComputedStyle(every).backgroundColor != 'rgb(187, 44, 69)'){
    every.style.backgroundColor = '#b530dd';
  }

  var target = document.getElementById('dm_'+socketID);
  target.style.backgroundColor = '#383838';
  const bootoom_text = document.getElementById("chat_with");
  var pname = mapOpeers.get(socketID);
  console.log(bootoom_text.value);
  bootoom_text.textContent = "Now Chatting with : " + pname;
  showChatBox(socketID);
}

function showChatBox(socketID){
  const chatboxes = document.querySelectorAll('.chatbox');
  chatboxes.forEach(chatbox => {
    chatbox.style.display = 'none';
  });

  const chatbox = document.getElementById(`dm_chat_${socketID}`);
  chatbox.style.display = 'flex';
}

window.addEventListener('beforeunload', () => {
  socket.emit('disconnecting', Peername);
});
