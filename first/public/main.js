const socket = io()

const clientsTotal = document.getElementById('client-total')
const messageContainer = document.getElementById('message-container')
const nameInput = document.getElementById('name-input')
const messageForm = document.getElementById('message-form')
const messageInput = document.getElementById('message-input')

// Add these new elements
const roomInput = document.getElementById('room-input')
const joinRoomButton = document.getElementById('join-room-button')
const currentRoomDisplay = document.getElementById('current-room')

const messageTone = new Audio('/message-tone.mp3')

let currentRoom = null

messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  sendMessage()
})

// Add event listener for joining a room
joinRoomButton.addEventListener('click', () => {
  const roomName = roomInput.value.trim()
  if (roomName) {
    if (currentRoom) {
      socket.emit('leave-room', currentRoom)
    }
    socket.emit('join-room', roomName)
  }
})

socket.on('clients-total', (data) => {
  clientsTotal.innerText = `Total Clients: ${data}`
})

socket.on('room-joined', (roomName) => {
  currentRoom = roomName
  currentRoomDisplay.innerText = `Current Room: ${roomName}`
  messageContainer.innerHTML = '' // Clear previous messages
  roomInput.value = ''
})

socket.on('clients-in-room', (count) => {
  clientsTotal.innerText = `Clients in Room: ${count}`
})

function sendMessage() {
  if (messageInput.value === '') return
  const data = {
    name: nameInput.value,
    message: messageInput.value,
    dateTime: new Date(),
    room: currentRoom
  }
  socket.emit('message', data)
  addMessageToUI(true, data)
  messageInput.value = ''
}

socket.on('chat-message', (data) => {
  messageTone.play()
  addMessageToUI(false, data)
})

function addMessageToUI(isOwnMessage, data) {
  clearFeedback()
  const element = `
      <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
          <p class="message">
            ${data.message}
            <span>${data.name} ● ${moment(data.dateTime).fromNow()}</span>
          </p>
        </li>
        `

  messageContainer.innerHTML += element
  scrollToBottom()
}

function scrollToBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight)
}

messageInput.addEventListener('focus', (e) => {
  socket.emit('feedback', {
    feedback: `✍️ ${nameInput.value} is typing a message`,
    room: currentRoom
  })
})

messageInput.addEventListener('keypress', (e) => {
  socket.emit('feedback', {
    feedback: `✍️ ${nameInput.value} is typing a message`,
    room: currentRoom
  })
})

messageInput.addEventListener('blur', (e) => {
  socket.emit('feedback', {
    feedback: '',
    room: currentRoom
  })
})

socket.on('feedback', (data) => {
  clearFeedback()
  const element = `
        <li class="message-feedback">
          <p class="feedback" id="feedback">${data.feedback}</p>
        </li>
  `
  messageContainer.innerHTML += element
})

function clearFeedback() {
  document.querySelectorAll('li.message-feedback').forEach((element) => {
    element.parentNode.removeChild(element)
  })
}
