const socket = io("127.0.0.1:3000");
const chatBox = document.getElementById('chatbox');
const message = document.getElementById('msgInput');
const sendButton = document.getElementById('sendBtn');

socket.on('chatMessage', (msg) => {
  const msgElement = document.createElement('p');
  msgElement.textContent = msg;
  chatBox.appendChild(msgElement);
  chatBox.scrollTop = chatBox.scrollHeight;
});

function send() {
  console.log("clicked")
  const msg = message.value;
  if (msg) {
    console.log("Sent")
    socket.emit('chatMessage', msg);
    const msgElement = document.createElement('p');
    msgElement.textContent = 'You: ' + msg;
    chatBox.appendChild(msgElement);
    message.value = '';
    chatBox.scrollTop = chatBox.scrollHeight; 
  }
}

message.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendButton.click();
  }
});