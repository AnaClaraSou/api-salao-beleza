// src/criarAdmin.js
const bcrypt = require("bcryptjs");
const supabase = require("./supabaseClient"); // Agora no mesmo diretório

async function criarOuAtualizarAdmin() {
    const usuario = "admin";
    const senhaPlana = "salao@1234beleza";

    try {
        console.log("🔐 Configurando usuário admin...");
        
        // Verifica se já existe
        const { data: usuarioExistente, error: checkError } = await supabase
            .from("usuarios")
            .select("id")
            .eq("usuario", usuario)
            .single();
        
        const hash = await bcrypt.hash(senhaPlana, 10);
        
        if (checkError && checkError.code === 'PGRST116') {
            // Criar novo
            const { data, error } = await supabase
                .from("usuarios")
                .insert([{
                    usuario: usuario,
                    senha: hash
                }])
                .select()
                .single();
            
            if (error) {
                console.error("❌ Erro ao criar:", error.message);
            } else {
                console.log("✅ Admin criado! ID:", data.id);
            }
            
        } else if (usuarioExistente) {
            // Atualizar
            const { error } = await supabase
                .from("usuarios")
                .update({ senha: hash })
                .eq("id", usuarioExistente.id);
            
            if (error) {
                console.error("❌ Erro ao atualizar:", error.message);
            } else {
                console.log("✅ Senha do admin atualizada!");
            }
        }
        
        process.exit();
        
    } catch (err) {
        console.error("❌ Erro:", err.message);
        process.exit(1);
    }
}

criarOuAtualizarAdmin();