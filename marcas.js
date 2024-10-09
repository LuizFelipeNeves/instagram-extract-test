const marcasDeMotos = [
    "Harley-Davidson",
    "Honda",
    "Yamaha",
    "Kawasaki",
    "Suzuki",
    "Ducati",
    "BMW",
    "KTM",
    "Triumph",
    "Aprilia",
    "Moto Guzzi",
    "Indian Motorcycle",
    "Victory Motorcycles",
    "Norton",
    "BSA",
    "MV Agusta",
    "Husqvarna",
    "Benelli",
    "Zontes",
    "Rieju",
    "Royal Enfield",
    "Gas Gas",
    "CFMOTO",
    "SYM",
    "TGB",
    "Piaggio",
    "Vespa",
    "Lambretta"
];

const POSSIVEIS_MARCAS = marcasDeMotos.reduce((acc, marca) => {
    acc.push(marca);
    acc.push(marca.toLowerCase());
    if(marca.includes('-')){
        acc.push(marca.replace('-', ' '));
        acc.push(marca.replace('-', ' ').toLowerCase());
        acc.push(marca.replace('-', ''));
        acc.push(marca.replace('-', '').toLowerCase());
    }
    if(marca.includes(' ')){
        acc.push(marca.replace(' ', '-'));
        acc.push(marca.replace(' ', '-').toLowerCase());
        acc.push(marca.replace(' ', ''));
        acc.push(marca.replace(' ', '').toLowerCase());
    }
    return acc;
}, []).map(marca => marca.toLowerCase());

// Remove duplicados
const UNIQUE_MARCAS = [...new Set(POSSIVEIS_MARCAS)];

console.log(UNIQUE_MARCAS);
