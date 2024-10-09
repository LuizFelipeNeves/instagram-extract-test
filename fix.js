const FS = require('fs');


const ReadFile = () => {
    const postagens = FS.readFileSync('postagens.json', 'utf8');
    const postagensObj = JSON.parse(postagens);

    const postagensSelected = postagensObj.map(postagem => {
        return {
            id: postagem.id,
            caption: postagem.caption ? postagem.caption.text : 'Sem legenda',
            media_type: postagem.media_type,
            image_url: postagem.image_versions2 ? postagem.image_versions2.candidates[0].url : 'N/A',
            carousel_media: postagem.carousel_media ? postagem.carousel_media.map(media => media.image_versions2.candidates[0].url) : 'N/A',
            date: new Date(postagem.taken_at * 1000).toISOString(),
        }
    });

    console.log('Postagens selecionadas:', postagensSelected.length);

    /*
    postagensObj.slice(0, 5).forEach(postagem => {
        console.log(`ID: ${postagem.id}`);
        console.log(`Legenda: ${postagem.caption ? postagem.caption.text : 'Sem legenda'}`);
        console.log(`Tipo de Mídia: ${postagem.media_type}`);
        console.log(`URL da Mídia: ${postagem.image_versions2 ? postagem.image_versions2.candidates[0].url : 'N/A'}`);
        // console.log(`URLs de Mídia: ${postagem.carousel_media ? postagem.carousel_media.map(media => media.image_versions2.candidates[0].url) : 'N/A'}`);
        console.log(`Data: ${new Date(postagem.taken_at * 1000).toISOString()}`);
        console.log('----------------------------------');
    });*/
}

ReadFile();