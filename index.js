const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(cookieParser());

let sessions = {};

io.on("connection", (socket) => {
  const socketId = socket.id;
  console.log("a user connected", socketId);

  // Initialize session data

  if (!sessions[socketId]) {
    sessions[socketId] = {
      userId: uuidv4(),
      orderHistory: [],
      currentOrders: null,
    };
  }

  const message = socket.emit("bot-message", {
    message:
      "Select 1 to Choose what to order \n|| Select 99 to checkout order || Select 98 to see order history || Select 97 to see current order || Select 0 to cancel order  ",
  });

  socket.on("user-message", (message) => {
    handleUserMessage(socketId, message, socket);
  });

  socket.on("disconnect", () => {
    delete sessions[socketId];
    console.log("A user disconeted!", socketId);
  });
});

const menuItems = ["Pizza", "Burger", "Pasta", "Salad", "Soda"];

function handleUserMessage(socketId, message, socket) {
  const session = sessions[socketId];
  switch (message) {
    case "1":
      const menu = menuItems
        .map((item, index) => ` ${String.fromCharCode(97 + index)}. ${item}`)
        .join("\n");
      socket.emit("bot-message", {
        message: `Please select an item to order:\n${menu}`,
      });
      break;

    case "99":
      if (session.currentOrders) {
        session.orderHistory.push(session.currentOrders);
        session.currentOrders = null;
        socket.emit("bot-message", {
          message: "Order placed. Select 1 to place a new order.",
        });
      } else {
        socket.emit("bot-message", {
          message: "No order to place. Select 1 to place a new order.",
        });
      }
      break;

    case "98":
      if (session.orderHistory.length > 0) {
        const history = session.orderHistory
          .map((order, index) => `${index + 1}. ${order}`)
          .join("\n");
        socket.emit("bot-message", { message: `Order history:\n${history}` });
      } else {
        socket.emit("bot-message", { message: "No order history." });
      }
      break;

    case "97":
      if (session.currentOrders) {
        socket.emit("bot-message", {
          message: `Current order: ${session.currentOrders}`,
        });
      } else {
        socket.emit("bot-message", { message: "No current order." });
      }
      break;

    case "0":
      if (session.currentOrders) {
        session.currentOrders = null;
        socket.emit("bot-message", {
          message: "Order cancelled. Select 1 to place a new order.",
        });
      } else {
        socket.emit("bot-message", { message: "No order to cancel." });
      }
      break;

    default:
      if (message.length === 1 && message >= "a" && message <= "e") {
        const index = message.charCodeAt(0) - 97;
        session.currentOrders = menuItems[index];
        socket.emit("bot-message", {
          message: `You have selected ${menuItems[index]}. Select 99 to checkout or continue ordering.`,
        });
        console.log(session.orderHistory);
        console.log(session.orderHistory);
      } else {
        socket.emit("bot-message", {
          message: "Invalid option. Please try again.",
        });
      }
      break;
  }
}

//

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log("server running at http://localhost:3000");
});
