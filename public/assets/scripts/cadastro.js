const URL_USUARIOS = 'http://localhost:3001/usuarios';

const formCadastro = document.getElementById('form-cadastro');

if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault(); 

       
        const nome = document.getElementById('cad-nome').value.trim();
        const username = document.getElementById('cad-username').value.trim();
        const email = document.getElementById('cad-email').value.trim().toLowerCase();
        const senha = document.getElementById('cad-senha').value; 

        try {
            
            const respostaVerificacao = await fetch(`${URL_USUARIOS}?email=${email}`);
            const usuariosExistentes = await respostaVerificacao.json();

            if (usuariosExistentes.length > 0) {
                alert('Este e-mail já está cadastrado!');
                return;
            }

            const novoUsuario = {
                nome,
                username,
                email,
                senha,
                favoritos: [] 
            };

            const respostaPost = await fetch(URL_USUARIOS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(novoUsuario)
            });

            if (respostaPost.ok) {
                alert('Cadastro realizado com sucesso!');
                window.location.href = 'login.html'; 
            } else {
                alert('Erro ao realizar o cadastro.');
            }

        } catch (erro) {
            console.error('Erro no cadastro:', erro);
            alert('Não foi possível conectar ao servidor local.');
        }
    });
}