const app = new Vue({
  el: '#app',
  data: {
    title: 'Nestjs Websockets Chat',
    householdId: 'b53a81a9-6e5a-473e-9aa6-57f025b13479',
    //  userId: '148bf485-dbb3-4a04-aa09-7120d832957d',
    body: 'SOCKETS, WORK PLEASE!!!',
    messages: [],
    households: [
      '8805ba6e-9a18-469f-90b4-df6d993c9c14',
      '8805ba6e-9a18-469f-90b4-df6d993',
    ],
    socket: null,
  },
  methods: {
    firstHousehold() {
      console.log('im in first household method')
      this.socket ? this.socket.close() : null;
      console.log(this.socket, 'socket in first household method')
      this.socket = io('http://localhost:8083');
      console.log(this.socket);
      this.socket.on(`videoCallToUser9745777c-6588-4102-85c8-572cd103ed8a`, (message) => {
        console.log(message);
        this.receivedMessage(message);
      });
    },
    secondHousehold() {
      console.log('im in second household method')
      this.socket ? this.socket.close() : null;
      console.log(this.socket, 'socket in second household method')
      this.socket = io('http://localhost:8083/');
      console.log(this.socket);
      this.socket.on(`notifyParents859ed1bd-50c0-4320-9891-633580273f88`, (message) => {
        console.log(message);
        this.receivedMessage(message);
      });
    },
    sendMessage() {
      console.log('im in sendMessage')
      const message = {
        householdId: this.householdId,
        body: this.body,
      };

      if(!message.body){
        return
      }
      console.log(message)
      this.socket.emit('msgToHousehold', message);
      this.receivedMessage(message)
      this.body = '';
    },
    receivedMessage(message) {
      this.messages.push(message);
    },
  },
});
