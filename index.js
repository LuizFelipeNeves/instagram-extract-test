require('dotenv').config();

const { IgApiClient, IgCheckpointError, IgLoginRequiredError } = require('instagram-private-api');
const FS = require('fs');

const USER_SCRAP = 'banzai_motos'; // trizzinomotors, wrmotos, banzai_motos

async function autenticarUsuario(ig, login, password) {
    ig.state.generateDevice(login);
    await ig.account.login(login, password);
    const serialized = await ig.state.serialize();
    delete serialized.constants; // Remover constantes não necessárias
    FS.writeFileSync('session.json', JSON.stringify(serialized));
}

async function carregarSessao(ig) {
    if (FS.existsSync('session.json')) {
        const session = JSON.parse(FS.readFileSync('session.json', 'utf-8'));
        await ig.state.deserialize(session);
    }
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

async function listarPostagens() {
    const ig = new IgApiClient();
    const cursorFile = 'cursorState.json';
    const postagensFile = 'postagensFull.json';
    const delay = 10000;

    const { LOGIN, PASSWORD } = process.env;
    if (!LOGIN || !PASSWORD) {
        console.error('Erro: Variáveis de ambiente LOGIN e PASSWORD não definidas.');
        return;
    }

    try {
        await carregarSessao(ig);
        if (!ig.state.checkpoint) {
            await autenticarUsuario(ig, LOGIN, PASSWORD);
        }

        const cursor = lerEstadoCursor(cursorFile);
        const postagensSalvas = lerPostagensSalvas(postagensFile);
        const { allPosts, cursor: newCursor } = await obterPostagens(ig, USER_SCRAP, cursor, delay);

        const todasPostagens = postagensSalvas.concat(allPosts);

        console.log(`Total de postagens recuperadas: ${todasPostagens.length}`);
        if (todasPostagens.length === 0) {
            console.log('Nenhuma postagem encontrada.');
            return;
        }

        salvarPostagensEmArquivo(todasPostagens, postagensFile);
        salvarEstadoCursor(cursorFile, newCursor);

        console.log('Postagens salvas com sucesso.');
    } catch (error) {
        if (error instanceof IgLoginRequiredError) {
            console.log('Login necessário. Refazendo login...');
            await autenticarUsuario(ig, LOGIN, PASSWORD);
            return listarPostagens(); // Tenta novamente após refazer o login
        }
        console.error('Erro ao listar postagens:', error);
    }
}

listarPostagens();