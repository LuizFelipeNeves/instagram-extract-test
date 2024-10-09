const FS = require('fs');
const JSONStream = require('JSONStream');

function removerEmojisECaracteresEspeciais(texto) {
    // Define uma regex que captura emojis e caracteres especiais, mantendo números e letras
    const regex = /[^\w\sáéíóúãõçÁÉÍÓÚÃÕÇ0-9#$.,:]/g;
    // Substitui os caracteres que correspondem à regex por uma string vazia
    return texto.replace(regex, '');
}

const marcas = [
    'harley-davidson', 'harley davidson',
    'harleydavidson', 'honda',
    'yamaha', 'kawasaki',
    'suzuki', 'ducati',
    'bmw', 'ktm',
    'triumph', 'aprilia',
    'moto guzzi', 'moto-guzzi',
    'motoguzzi', 'indian motorcycle',
    'indian-motorcycle', 'indianmotorcycle',
    'victory motorcycles', 'victory-motorcycles',
    'victorymotorcycles', 'norton',
    'bsa', 'mv agusta',
    'mv-agusta', 'mvagusta',
    'husqvarna', 'benelli',
    'zontes', 'rieju',
    'royal enfield', 'royal-enfield',
    'royalenfield', 'gas gas',
    'gas-gas', 'gasgas',
    'cfmoto', 'sym',
    'tgb', 'piaggio',
    'vespa', 'lambretta'
];


const ReadFile = () => {
    const postagensFile = 'postagensFull.json';
    const postagensStream = FS.createReadStream(postagensFile, { encoding: 'utf8' });
    const parser = JSONStream.parse('*');

    let owner = null;
    const postagensSelected = [];
    const mediaTypes = { image: 0, video: 0, carousel: 0 };
    const data = { vendidas: [], naoVendidas: [], outros: [] };

    postagensStream.pipe(parser);

    parser.on('data', postagem => {
        if (!owner) {
            owner = {
                name: postagem.user.username,
                id: postagem.user.pk,
                profile_pic: postagem.user.profile_pic_url,
            };
            console.log('Dono da conta:', owner);
        }

        const postagemSelecionada = {
            id: postagem.id,
            owner: postagem.owner.username,
            profile_pic: postagem.owner.profile_pic_url,
            caption: postagem.caption ? postagem.caption.text : 'Sem legenda',
            link: `https://www.instagram.com/p/${postagem.code}`,
            media_type: postagem.media_type,
            type: postagem.media_type === 1 ? 'Imagem' : postagem.media_type === 2 ? 'Vídeo' : postagem.media_type === 8 ? 'Carousel' : 'N/A',
            image_url: postagem.image_versions2 ? postagem.image_versions2.candidates[0].url : 'N/A',
            carousel_media: postagem.carousel_media ? postagem.carousel_media.map(media => media.image_versions2.candidates[0].url) : 'N/A',
            date: new Date(postagem.taken_at * 1000).toISOString(),
        };

        let fixed_caption = removerEmojisECaracteresEspeciais(postagemSelecionada.caption.toLowerCase());
        const hashtags = fixed_caption.match(/#[a-zA-Z0-9_]+/g);

        // Subistitui as hashtags por uma string vazia
        fixed_caption = fixed_caption.replace(/#[a-zA-Z0-9_]+/g, '').trim();

        const rowsCaption = fixed_caption.split('\n');
        
        const make = rowsCaption.find(row => marcas.some(marca => row.includes(marca)))?.trim();

        const price = rowsCaption.find(row => row.includes('r$'));
        const year = rowsCaption.find(row => row.includes('ano:'));
        const km = rowsCaption.find(row => row.includes('km:') || row.includes('zero km'));
        const peso = rowsCaption.find(row => row.includes('kg') && !row.includes('kgfm'));
        const potencia = rowsCaption.find(row => row.includes('cavalos') || row.includes('cv'))?.trim();
        const torque = rowsCaption.find(row => row.includes('kgf'));
        const cilindrada = rowsCaption.find(row => row.includes('cilindradas'));
        const cilindros = rowsCaption.find(row => row.includes('cilindro') || row.includes('cilíndro'));
        const tanque = rowsCaption.find(row => row.includes('tanque'));

        // Ajuste para permitir apenas numeros, pontos, e virgulas
        postagemSelecionada.make = make?.split(' ')[0] ? make?.split(' ')[0] : 'N/A';

        // Sprit by make and model
        postagemSelecionada.model = make?.replace(postagemSelecionada.make, '').trim() ? make?.replace(postagemSelecionada.make, '').trim() : 'N/A';

        postagemSelecionada.price = price ? price.replace(/[^0-9.,]/g, '').trim() : 'N/A';
        postagemSelecionada.year = year ? year.replace('ano:', '').trim() : 'N/A';
        postagemSelecionada.km = km ? km.replace('zero km', '0').replace(/[^0-9.,]/g, '').trim() : 'N/A';
        postagemSelecionada.peso = peso ? peso.replace(/[^0-9.,]/g, '').trim() : 'N/A';
        postagemSelecionada.potencia = potencia ? potencia.split(' ')[0].replace(/[^0-9.,]/g, '').trim() : 'N/A';
        postagemSelecionada.torque = torque ? torque.split('com')[1]?.replace(/[^0-9.,]/g, '').trim() : 'N/A';
        postagemSelecionada.cilindrada = cilindrada ? cilindrada.replace(/[^0-9.,]/g, '').trim().trim() : 'N/A';
        postagemSelecionada.cilindros = cilindros ? cilindros.replace(/[^0-9.,]/g, '').trim().trim() : 'N/A';
        postagemSelecionada.tanque = tanque ? tanque.replace(/[^0-9.,]/g, '').trim().trim() : 'N/A';


        postagemSelecionada.fixed_caption = fixed_caption
        postagemSelecionada.hashtags = hashtags ? hashtags : [];

        postagensSelected.push(postagemSelecionada);

        if (postagemSelecionada.media_type === 1) {
            mediaTypes.image++;
        } else if (postagemSelecionada.media_type === 2) {
            mediaTypes.video++;
        } else if (postagemSelecionada.media_type === 8) {
            mediaTypes.carousel++;
        } else {
            console.log('Tipo de mídia desconhecido:', postagemSelecionada.media_type);
        }

        const title = postagemSelecionada.caption.toLowerCase();
        const includeMotoBranch = ['honda', 'yamaha', 'suzuki', 'kawasaki', 'bmw', 'harley', 'ducati', 'triumph', 'mv agusta', 'aprilia', 'indian', 'dafra', 'ktm'];

        if (title.includes('vendida') || title.includes('vendido')) {
            data.vendidas.push(postagemSelecionada);
        } else if (
            (postagemSelecionada.media_type !== 2 && postagemSelecionada.owner === owner.name) &&

            (((title.includes('R$') || title.includes('valor')) &&
                includeMotoBranch.some(branch => title.includes(branch)) &&
                title.includes('ano:') && (title.includes('km:') || title.includes('zero km')))

                || postagemSelecionada.caption.includes('🟢 DISPONÍVEL 🟢'))
        ) {
            data.naoVendidas.push(postagemSelecionada);
        } else {
            data.outros.push(postagemSelecionada);
        }
    });

    parser.on('end', () => {
        console.log('Postagens selecionadas:', postagensSelected.length, mediaTypes);

        FS.writeFileSync('data-v.json', JSON.stringify(data.vendidas, null, 2));
        FS.writeFileSync('data-nv.json', JSON.stringify(data.naoVendidas, null, 2));
        FS.writeFileSync('data-o.json', JSON.stringify(data.outros, null, 2));

        console.log(`Vendidas: ${data.vendidas.length}, Não vendidas: ${data.naoVendidas.length}, Outros: ${data.outros.length}`);
    });

    parser.on('error', error => {
        console.error('Erro ao processar o arquivo:', error);
    });
};

ReadFile();