const server = "https://pingsquad.onrender.com"
const socket = io(server);
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
socket.on('chatMessage', ({ sk: peername , msg}) => {
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

socket.on('sentImg', (payload) => {
  // Deserialize the received payload
  const uint8Array = new Uint8Array(payload.content); // Recreate Uint8Array from serialized array
  const blob = new Blob([uint8Array], { type: 'image/png' }); // Create a Blob from the Uint8Array

  // Create a Blob URL to display the image
  const url = (window.URL || window.webkitURL).createObjectURL(blob);

  // Create and display the image element
  const img = document.createElement('img');
  img.src = url;
  img.width = 200;
  img.height = 200;
  img.classList.add('chat-image'); // Optional CSS class

  // Append to the chat box
  const chatBox = document.querySelector("#chatbox");
  chatBox.appendChild(img);

  // Scroll to the bottom of the chat box
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

document.querySelector("#fileInput").addEventListener("change", function(e){
    
  const fr = new FileReader();
  fr.onload = () => {
      const arrayBuffer = fr.result;
      const uint8Array = new Uint8Array(arrayBuffer); // Convert to Uint8Array
      const payload = {
          type: "file",
          content: Array.from(uint8Array), // Convert to a regular array
      };
      socket.emit('image-data', payload); // Send serialized data
      console.log("Sent:", payload);
  };
  fr.readAsArrayBuffer(e.target.files[0]);
  /*
    var fr = new FileReader();
    fr.onload = () => {
        var data = new Uint8Array(fr.result); // Convert ArrayBuffer to Uint8Array
        socket.emit('image-data', data);  // Send the binary data directly
        console.log(data); // You can still log the ArrayBuffer for debugging
    };
    fr.readAsArrayBuffer(e.target.files[0]);*/

  /*var fr = new FileReader()
      fr.onload = () => {
      var src = fr.result
      socket.emit('image-data', JSON.stringify({ type: "file", content: src }));
      console.log(src);
    }
    fr.readAsArrayBuffer(e.target.files[0])*/
    
});