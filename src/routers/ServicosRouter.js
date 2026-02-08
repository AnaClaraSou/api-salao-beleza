const { Router } = require("express");
const router = Router();
const supabase = require("../supabaseClient");

// GET - Serviços populares (ESPECÍFICA)
router.get("/services/populares", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("servicos")
            .select("*")
            .eq("popular", true)
            .order("nome", { ascending: true });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error("Erro ao buscar serviços populares:", error);
        res.status(500).json({ error: "Erro ao buscar serviços populares" });
    }
});

// GET - Serviços por categoria (ESPECÍFICA)
router.get("/services/categoria/:categoria", async (req, res) => {
    try {
        const { categoria } = req.params;

        const { data, error } = await supabase
            .from("servicos")
            .select("*")
            .eq("categoria", categoria)
            .order("nome", { ascending: true });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error("Erro ao buscar serviços por categoria:", error);
        res.status(500).json({ error: "Erro ao buscar serviços" });
    }
});

// GET - Buscar todos os serviços
router.get("/services", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("servicos")
            .select("*")
            .order("nome", { ascending: true });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        res.status(500).json({ error: "Erro ao buscar os serviços" });
    }
});

// GET - Buscar serviço por ID (GENÉRICA – SEMPRE POR ÚLTIMO)
router.get("/services/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
        }

        const { data, error } = await supabase
            .from("servicos")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: "Serviço não encontrado" });
        }

        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar serviço:", error);
        res.status(500).json({ error: "Erro ao buscar o serviço" });
    }
});

// POST - Criar serviço
router.post("/services", async (req, res) => {
    try {
        const { nome, descricao, preco, duracao_minutos, categoria, popular } = req.body;

        if (!nome || !descricao || !preco || !duracao_minutos || !categoria) {
            return res.status(400).json({
                error: "Nome, descrição, preço, duração e categoria são obrigatórios"
            });
        }

        const categoriasValidas = ['cabelo', 'unhas', 'estetica'];
        if (!categoriasValidas.includes(categoria)) {
            return res.status(400).json({
                error: `Categoria inválida. Use: ${categoriasValidas.join(', ')}`
            });
        }

        const { data, error } = await supabase
            .from("servicos")
            .insert([{
                nome: nome.trim(),
                descricao: descricao.trim(),
                preco: Number(preco),
                duracao_minutos: Number(duracao_minutos),
                categoria,
                popular: Boolean(popular)
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: "Serviço cadastrado com sucesso!",
            servico: data
        });
    } catch (error) {
        console.error("Erro ao cadastrar serviço:", error);
        res.status(500).json({ error: "Erro ao cadastrar o serviço" });
    }
});

// PUT - Atualizar serviço
router.put("/services/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { nome, descricao, preco, duracao_minutos, categoria, popular } = req.body;

    if (
      !nome?.trim() ||
      !descricao?.trim() ||
      preco === undefined ||
      duracao_minutos === undefined ||
      !categoria
    ) {
      return res.status(400).json({
        error: "Todos os campos obrigatórios devem ser preenchidos"
      });
    }

    const { data, error } = await supabase
      .from("servicos")
      .update({
        nome: nome.trim(),
        descricao: descricao.trim(),
        preco: Number(preco),
        duracao_minutos: Number(duracao_minutos),
        categoria,
        popular: Boolean(popular)
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Serviço não encontrado" });
    }

    res.json({
      message: "Serviço atualizado com sucesso!",
      servico: data
    });

  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    res.status(500).json({ error: "Erro ao atualizar o serviço" });
  }
});

// DELETE - Deletar serviço
router.delete("/services/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
        }

        const { data: servicoExistente } = await supabase
            .from("servicos")
            .select("id")
            .eq("id", id)
            .single();

        if (!servicoExistente) {
            return res.status(404).json({ error: "Serviço não encontrado" });
        }

        const { error } = await supabase
            .from("servicos")
            .delete()
            .eq("id", id);

        if (error) throw error;

        res.json({ message: "Serviço deletado com sucesso!" });
    } catch (error) {
        console.error("Erro ao deletar serviço:", error);

        if (error.code === '23503') {
            return res.status(400).json({
                error: "Não é possível excluir serviço com agendamentos ativos"
            });
        }

        res.status(500).json({ error: "Erro ao deletar o serviço" });
    }
});

module.exports = router;
