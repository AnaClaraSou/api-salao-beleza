const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use(require("./routers/ClienteRouters"));
app.use(require("./routers/AgendamentosRouters"));
app.use(require("./routers/ServicosRouter"));
app.use(require("./routers/DashboardRouter"));
app.use(require("./routers/LoginRouter"));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API Salão de Beleza Online 🚀",
    timestamp: new Date().toISOString()
  });
});

// Info da API
app.get("/", (req, res) => {
  res.json({
    nome: "API Salão de Beleza",
    status: "online",
    endpoints: {
      clientes: "/clientes",
      agendamentos: "/agendamentos",
      servicos: "/services",
      dashboard: "/dashboard",
      login: "/login",
      health: "/health"
    }
  });
});

// ⚠️ NÃO use app.listen na Vercel
module.exports = app;
