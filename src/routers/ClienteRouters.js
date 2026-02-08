const { Router } = require("express");
const router = Router();
const supabase = require("../supabaseClient"); // MUDOU AQUI!

//CRUDS

//GET LISTAR OS CLIENTES 
router.get("/clientes", async (req, res) => {
    try{
        // ANTIGO MySQL:
        // const [rows] = await db.execute(
        // "SELECT id_Cliente, nome, telefone, email, aniversario, observacoes FROM Clientes");
        
        // NOVO Supabase:
        const { data, error } = await supabase
            .from("clientes")
            .select("id_cliente, nome, telefone, email, aniversario, observacoes, created_at")
            .order("nome", { ascending: true });
        
        if (error) throw error;
        
        // MESMA RESPOSTA que seu código original!
        res.json(data || []);

    } 
    catch(error){
        console.error("Erro ao buscar clientes:", error);
        res.status(500).json({error: "Erro ao buscar os clientes"});
    }
});

//POST CRIAR UM CLIENTE
router.post("/clientes", async (req, res) => {
    try
    {
        const {nome, telefone, email, aniversario, observacoes} = req.body;

        // Validação (mantém sua lógica se quiser)
        if (!nome || nome.trim() === "") {
            return res.status(400).json({ error: "Nome é obrigatório" });
        }

        // ANTIGO MySQL:
        // await db.execute(
        // 'INSERT INTO Clientes (nome, telefone, email, aniversario, observacoes) VALUES (?, ?, ?, ?, ?)',
        // [nome, telefone, email, aniversario, observacoes]);
        
        // NOVO Supabase:
        const { data, error } = await supabase
            .from("clientes")
            .insert([{
                nome: nome || "",
                telefone: telefone || "",
                email: email || "",
                aniversario: aniversario || null,
                observacoes: observacoes || ""
            }])
            .select()
            .single();

        if (error) throw error;
    
        // MESMA MENSAGEM que seu código original!
        res.status(201).json({
            message: "Cliente cadastrado com sucesso!!",
            cliente: data
        });

    }
    catch(error)
    {
        console.error("Erro ao criar cliente:", error);
        res.status(500).json({error: "Erro ao criar o cliente"})
    }
   
});

//PUT ATUALIZAR DADOS DE UM CLIENTE
router.put("/clientes/:id", async (req, res) => {
    try
    {
        const {id} = req.params;
        const {nome, telefone, email, aniversario, observacoes} = req.body;

        // Validação
        if (!nome || nome.trim() === "") {
            return res.status(400).json({ error: "Nome é obrigatório" });
        }

        // ANTIGO MySQL:
        // await db.execute(
        //     'UPDATE Clientes SET nome=?, telefone=?, email=?, aniversario=?, observacoes=? WHERE id_Cliente=?',
        //     [nome, telefone, email, aniversario, observacoes, id]
        // );
        
        // NOVO Supabase:
        const { data, error } = await supabase
            .from("clientes")
            .update({
                nome: nome || "",
                telefone: telefone || "",
                email: email || "",
                aniversario: aniversario || null,
                observacoes: observacoes || ""
            })
            .eq("id_cliente", id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: "Cliente não encontrado" });
        }

        // MESMA MENSAGEM!
        res.json({
            message: "Dados do cliente atualizado com sucesso!!",
            cliente: data
        })
    }
    catch(error)
    {
        console.error("Erro ao atualizar cliente:", error);
        res.status(500).json({error: "Erro ao atualizar dados do cliente"})
    }
});

//DELETE DELETAR UM CLIENTE
router.delete("/clientes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: clienteExistente, error: checkError } = await supabase
      .from("clientes")
      .select("id_cliente")
      .eq("id_cliente", id)
      .maybeSingle();

    if (checkError || !clienteExistente) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id_cliente", id);

    if (error) throw error;

    res.json({ message: "Cliente deletado com sucesso!" });

  } catch (error) {
    console.error("ERRO AO DELETAR CLIENTE:", error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: "Não é possível excluir cliente com agendamentos ativos"
      });
    }

    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
});


// GET CLIENTE POR ID (ADICIONAL - útil para edição)
router.get("/clientes/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from("clientes")
            .select("*")
            .eq("id_cliente", id)
            .single();
        
        if (error || !data) {
            return res.status(404).json({ error: "Cliente não encontrado" });
        }
        
        res.json(data);
        
    } catch (error) {
        console.error("Erro ao buscar cliente:", error);
        res.status(500).json({ error: "Erro ao buscar cliente" });
    }
});

// BUSCA DE CLIENTES (ADICIONAL - para sua interface)
router.get("/clientes/busca/:termo", async (req, res) => {
    try {
        const { termo } = req.params;
        
        const { data, error } = await supabase
            .from("clientes")
            .select("*")
            .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%,email.ilike.%${termo}%`)
            .order("nome")
            .limit(20);
        
        if (error) throw error;
        
        res.json(data || []);
        
    } catch (error) {
        console.error("Erro na busca:", error);
        res.status(500).json({ error: "Erro na busca" });
    }
});

module.exports = router;