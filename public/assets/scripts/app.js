
// CONFIGURAÇÕES GERAIS E SELETORES
const API = 'http://localhost:3001';

const containerGaleria = document.getElementById('galeria-container');
const containerCronologico = document.getElementById('cronologico-container');
const containerNotas = document.getElementById('notas-container');
const containerDetalhes = document.getElementById('detalhes-container');
const containerFavoritos = document.getElementById('favoritos-container');

const track = document.getElementById('roleta-track');
const btnSortear = document.getElementById('btn-sortear');

let dados = {};

// CARREGAMENTO DOS DADOS

async function carregarDados() {
    try {
        const [filmesRes, atoresRes] = await Promise.all([
            fetch(`${API}/filmes_data`),
            fetch(`${API}/atores_data`)
        ]);

        if (!filmesRes.ok || !atoresRes.ok) throw new Error('Erro ao carregar dados da API');

        dados.filmes_data = await filmesRes.json();
        dados.atores_data = await atoresRes.json();

        init();
    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
    }
}
// NAVBAR AUTENTICADA

function configurarNavbarAuth() {
    const navMenu = document.querySelector('header .nav');
    if (!navMenu) return;

    navMenu.querySelectorAll('.auth-item').forEach(el => el.remove());

    const usuarioStr = sessionStorage.getItem('usuarioLogado');

    if (usuarioStr) {
        const usuario = JSON.parse(usuarioStr);
        const isAdmin = usuario.role === 'admin' || usuario.isAdmin === true;

        const iconeHTML = isAdmin
            ? `<i class="bi bi-person-fill-gear"></i>`
            : `<i class="bi bi-person-fill"></i>`;

        const linkAdmin = isAdmin
            ? `<li><a class="dropdown-item py-2" href="admin-crud.html" style="font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;color:#8f1d14;">⚙ Painel Admin</a></li>
               <li><hr class="dropdown-divider border-secondary"></li>`
            : '';

        const dropdown = document.createElement('div');
        dropdown.className = 'auth-item d-inline-block align-self-center ms-2';
        dropdown.innerHTML = `
            <a class="nav-link p-0 d-flex align-items-center gap-2"
               href="#"
               role="button"
               style="cursor:pointer;">
                <span style="font-size:1.3rem;color:#f89d13;">${iconeHTML}</span>
                <span style="font-family:'Cinzel',serif;font-size:0.75rem;letter-spacing:2px;color:#f89d13;text-transform:uppercase;">${usuario.nome}</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end bg-black border border-secondary p-2 mt-2 shadow auth-dropdown" style="min-width:180px;display:none;position:absolute;right:0;z-index:1000;">
                ${linkAdmin}
                <li>
                    <a class="dropdown-item py-2" href="#" id="btn-logout-nav"
                       style="font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.6);">
                        Sair da Conta
                    </a>
                </li>
            </ul>`;

        dropdown.style.position = 'relative';
        navMenu.appendChild(dropdown);

        const toggle = dropdown.querySelector('a');
        const menu = dropdown.querySelector('.auth-dropdown');

        toggle.addEventListener('click', e => {
            e.preventDefault();
            const aberto = menu.style.display === 'block';
            document.querySelectorAll('.auth-dropdown').forEach(m => m.style.display = 'none');
            menu.style.display = aberto ? 'none' : 'block';
        });

        document.addEventListener('click', e => {
            if (!dropdown.contains(e.target)) menu.style.display = 'none';
        });

        dropdown.querySelector('#btn-logout-nav').addEventListener('click', e => {
            e.preventDefault();
            sessionStorage.removeItem('usuarioLogado');
            window.location.href = 'index.html';
        });

    } else {
        const linkLogin = document.createElement('a');
        linkLogin.className = 'nav-link auth-item align-self-center ms-2';
        linkLogin.href = 'login.html';
        linkLogin.style.cssText = 'font-family:"Cinzel",serif;font-size:0.75rem;letter-spacing:2px;color:#f89d13;text-transform:uppercase;';
        linkLogin.textContent = 'Login';
        navMenu.appendChild(linkLogin);
    }
}
// CARD DE EXIBIÇÃO DO FILME
function gerarCardFilme(filme, usuarioObj) {
    let iconeFavoritoHTML = '';

    if (usuarioObj) {
        const isFavorito = usuarioObj.favoritos && usuarioObj.favoritos.includes(parseInt(filme.id));
        const icone = isFavorito ? '♥' : '♡';
        const cor = isFavorito ? '#f89d13' : 'rgba(255,255,255,0.5)';

        iconeFavoritoHTML = `
            <button class="favorito-btn" data-id="${filme.id}"
                style="position:absolute;top:10px;left:10px;z-index:10;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:36px;height:36px;font-size:1.2rem;color:${cor};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color 0.2s,transform 0.2s;"
                title="${isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                ${icone}
            </button>`;
    }

    return `
        <div class="col" style="position:relative;">
            ${iconeFavoritoHTML}
            <a href="filme-detalhes.html?id=${filme.id}" class="text-decoration-none">
                <div class="filme-card">
                    <img src="${filme.posterUrl}" alt="${filme.nome}" class="filme-card-poster">
                    <div class="filme-card-vignette"></div>
                    <div class="filme-card-corner"></div>
                    <div class="filme-card-body">
                        <div class="filme-card-title">${filme.nome}</div>
                        <div class="filme-card-meta">
                            <span>⭐ ${filme.avaliacao}</span>
                            <span class="separador">|</span>
                            <span>${filme.lancamento.split('/')[2]}</span>
                            <span class="separador">|</span>
                            <span>${filme.duracao}</span>
                        </div>
                    </div>
                </div>
            </a>
        </div>`;
}

