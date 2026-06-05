const containerGaleria = document.getElementById('galeria-container');
const containerCronologico = document.getElementById('cronologico-container');
const containerNotas = document.getElementById('notas-container');
const containerDetalhes = document.getElementById('detalhes-container');

const track = document.getElementById('roleta-track');
const btnSortear = document.getElementById('btn-sortear');

let dados = {}

async function carregarDados() {
    try {
        const resposta = await fetch('../db/db.json')

        if (!resposta.ok) {
            throw new Error('Erro ao carregar db.json');
        }

        dados = await resposta.json();
        init();

    } catch (erro) {
        console.error('Erro', erro)
    }
}

function init() {
    let listaFilmes = [...dados.filmes];

    if (containerGaleria) {
        containerGaleria.innerHTML = '';
        listaFilmes.forEach(filme => {
            containerGaleria.innerHTML += `
                <div class="col">
                    <a href="filme-detalhes.html?id=${filme.id}" class="text-decoration-none">
                        <div class="filme-card">
                            <img 
                                src="${filme.posterUrl}" 
                                alt="${filme.nome}" 
                                class="filme-card-poster"
                            >
                            <div class="filme-card-vignette"></div>
                            <div class="filme-card-corner"></div>
                            <div class="filme-card-body">
                                <div class="filme-card-title">
                                    ${filme.nome}
                                </div>
                                <div class="filme-card-meta">
                                    <span>⭐ ${filme.avaliacao}</span>
                                    <span class="separador">|</span>
                                    <span>
                                        ${filme.lancamento.split('/')[2]}
                                    </span>
                                    <span class="separador">|</span>
                                    <span>${filme.duracao}</span>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
    }

    if (containerCronologico) {
        listaFilmes.sort((a, b) => {
            const dataA = a.lancamento.split('/').reverse().join('-');
            const dataB = b.lancamento.split('/').reverse().join('-');
            return new Date(dataA) - new Date(dataB);
        });

        containerCronologico.innerHTML = '';
        listaFilmes.forEach((filme, index) => {
            containerCronologico.innerHTML += criarCardRoadmap(filme, index);
        });
    }

    if (containerNotas) {
        listaFilmes.sort((a, b) => {
            return (
                parseFloat(b.avaliacao.replace(',', '.')) -
                parseFloat(a.avaliacao.replace(',', '.'))
            );
        });

        containerNotas.innerHTML = '';
        listaFilmes.forEach((filme, index) => {
            containerNotas.innerHTML += criarCardRoadmap(filme, index);
        });
    }

    if (containerDetalhes) {
        const params = new URLSearchParams(window.location.search);
        const filmeId = parseInt(params.get('id'));
        const filme = dados.filmes.find(f => f.id === filmeId);

        if (!filme) {
            containerDetalhes.innerHTML = `
                <div class="text-center py-5">
                    <h2 class="text-warning">
                        Filme não encontrado.
                    </h2>
                    <a href="filmes.html" class="qt-card-btn mt-4 d-inline-block">
                        ← Voltar
                    </a>
                </div>
            `;
        } else {
            const elenco = dados.atores
                .filter(ator => ator.personagens.some(p => p.filmeId === filmeId))
                .map(ator => ({
                    ...ator,
                    personagem: ator.personagens.find(p => p.filmeId === filmeId)
                }));

            const elencoHTML = elenco.map(ator => `
                <div class="col-6 col-md-4 col-lg-3">
                    <div class="ator-card">
                        <div class="ator-foto-wrap">
                            <img 
                                src="${ator.fotoUrl}" 
                                alt="${ator.nome}" 
                                class="ator-foto"
                            >
                            <div class="ator-papel-badge">
                                ${ator.personagem.papel}
                            </div>
                        </div>
                        <div class="ator-info">
                            <div class="ator-nome">${ator.nome}</div>
                            <div class="ator-personagem">${ator.personagem.nome}</div>
                        </div>
                    </div>
                </div>
            `).join('');

            const generosHTML = filme.genero
                .map(g => `<span class="filme-genero-tag">${g}</span>`)
                .join('');

            containerDetalhes.innerHTML = `
                <div class="filme-hero">
                    <div 
                        class="filme-hero-bg"
                        style="background-image: url('${filme.posterUrl}');"
                    ></div>
                    <div class="filme-hero-overlay"></div>
                    <div class="filme-hero-content">
                        <div class="filme-hero-poster">
                            <img src="${filme.posterUrl}" alt="${filme.nome}">
                        </div>
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
                </div>
            `;
        }
    }

    if (track && btnSortear) {
        const filmesOriginal = dados.filmes;

        const ITEM_W = 130;
        const ITEM_MX = 10;
        const SLOT_W = ITEM_W + ITEM_MX * 2;
        const REPETICOES = 8;

        function construirRoleta() {
            track.innerHTML = '';
            track.style.transition = 'none';
            track.style.transform = 'translateX(0px)';

            for (let r = 0; r < REPETICOES; r++) {
                filmesOriginal.forEach(filme => {
                    const img = document.createElement('img');
                    img.src = filme.posterUrl;
                    img.alt = filme.nome;
                    img.dataset.filmeId = filme.id;
                    img.style.cssText = `
                        width: ${ITEM_W}px;
                        height: 180px;
                        min-width: ${ITEM_W}px;
                        object-fit: cover;
                        margin: 0 ${ITEM_MX}px;
                        border-radius: 6px;
                        border: 2px solid #2c2d34;
                        flex-shrink: 0;
                        display: block;
                        transition: border-color 0.3s, transform 0.3s;
                    `;
                    img.classList.add('roleta-item');
                    track.appendChild(img);
                });
            }
        }

        construirRoleta();

        let estaGirando = false;
        btnSortear.addEventListener('click', () => {
            if (estaGirando) return;
            estaGirando = true;
            btnSortear.disabled = true;

            document.querySelectorAll('.roleta-item').forEach(el => {
                el.classList.remove('vencedor');
                el.style.borderColor = '#2c2d34';
                el.style.boxShadow = 'none';
                el.style.transform = 'none';
            });

            track.style.transition = 'none';
            track.style.transform = 'translateX(0px)';

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const indiceSorteado = Math.floor(Math.random() * filmesOriginal.length);
                    const filmeSorteado = filmesOriginal[indiceSorteado];
                    const blocoAlvo = REPETICOES - 2;
                    const posicaoNaPista = blocoAlvo * filmesOriginal.length + indiceSorteado;
                    const centroDaFita = posicaoNaPista * SLOT_W + SLOT_W / 2;
                    const viewportWidth = track.parentElement.offsetWidth;
                    const deslocamento = centroDaFita - viewportWidth / 2;

                    track.style.transition = 'transform 5s cubic-bezier(0.1, 1, 0.1, 1)';
                    track.style.transform = `translateX(-${deslocamento}px)`;

                    setTimeout(() => {
                        const todos = track.querySelectorAll('.roleta-item');
                        const elementoVencedor = todos[posicaoNaPista];

                        if (elementoVencedor) {
                            elementoVencedor.style.borderColor = '#f89d13';
                            elementoVencedor.style.boxShadow = '0 0 15px #f89d13';
                            elementoVencedor.style.transform = 'scale(1.05)';
                        }

                        alert(`
                            🎬 Filme Sorteado: ${filmeSorteado.nome}
                            ⭐ Nota: ${filmeSorteado.avaliacao}
                            Sinopse: ${filmeSorteado.sinopse}
                        `);

                        estaGirando = false;
                        btnSortear.disabled = false;
                    }, 5200);
                });
            });
        });
    }
}

function criarCardRoadmap(filme, index) {
    return `
        <div class="col-md-10 mb-4">
            <a href="filme-detalhes.html?id=${filme.id}" class="text-decoration-none">
                <div 
                    class="card bg-black border border-secondary text-white p-3 d-flex flex-column flex-md-row align-items-center gap-4"
                    style="transition: border-color 0.3s;"
                    onmouseover="this.style.borderColor='#f89d13'"
                    onmouseout="this.style.borderColor=''"
                >
                    <span class="display-4 fw-bold text-warning px-3">#${index + 1}</span>
                    <img 
                        src="${filme.posterUrl}" 
                        alt="${filme.nome}" 
                        class="rounded"
                        style="width: 120px; height: 180px; object-fit: cover;"
                    >
                    <div class="flex-grow-1">
                        <h3 class="text-warning mb-1">${filme.nome}</h3>
                        <p class="mb-2 text-white-50">
                            <small>
                                📅 Lançamento: <strong>${filme.lancamento}</strong> | 
                                ⭐ Nota: <strong>${filme.avaliacao}</strong> | 
                                🕒 Duração: ${filme.duracao}
                            </small>
                        </p>
                        <p class="text-light small mb-0">${filme.sinopse}</p>
                    </div>
                </div>
            </a>
        </div>
    `;
}


carregarDados();