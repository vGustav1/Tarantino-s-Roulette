const URL_USUARIOS = 'http://localhost:3001/usuarios';

const formLogin = document.getElementById('form-login');

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const senha = document.getElementById('login-senha').value.trim();

        try {
            
            const resposta = await fetch(`${URL_USUARIOS}?email=${email}`);
            const usuariosEncontrados = await resposta.json();

            
            const usuario = usuariosEncontrados.find(u => u.senha === senha);

            if (usuario) {
                sessionStorage.setItem('usuarioLogado', JSON.stringify(usuario));
                alert(`Bem-vindo de volta, ${usuario.nome}!`);
                window.location.href = 'index.html';
            } else {
                alert('E-mail ou senha incorretos.');
            }

        } catch (erro) {
            console.error('Erro no login:', erro);
            alert('Não foi possível conectar ao servidor local.');
        }
    });
}