// SISTEMA DE FAVORITOS

function ativarBotoesFavorito() {
    document.querySelectorAll('.favorito-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.preventDefault();
            e.stopPropagation();

            const usuarioStr = sessionStorage.getItem('usuarioLogado');
            if (!usuarioStr) {
                alert('Faça login para salvar favoritos!');
                window.location.href = 'login.html';
                return;
            }

            let usuario = JSON.parse(usuarioStr);
            if (!usuario.favoritos) usuario.favoritos = [];

            const filmeId = parseInt(btn.getAttribute('data-id'));
            const index = usuario.favoritos.indexOf(filmeId);
            const adicionando = index === -1;

            if (adicionando) {
                usuario.favoritos.push(filmeId);
                btn.innerHTML = '♥';
                btn.style.color = '#f89d13';
                btn.style.transform = 'scale(1.2)';
                setTimeout(() => btn.style.transform = 'scale(1)', 200);
            } else {
                usuario.favoritos.splice(index, 1);
                btn.innerHTML = '♡';
                btn.style.color = 'rgba(255,255,255,0.5)';

                if (containerFavoritos) {
                    btn.closest('.col').remove();
                    if (containerFavoritos.querySelectorAll('.col').length === 0) {
                        containerFavoritos.innerHTML = `
                            <div class="col-12 text-center" style="font-family:'Cinzel',serif;">
                                <h3 class="text-warning mb-3">Nenhum favorito ainda.</h3>
                                <a href="filmes.html" class="qt-card-btn">Ver Filmes</a>
                            </div>`;
                    }
                }
            }


            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuario));

            fetch(`${API}/usuarios/${usuario.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ favoritos: usuario.favoritos })
            }).catch(err => console.error('Erro ao salvar favorito:', err));
        });
    });
}


// FUNÇÃO CENTRAL DE INICIALIZAÇÃO

function init() {
    configurarNavbarAuth();

    const listaFilmes = [...dados.filmes_data];
    const usuarioStr = sessionStorage.getItem('usuarioLogado');
    let usuarioObj = usuarioStr ? JSON.parse(usuarioStr) : null;

    if (usuarioObj) {
        // Sincroniza favoritos do servidor antes de renderizar
        fetch(`${API}/usuarios/${usuarioObj.id}`)
            .then(r => r.json())
            .then(usuarioAtualizado => {
                // Garante que todos os favoritos sejam números
                usuarioObj.favoritos = (usuarioAtualizado.favoritos || []).map(Number);
                sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioObj));
                renderizarPagina(listaFilmes, usuarioObj);
            })
            .catch(() => renderizarPagina(listaFilmes, usuarioObj));
    } else {
        renderizarPagina(listaFilmes, null);
    }
}

function renderizarPagina(listaFilmes, usuarioObj) {

    // ── GALERIA ──────────────────────────────────────────────────────────
    if (containerGaleria) {
        containerGaleria.innerHTML = '';
        listaFilmes.forEach(filme => {
            containerGaleria.innerHTML += gerarCardFilme(filme, usuarioObj);
        });
        ativarBotoesFavorito();
    }

    // ── FAVORITOS ─────────────────────────────────────────────────────────
    if (containerFavoritos) {
        if (!usuarioObj) {
            containerFavoritos.innerHTML = `
                <div class="col-12 text-center" style="font-family:'Cinzel',serif;">
                    <h3 class="mb-4">Faça login para ver seus favoritos.</h3>
                    <a href="login.html" class="qt-card-btn">Fazer Login</a>
                </div>`;
        } else {
            const filmesFav = listaFilmes.filter(f =>
                usuarioObj.favoritos && usuarioObj.favoritos.includes(parseInt(f.id))
            );

            if (filmesFav.length === 0) {
                containerFavoritos.innerHTML = `
                    <div class="col-12 text-center" style="font-family:'Cinzel',serif;">
                        <h3 class="text-warning mb-3">Nenhum favorito ainda.</h3>
                        <a href="filmes.html" class="qt-card-btn">Ver Filmes</a>
                    </div>`;
            } else {
                containerFavoritos.innerHTML = '';
                filmesFav.forEach(filme => {
                    containerFavoritos.innerHTML += gerarCardFilme(filme, usuarioObj);
                });
                ativarBotoesFavorito();
            }
        }
    }

    // ── CRONOLÓGICO ───────────────────────────────────────────────────────
    if (containerCronologico) {
        const lista = [...listaFilmes].sort((a, b) => {
            const dA = a.lancamento.split('/').reverse().join('-');
            const dB = b.lancamento.split('/').reverse().join('-');
            return new Date(dA) - new Date(dB);
        });
        containerCronologico.innerHTML = '';
        lista.forEach((f, i) => containerCronologico.innerHTML += criarCardRoadmap(f, i));
    }

    // ── NOTAS ─────────────────────────────────────────────────────────────
    if (containerNotas) {
        const lista = [...listaFilmes].sort((a, b) =>
            parseFloat(b.avaliacao.replace(',', '.')) - parseFloat(a.avaliacao.replace(',', '.'))
        );
        containerNotas.innerHTML = '';
        lista.forEach((f, i) => containerNotas.innerHTML += criarCardRoadmap(f, i));
    }

    // ── DETALHES ──────────────────────────────────────────────────────────
    if (containerDetalhes) {
        const filmeId = parseInt(new URLSearchParams(window.location.search).get('id'));
        const filme = dados.filmes_data.find(f => f.id == filmeId);

        if (!filme) {
            containerDetalhes.innerHTML = `
                <div class="text-center py-5">
                    <h2 class="text-warning">Filme não encontrado.</h2>
                    <a href="filmes.html" class="qt-card-btn mt-4 d-inline-block">← Voltar</a>
                </div>`;
        } else {
            const elenco = dados.atores_data
                .filter(a => a.personagens.some(p => p.filmeId == filmeId))
                .map(a => ({ ...a, personagem: a.personagens.find(p => p.filmeId == filmeId) }));

            const elencoHTML = elenco.map(a => `
                <div class="col-6 col-md-4 col-lg-3">
                    <div class="ator-card">
                        <div class="ator-foto-wrap">
                            <img src="${a.fotoUrl}" alt="${a.nome}" class="ator-foto">
                            <div class="ator-papel-badge">${a.personagem.papel}</div>
                        </div>
                        <div class="ator-info">
                            <div class="ator-nome">${a.nome}</div>
                            <div class="ator-personagem">${a.personagem.nome}</div>
                        </div>
                    </div>
                </div>`).join('');

            const generosHTML = filme.genero.map(g => `<span class="filme-genero-tag">${g}</span>`).join('');

            containerDetalhes.innerHTML = `
                <div class="filme-hero">
                    <div class="filme-hero-bg" style="background-image:url('${filme.posterUrl}');"></div>
                    <div class="filme-hero-overlay"></div>
                    <div class="filme-hero-content">
                        <div class="filme-hero-poster"><img src="${filme.posterUrl}" alt="${filme.nome}"></div>
                        <div class="filme-hero-info">
                            <div class="qt-card-eyebrow">Quentin Tarantino</div>
                            <h1 class="filme-titulo">${filme.nome}</h1>
                            <div class="filme-meta-row">
                                <span class="filme-meta-item">⭐ ${filme.avaliacao}</span>
                                <span class="filme-meta-sep">·</span>
                                <span class="filme-meta-item">🕒 ${filme.duracao}</span>
                                <span class="filme-meta-sep">·</span>
                                <span class="filme-meta-item">📅 ${filme.lancamento}</span>
                                <span class="filme-meta-sep">·</span>
                                <span class="filme-meta-item">🔞 ${filme.classificacaoIndicativa}</span>
                            </div>
                            <div class="filme-generos">${generosHTML}</div>
                            <p class="filme-sinopse">${filme.sinopse}</p>
                        </div>
                    </div>
                </div>
                <div class="elenco-section">
                    <div class="elenco-header">
                        <div class="qt-card-eyebrow">Elenco</div>
                        <h2 class="elenco-titulo">Atores em Destaque</h2>
                        <div class="bio-divider"></div>
                    </div>
                    <div class="row g-3">${elencoHTML}</div>
                </div>
                <div class="text-center pb-5">
                    <a href="filmes.html" class="qt-card-btn">← Voltar para Filmes</a>
                </div>`;
        }
    }

    // ── ROLETA ────────────────────────────────────────────────────────────
    if (track && btnSortear) {
        const filmesOriginal = dados.filmes_data;
        const ITEM_W = 130, ITEM_MX = 10, SLOT_W = 150, REPETICOES = 8;

        function construirRoleta() {
            track.innerHTML = '';
            track.style.transition = 'none';
            track.style.transform = 'translateX(0px)';
            for (let r = 0; r < REPETICOES; r++) {
                filmesOriginal.forEach(filme => {
                    const img = document.createElement('img');
                    img.src = filme.posterUrl;
                    img.alt = filme.nome;
                    img.style.cssText = `width:${ITEM_W}px;height:180px;min-width:${ITEM_W}px;object-fit:cover;margin:0 ${ITEM_MX}px;border-radius:6px;border:2px solid #2c2d34;flex-shrink:0;display:block;transition:border-color 0.3s,transform 0.3s;`;
                    img.classList.add('roleta-item');
                    track.appendChild(img);
                });
            }
        }

        construirRoleta();
        let estaGirando = false;
        document.getElementById('modal-fechar').addEventListener('click', () => {
            document.getElementById('modal-sorteio').style.display = 'none';
        });

        document.getElementById('modal-sorteio').addEventListener('click', e => {
            if (e.target === document.getElementById('modal-sorteio')) {
                document.getElementById('modal-sorteio').style.display = 'none';
            }
        });

        btnSortear.addEventListener('click', () => {
            if (estaGirando) return;
            estaGirando = true;
            btnSortear.disabled = true;

            document.querySelectorAll('.roleta-item').forEach(el => {
                el.style.borderColor = '#2c2d34';
                el.style.boxShadow = 'none';
                el.style.transform = 'none';
            });

            track.style.transition = 'none';
            track.style.transform = 'translateX(0px)';

            requestAnimationFrame(() => requestAnimationFrame(() => {
                const i = Math.floor(Math.random() * filmesOriginal.length);
                const pos = (REPETICOES - 2) * filmesOriginal.length + i;
                const desl = pos * SLOT_W + SLOT_W / 2 - track.parentElement.offsetWidth / 2;

                track.style.transition = 'transform 5s cubic-bezier(0.1,1,0.1,1)';
                track.style.transform = `translateX(-${desl}px)`;

                setTimeout(() => {
                    const v = track.querySelectorAll('.roleta-item')[pos];
                    if (v) {
                        v.style.borderColor = '#f89d13';
                        v.style.boxShadow = '0 0 15px #f89d13';
                        v.style.transform = 'scale(1.05)';
                    }

                    const modal = document.getElementById('modal-sorteio');
                    document.getElementById('modal-poster').src = filmesOriginal[i].posterUrl;
                    document.getElementById('modal-poster').alt = filmesOriginal[i].nome;
                    document.getElementById('modal-nome').textContent = filmesOriginal[i].nome;
                    document.getElementById('modal-nota').textContent = `⭐ ${filmesOriginal[i].avaliacao} · 🕒 ${filmesOriginal[i].duracao}`;
                    document.getElementById('modal-sinopse').textContent = filmesOriginal[i].sinopse;
                    document.getElementById('modal-link').href = `filme-detalhes.html?id=${filmesOriginal[i].id}`;
                    modal.style.display = 'flex';

                    estaGirando = false;
                    btnSortear.disabled = false;
                }, 5200);
            }));
        });
    }
}

// ROADMAP

function criarCardRoadmap(filme, index) {
    return `
        <div class="col-md-10 mb-4">
            <a href="filme-detalhes.html?id=${filme.id}" class="text-decoration-none">
                <div class="card bg-black border border-secondary text-white p-3 d-flex flex-column flex-md-row align-items-center gap-4"
                    style="transition:border-color 0.3s;"
                    onmouseover="this.style.borderColor='#f89d13'"
                    onmouseout="this.style.borderColor=''">
                    <span class="display-4 fw-bold text-warning px-3">#${index + 1}</span>
                    <img src="${filme.posterUrl}" alt="${filme.nome}" class="rounded" style="width:120px;height:180px;object-fit:cover;">
                    <div class="flex-grow-1">
                        <h3 class="text-warning mb-1">${filme.nome}</h3>
                        <p class="mb-2 text-white-50"><small>📅 ${filme.lancamento} | ⭐ ${filme.avaliacao} | 🕒 ${filme.duracao}</small></p>
                        <p class="text-light small mb-0">${filme.sinopse}</p>
                    </div>
                </div>
            </a>
        </div>`;
}



carregarDados();