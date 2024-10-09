require('dotenv').config();

const { IgApiClient, IgCheckpointError } = require('instagram-private-api');
const FS = require('fs');

async function autenticarUsuario(ig, login, password) {
    ig.state.generateDevice(login);
    await ig.account.login(login, password);
}

function lerEstadoCursor(caminhoArquivo) {
    if (FS.existsSync(caminhoArquivo)) {
        const data = FS.readFileSync(caminhoArquivo);
        return JSON.parse(data);
    }
    return null;
}

function salvarEstadoCursor(caminhoArquivo, estado) {
    FS.writeFileSync(caminhoArquivo, JSON.stringify(estado, null, 2));
}

function lerPostagensSalvas(caminhoArquivo) {
    if (FS.existsSync(caminhoArquivo)) {
        const data = FS.readFileSync(caminhoArquivo);
        return JSON.parse(data);
    }
    return [];
}

function salvarPostagensEmArquivo(postagens, caminhoArquivo) {
    FS.writeFileSync(caminhoArquivo, JSON.stringify(postagens, null, 2));
}

async function obterPostagens(ig, username, cursor, delay = 2000) {
    const userId = await ig.user.getIdByUsername(username);
    const feed = ig.feed.user(userId);
    let allPosts = [];
    let totalPosts = 0;

    if (cursor) {
        feed.deserialize(cursor);
    }

    const MAX_RETRIES = 5;
    let retries = 0;

    do {
        try {
            const items = await feed.items();
            allPosts = allPosts.concat(items);
            totalPosts += items.length;
            console.log(`Total de postagens até agora: ${totalPosts}`);

            if (!feed.isMoreAvailable()) break;
            await new Promise(resolve => setTimeout(resolve, delay)); // Delay entre as requisições
        } catch (error) {
            if (error instanceof IgCheckpointError) {
                console.log('Checkpoint necessário. Resolva o desafio no Instagram.');
                await ig.challenge.auto(true); // Tenta resolver o desafio automaticamente
                console.log('Desafio resolvido. Tente novamente.');
                continue; // Tenta novamente após resolver o desafio
            }

            console.log('Erro ao obter postagens:', error);
            if (retries < MAX_RETRIES) {
                retries++;
                const backoffTime = Math.pow(2, retries) * 1000; // Exponential backoff
                console.log(`Erro ao obter postagens, tentando novamente em ${backoffTime / 1000} segundos...`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            } else {
                console.error('Erro ao obter postagens após várias tentativas:', error);
                break;
            }
        }
    } while (true);

    return { allPosts, cursor: feed.serialize() };
}

function exibirPostagens(postagens) {
    postagens.forEach(postagem => {
        console.log(`ID: ${postagem.id}`);
        console.log(`Legenda: ${postagem.caption ? postagem.caption.text : 'Sem legenda'}`);
        console.log(`Tipo de Mídia: ${postagem.media_type}`);
        console.log(`URL da Mídia: ${postagem.image_versions2 ? postagem.image_versions2.candidates[0].url : 'N/A'}`);
        console.log(`Data: ${new Date(postagem.taken_at * 1000).toISOString()}`);
        console.log('----------------------------------');
    });
}

async function listarPostagens() {
    const ig = new IgApiClient();
    const cursorFile = 'cursorState.json';
    const postagensFile = 'postagensFull.json';
    const delay = 2000;

    const { LOGIN, PASSWORD } = process.env;
    if (!LOGIN || !PASSWORD) {
        console.error('Erro: Variáveis de ambiente LOGIN e PASSWORD não definidas.');
        return;
    }

    try {
        await autenticarUsuario(ig, LOGIN, PASSWORD);
        const cursor = lerEstadoCursor(cursorFile);
        const postagensSalvas = lerPostagensSalvas(postagensFile);
        const { allPosts, cursor: newCursor } = await obterPostagens(ig, 'trizzinomotors', cursor, delay);

        const todasPostagens = postagensSalvas.concat(allPosts);

        console.log(`Total de postagens recuperadas: ${todasPostagens.length}`);
        if (todasPostagens.length === 0) {
            console.log('Nenhuma postagem encontrada.');
            return;
        }

        salvarPostagensEmArquivo(todasPostagens, postagensFile);
        exibirPostagens(todasPostagens);
        salvarEstadoCursor(cursorFile, newCursor);
    } catch (error) {
        console.error('Erro ao listar postagens:', error);
    }
}

listarPostagens();