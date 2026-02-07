const {Router} = require ("express");
const router = Router();
const supabase = require("../supabaseClient"); // MUDOU AQUI!

//GET LISTAGEM DOS AGENDAMENTOS DO DIA
router.get("/dashboard/agendamentos-hoje", async (req, res) => {
    try
    {
        // ANTIGO MySQL:
        // const [rows] = await bd.execute( `
        //     SELECT 
        //         horario,
        //         cliente_nome,
        //         servico,
        //         pago
        //     FROM agendamentos
        //     WHERE data = CURDATE()
        //     ORDER BY horario
        // `);
        
        // NOVO Supabase:
        const hoje = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        
        const { data, error } = await supabase
            .from("agendamentos")
            .select("horario, cliente_nome, servico, pago, id")
            .eq("data", hoje)
            .order("horario", { ascending: true });
        
        if (error) throw error;
        
        // MESMA RESPOSTA que seu código original!
        res.json(data || []);

    }
    catch(error)
    {
        console.error("Erro agendamentos hoje:", error);
        res.status(500).json({error: "Erro ao carregar os agendamentos do dia"});
    }
});

//GET TOTAL DE AGENDAMENTOS DE HOJE
router.get("/dashboard/total-agendamentos-hoje", async (req, res) => {
    try {
        // ANTIGO MySQL:
        // const [rows] = await bd.execute(
        //     "SELECT COUNT(*) AS total FROM agendamentos WHERE data = CURDATE()"
        // );
        
        // NOVO Supabase:
        const hoje = new Date().toISOString().split('T')[0];
        
        const { count, error } = await supabase
            .from("agendamentos")
            .select("*", { count: 'exact', head: true })
            .eq("data", hoje);
        
        if (error) throw error;
        
        // MESMA ESTRUTURA de resposta!
        res.json({ total: count || 0 });

    } catch (error) {
        console.error("Erro total agendamentos hoje:", error);
        res.status(500).json({ error: "Erro ao carregar total de agendamentos de hoje" });
    }
});

//GET LISTAGEM TOTAL CLIENTES
router.get("/dashboard/total-clientes", async (req, res) => {
    try
    {
        // ANTIGO MySQL:
        // const [rows] = await bd.execute(
        //     "SELECT COUNT(*) AS total FROM Clientes"
        //  );
        
        // NOVO Supabase:
        const { count, error } = await supabase
            .from("clientes")
            .select("*", { count: 'exact', head: true });
        
        if (error) throw error;
        
        // MESMA ESTRUTURA!
        res.json({ total: count || 0 });

    }
    catch(error)
    {
        console.error("Erro total clientes:", error);
        res.status(500).json({error: "Erro ao carregar o total de clientes"});
    }
});

//GET LISTAGEM DOS SERVIÇOS POPULARES
router.get("/dashboard/servicos-populares", async (req, res) => {
    try
    {
        // ANTIGO MySQL:
        // const [rows] = await bd.execute(`
        //     SELECT 
        //         servico,
        //         COUNT(*) AS total
        //         FROM agendamentos
        //         GROUP BY servico
        //         ORDER BY total DESC
        //         LIMIT 5
        // `);
        
        // NOVO Supabase:
        // Primeiro busca todos agendamentos
        const { data: agendamentos, error } = await supabase
            .from("agendamentos")
            .select("servico");
        
        if (error) throw error;
        
        // Faz o GROUP BY manualmente (Supabase tem rpc() mas é mais complexo)
        const contagem = {};
        
        agendamentos?.forEach(agendamento => {
            const servico = agendamento.servico;
            contagem[servico] = (contagem[servico] || 0) + 1;
        });
        
        // Converte para array e ordena
        const resultado = Object.entries(contagem)
            .map(([servico, total]) => ({ servico, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5); // Limite 5
        
        // MESMA ESTRUTURA!
        res.json(resultado);

    }
    catch(error)
    {
        console.error("Erro serviços populares:", error);
        res.status(500).json({error: "Erro ao carregar os serviços populares"});
    }
});

// ADICIONAL: FATURAMENTO DO DIA (se quiser)
router.get("/dashboard/faturamento-hoje", async (req, res) => {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        
        // Busca agendamentos pagos de hoje
        const { data: agendamentos, error: err1 } = await supabase
            .from("agendamentos")
            .select("servico")
            .eq("data", hoje)
            .eq("pago", true);
        
        if (err1) throw err1;
        
        // Busca preços dos serviços
        const { data: servicos, error: err2 } = await supabase
            .from("servicos")
            .select("nome, preco");
        
        if (err2) throw err2;
        
        // Cria mapa de preços
        const precos = {};
        servicos?.forEach(servico => {
            precos[servico.nome] = servico.preco;
        });
        
        // Calcula total
        let faturamento = 0;
        agendamentos?.forEach(agendamento => {
            const preco = precos[agendamento.servico] || 0;
            faturamento += parseFloat(preco);
        });
        
        res.json({ 
            faturamento: faturamento.toFixed(2),
            total_servicos: agendamentos?.length || 0 
        });
        
    } catch (error) {
        console.error("Erro faturamento:", error);
        res.status(500).json({ error: "Erro ao calcular faturamento" });
    }
});

// ADICIONAL: CLIENTES COM ANIVERSÁRIO HOJE
router.get("/dashboard/aniversariantes-hoje", async (req, res) => {
    try {
        const hoje = new Date();
        const dia = hoje.getDate();
        const mes = hoje.getMonth() + 1; // Janeiro é 0
        
        // Formata para MM-DD
        const hojeFormatado = `${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
        
        // Busca clientes com aniversário hoje
        const { data, error } = await supabase
            .from("clientes")
            .select("nome, telefone, email")
            .not("aniversario", "is", null);
        
        if (error) throw error;
        
        // Filtra no JavaScript (Supabase não tem DATE_PART fácil no client)
        const aniversariantes = data?.filter(cliente => {
            if (!cliente.aniversario) return false;
            
            const dataAniversario = new Date(cliente.aniversario);
            const diaAniv = dataAniversario.getDate();
            const mesAniv = dataAniversario.getMonth() + 1;
            
            return dia === diaAniv && mes === mesAniv;
        }) || [];
        
        res.json({
            total: aniversariantes.length,
            clientes: aniversariantes
        });
        
    } catch (error) {
        console.error("Erro aniversariantes:", error);
        res.status(500).json({ error: "Erro ao buscar aniversariantes" });
    }
});

module.exports = router;