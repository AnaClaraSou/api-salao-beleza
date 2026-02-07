const { Router } = require("express");
const router = Router();
const supabase = require("../supabaseClient"); // MUDOU AQUI!

// GET - Buscar todos os serviços
router.get("/services", async (req, res) => {
    try {
        // ANTIGO MySQL:
        // const [rows] = await bd.execute(
        //     "SELECT * FROM Servicos"
        // );
        
        // NOVO Supabase:
        const { data, error } = await supabase
            .from("servicos")
            .select("*")
            .order("nome", { ascending: true });
        
        if (error) throw error;
        
        // MESMA RESPOSTA que seu código original!
        res.json(data || []);

    } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        res.status(500).json({ error: "Erro ao buscar os serviços" });
    }
});

// GET - Buscar serviço por ID
router.get("/services/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
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

// GET - Buscar serviços por categoria
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

// POST - Criar um serviço
router.post("/services", async (req, res) => {
    try {
        const { nome, descricao, preco, duracao_minutos, categoria, popular } = req.body;

        // Validação básica
        if (!nome || !descricao || !preco || !duracao_minutos || !categoria) {
            return res.status(400).json({ 
                error: "Nome, descrição, preço, duração e categoria são obrigatórios" 
            });
        }

        // Valida categoria
        const categoriasValidas = ['cabelo', 'unhas', 'estetica'];
        if (!categoriasValidas.includes(categoria)) {
            return res.status(400).json({ 
                error: `Categoria inválida. Use: ${categoriasValidas.join(', ')}` 
            });
        }

        // ANTIGO MySQL:
        // await bd.execute(
        //     `INSERT INTO Servicos 
        //     (nome, descricao, preco, duracao_minutos, categoria, popular)
        //     VALUES (?, ?, ?, ?, ?, ?)`,
        //     [nome, descricao, preco, duracao_minutos, categoria, popular]
        // );
        
        // NOVO Supabase:
        const { data, error } = await supabase
            .from("servicos")
            .insert([{
                nome: nome.trim(),
                descricao: descricao.trim(),
                preco: parseFloat(preco),
                duracao_minutos: parseInt(duracao_minutos),
                categoria: categoria,
                popular: popular ? true : false
            }])
            .select()
            .single();

        if (error) throw error;

        // MESMA MENSAGEM que seu código original!
        res.status(201).json({ 
            message: "Serviço cadastrado com sucesso!",
            servico: data
        });

    } catch (error) {
        console.error("Erro ao cadastrar serviço:", error);
        res.status(500).json({ error: "Erro ao cadastrar o serviço" });
    }
});

// PUT - Atualizar um serviço
router.put("/services/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, duracao_minutos, categoria, popular } = req.body;

        // Validação
        if (!nome || !descricao || !preco || !duracao_minutos || !categoria) {
            return res.status(400).json({ 
                error: "Nome, descrição, preço, duração e categoria são obrigatórios" 
            });
        }

        // ANTIGO MySQL:
        // await bd.execute(
        //     `UPDATE Servicos 
        //      SET nome = ?, descricao = ?, preco = ?, duracao_minutos = ?, categoria = ?, popular = ?
        //      WHERE id = ?`,
        //     [nome, descricao, preco, duracao_minutos, categoria, popular, id]
        // );
        
        // NOVO Supabase:
        const { data, error } = await supabase
            .from("servicos")
            .update({
                nome: nome.trim(),
                descricao: descricao.trim(),
                preco: parseFloat(preco),
                duracao_minutos: parseInt(duracao_minutos),
                categoria: categoria,
                popular: popular ? true : false,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: "Serviço não encontrado" });
        }

        // MESMA MENSAGEM!
        res.json({ 
            message: "Serviço atualizado com sucesso!",
            servico: data
        });

    } catch (error) {
        console.error("Erro ao atualizar serviço:", error);
        res.status(500).json({ error: "Erro ao atualizar o serviço" });
    }
});

// DELETE - Deletar um serviço
router.delete("/services/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // ANTIGO MySQL:
        // await bd.execute(
        //     "DELETE FROM Servicos WHERE id = ?",
        //     [id]
        // );
        
        // NOVO Supabase:
        // Primeiro verifica se existe
        const { data: servicoExistente, error: checkError } = await supabase
            .from("servicos")
            .select("id")
            .eq("id", id)
            .single();

        if (checkError || !servicoExistente) {
            return res.status(404).json({ error: "Serviço não encontrado" });
        }

        // Deleta
        const { error } = await supabase
            .from("servicos")
            .delete()
            .eq("id", id);

        if (error) throw error;

        // Seu código original retornava status 204 sem conteúdo
        // Mas vamos retornar uma mensagem para o frontend saber
        res.json({ 
            message: "Serviço deletado com sucesso!" 
        });

    } catch (error) {
        console.error("Erro ao deletar serviço:", error);
        
        // Se o serviço está sendo usado em agendamentos
        if (error.code === '23503') {
            return res.status(400).json({ 
                error: "Não é possível excluir serviço com agendamentos ativos" 
            });
        }
        
        res.status(500).json({ error: "Erro ao deletar o serviço" });
    }
});

// ADICIONAL: Buscar serviços populares
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

module.exports = router;