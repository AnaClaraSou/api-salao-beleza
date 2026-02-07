const { Router } = require("express");
const router = Router();
const supabase = require("../supabaseClient");
const bcrypt = require("bcryptjs");

router.post("/login", async (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    try {
        // ANTIGO MySQL:
        // const [rows] = await bd.execute(
        //     "SELECT * FROM usuarios WHERE usuario = ?",
        //     [usuario]
        // );
        
        // NOVO Supabase:
        const { data: users, error } = await supabase
            .from("usuarios")
            .select("*")
            .eq("usuario", usuario)
            .limit(1);

        if (error) throw error;

        if (!users || users.length === 0) {
            return res.status(401).json({ error: "Usuário ou senha inválidos" });
        }

        const user = users[0];

        // Verifica se a senha está hasheada com bcrypt
        const senhaOk = await bcrypt.compare(senha, user.senha);
        if (!senhaOk) {
            return res.status(401).json({ error: "Usuário ou senha inválidos" });
        }

        // MESMA RESPOSTA que seu código original!
        res.json({
            message: "Login realizado com sucesso",
            usuario: {
                id: user.id,
                usuario: user.usuario
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: "Erro no servidor" });
    }
});

// ADICIONAL: Criar usuário admin inicial (se necessário)
router.post("/usuarios/criar-admin", async (req, res) => {
    try {
        const { usuario, senha } = req.body;
        
        if (!usuario || !senha) {
            return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
        }
        
        // Verifica se já existe
        const { data: existe, error: checkError } = await supabase
            .from("usuarios")
            .select("id")
            .eq("usuario", usuario)
            .single();
        
        if (existe) {
            return res.status(400).json({ error: "Usuário já existe" });
        }
        
        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        
        // Insere no Supabase
        const { data, error } = await supabase
            .from("usuarios")
            .insert([{
                usuario,
                senha: senhaHash,
                criado_em: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json({
            message: "Usuário admin criado com sucesso",
            usuario: {
                id: data.id,
                usuario: data.usuario
            }
        });
        
    } catch (error) {
        console.error("Erro ao criar admin:", error);
        res.status(500).json({ error: "Erro ao criar usuário" });
    }
});

// ADICIONAL: Alterar senha
router.put("/usuarios/alterar-senha", async (req, res) => {
    try {
        const { usuario, senha_atual, senha_nova } = req.body;
        
        if (!usuario || !senha_atual || !senha_nova) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios" });
        }
        
        // Busca usuário
        const { data: users, error: findError } = await supabase
            .from("usuarios")
            .select("*")
            .eq("usuario", usuario)
            .limit(1);
        
        if (findError || !users || users.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        
        const user = users[0];
        
        // Verifica senha atual
        const senhaOk = await bcrypt.compare(senha_atual, user.senha);
        if (!senhaOk) {
            return res.status(401).json({ error: "Senha atual incorreta" });
        }
        
        // Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        const novaSenhaHash = await bcrypt.hash(senha_nova, salt);
        
        // Atualiza no Supabase
        const { data, error } = await supabase
            .from("usuarios")
            .update({ 
                senha: novaSenhaHash,
                atualizado_em: new Date().toISOString()
            })
            .eq("id", user.id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            message: "Senha alterada com sucesso",
            usuario: {
                id: data.id,
                usuario: data.usuario
            }
        });
        
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        res.status(500).json({ error: "Erro ao alterar senha" });
    }
});

module.exports = router;