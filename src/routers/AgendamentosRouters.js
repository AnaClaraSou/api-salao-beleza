const { Router } = require("express");
const router = Router();
const supabase = require("../supabaseClient"); // MUDOU AQUI!

// GET TODOS OS AGENDAMENTOS
router.get("/agendamentos", async (req, res) => {
    try {
        // ANTIGO MySQL:
        // const [rows] = await bd.execute("SELECT * FROM agendamentos");
        
        // NOVO Supabase:
        const { data, error } = await supabase
            .from("agendamentos")
            .select(`
                *,
                clientes (nome, telefone)
            `)
            .order("data", { ascending: true })
            .order("horario", { ascending: true });
        
        if (error) throw error;
        res.json(data || []);
        
    } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
        res.status(500).json({ error: "Erro ao buscar agendamentos" });
    }
});

// GET POR DATA
router.get("/agendamentos/:data", async (req, res) => {
    try {
        // ANTIGO:
        // const [rows] = await bd.execute(
        //     "SELECT * FROM agendamentos WHERE `data` = ?",
        //     [req.params.data]
        // );
        
        // NOVO:
        const { data, error } = await supabase
            .from("agendamentos")
            .select("*")
            .eq("data", req.params.data)
            .order("horario", { ascending: true });
        
        if (error) throw error;
        res.json(data || []);
        
    } catch (error) {
        console.error("Erro ao buscar agendamentos por data:", error);
        res.status(500).json({ error: "Erro ao buscar agendamentos" });
    }
});

// POST AGENDAMENTO (MANDA MENSAGENS IGUAIS!)
router.post("/agendamentos", async (req, res) => {
    try {
        const {
            cliente_id,
            cliente_nome,
            servico,
            data,
            horario,
            observacoes,
            pago
        } = req.body;

        // ✅ NORMALIZA cliente_id (mantém sua lógica)
        const clienteIdFinal =
            cliente_id && !isNaN(cliente_id)
                ? Number(cliente_id)
                : null;

        if (!clienteIdFinal) {
            return res.status(400).json({
                error: "cliente_id é obrigatório"
            });
        }

        // 🔒 Conflito por data + horário (SUPABASE)
        const { data: conflict, error: conflictError } = await supabase
            .from("agendamentos")
            .select("id")
            .eq("data", data)
            .eq("horario", horario);

        if (conflictError) throw conflictError;

        if (conflict && conflict.length > 0) {
            return res.status(409).json({
                error: "Já existe um agendamento neste horário"
            });
        }

        // INSERT no Supabase
        const { data: novoAgendamento, error: insertError } = await supabase
            .from("agendamentos")
            .insert([{
                cliente_id: clienteIdFinal,
                cliente_nome: cliente_nome || "",
                servico,
                data,
                horario,
                observacoes: observacoes || null,
                pago: pago ? true : false  // Supabase usa boolean
            }])
            .select()
            .single();

        if (insertError) {
            console.error("ERRO SUPABASE:", insertError);
            
            // Trata erro de UNIQUE constraint
            if (insertError.code === '23505') {
                return res.status(409).json({
                    error: "Já existe um agendamento neste horário"
                });
            }
            
            throw insertError;
        }

        // MESMA MENSAGEM que seu código original!
        res.status(201).json({ 
            message: "Agendamento criado com sucesso!",
            id: novoAgendamento.id 
        });

    } catch (error) {
        console.error("ERRO:", error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - ATUALIZAR AGENDAMENTO
router.put("/agendamentos/:id", async (req, res) => {
    const { id } = req.params;
    const {
        cliente_id,
        cliente_nome,
        servico,
        data,
        horario,
        observacoes,
        pago
    } = req.body;

    try {
        // ✅ NORMALIZA cliente_id (mantém sua lógica)
        const clienteIdFinal =
            cliente_id && !isNaN(cliente_id)
                ? Number(cliente_id)
                : null;

        if (!clienteIdFinal) {
            return res.status(400).json({
                error: "cliente_id é obrigatório"
            });
        }

        // 🔒 Conflito por data + horário (exceto o próprio id) - SUPABASE
        const { data: conflict, error: conflictError } = await supabase
            .from("agendamentos")
            .select("id")
            .eq("data", data)
            .eq("horario", horario)
            .neq("id", id);  // exclui o próprio registro

        if (conflictError) throw conflictError;

        if (conflict && conflict.length > 0) {
            return res.status(409).json({
                error: "Já existe um agendamento neste horário"
            });
        }

        // UPDATE no Supabase
        const { data: agendamentoAtualizado, error: updateError } = await supabase
            .from("agendamentos")
            .update({
                cliente_id: clienteIdFinal,
                cliente_nome: cliente_nome || "",
                servico,
                data,
                horario,
                observacoes: observacoes || null,
                pago: pago ? true : false
            })
            .eq("id", id)
            .select()
            .single();

        if (updateError) {
            console.error("ERRO SUPABASE:", updateError);
            throw updateError;
        }

        if (!agendamentoAtualizado) {
            return res.status(404).json({ error: "Agendamento não encontrado" });
        }

        // MESMA MENSAGEM!
        res.json({ message: "Agendamento atualizado com sucesso" });

    } catch (error) {
        console.error("ERRO:", error);
        res.status(500).json({ error: "Erro ao atualizar agendamento" });
    }
});

// DELETE AGENDAMENTO
router.delete("/agendamentos/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // ANTIGO:
        // const [result] = await bd.execute(
        //     "DELETE FROM agendamentos WHERE id = ?",
        //     [id]
        // );
        
        // NOVO Supabase:
        const { error, count } = await supabase
            .from("agendamentos")
            .delete()
            .eq("id", id)
            .select('id', { count: 'exact', head: true });

        if (error) throw error;

        // count é o número de registros deletados no Supabase
        if (!count || count === 0) {
            return res.status(404).json({ error: "Agendamento não encontrado" });
        }

        // MESMA MENSAGEM!
        res.json({ message: "Agendamento excluído com sucesso" });

    } catch (error) {
        console.error("ERRO:", error);
        res.status(500).json({ error: "Erro ao excluir agendamento" });
    }
});

// ADICIONE ESTAS ROTAS EXTRA PARA SUPABASE:

// GET AGENDAMENTOS DE HOJE
router.get("/agendamentos/hoje", async (req, res) => {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from("agendamentos")
            .select("*")
            .eq("data", hoje)
            .order("horario", { ascending: true });
        
        if (error) throw error;
        res.json(data || []);
        
    } catch (error) {
        console.error("Erro ao buscar agendamentos de hoje:", error);
        res.status(500).json({ error: "Erro ao buscar agendamentos" });
    }
});

// MARCAR COMO PAGO
router.put("/agendamentos/:id/pagar", async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from("agendamentos")
            .update({ pago: true })
            .eq("id", id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ 
            message: "Agendamento marcado como pago", 
            agendamento: data 
        });
        
    } catch (error) {
        console.error("Erro ao marcar como pago:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;