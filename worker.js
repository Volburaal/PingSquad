const socket = io("127.0.0.1:3000");
const chatBox = document.getElementById('chatbox');
const message = document.getElementById('msgInput');
const sendButton = document.getElementById('sendBtn');
var lastpeer=''

socket.on('peerJoined', (peerId) => {
  const peerDiv = document.createElement('div');
  peerDiv.classList.add('peer_joined');
  peerDiv.textContent = `+ ${peerId} has joined the chat.`;
  chatBox.appendChild(peerDiv);
  lastpeer=''

});

socket.on('peerLeft', (peerId) => {
  const peerDiv = document.createElement('div');
  peerDiv.classList.add('peer_left');
  peerDiv.textContent = `- ${peerId} has left the chat.`;
  chatBox.appendChild(peerDiv);
  lastpeer=''

});
socket.on('chatMessage', (msg) => {
  peername=msg.slice(0,20);
  msg=msg.slice(20);
  if (peername!=lastpeer){
    lastpeer=peername
    const peer = document.createElement('div');
    peer.innerHTML = peername;
    peer.classList.add('nameplate');
    chatBox.appendChild(peer);
  }

  const msgElement = document.createElement('div');
  msgElement.innerHTML = msg.replace(/\n/g, '<br>');
  msgElement.classList.add('msg_other');
  chatBox.appendChild(msgElement);
  chatBox.scrollTop = chatBox.scrollHeight;
});

function send() {
  console.log("clicked")
  const msg = message.value;
  if (msg) {
    console.log("Sent")
    socket.emit('chatMessage', msg);

    const msgElement = document.createElement('div');
    msgElement.innerHTML = msg.replace(/\n/g, '<br>');
    msgElement.classList.add('msg_you');
    chatBox.appendChild(msgElement);

    message.value = '';
    chatBox.scrollTop = chatBox.scrollHeight; 
    lastpeer=''
  }
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