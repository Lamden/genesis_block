const network = process.argv.slice(2)[0];
const approved_networks = ['staging', 'testnet', 'mainnet']
const fsPromises = require('fs').promises;
const homedir = require('os').homedir();
const path = require('path')

if (!approved_networks.includes(network)) {
    throw new Error(`mssing network arg, must be in ${approved_networks}.`)
}

async function readGenesis() {
    const content = await fsPromises.readFile(path.join(homedir, 'genesis_block.json'))
    .catch(err => {
        throw new Error(`Could not find genesis_block.json in HOME directory; ${homedir}`)
    })

    console.log();

    return JSON.parse(content);
}

function get_butter_size(json_file){
    // convert JSON object to String
    var json_string = JSON.stringify(json_file);
    
    // read json string to Buffer
    const buffer = Buffer.from(json_string);

    return Buffer.byteLength(buffer)
}

function convert_to_MB(buffer_size){
    return buffer_size / 1024 / 1024
}

async function write_file(filename, json_file){
    await fsPromises.writeFile( `./${network}/${filename}`, JSON.stringify(json_file) )
    .catch(err => {
        throw new Error(err)
    })

}


(async () => {
    const genesis_file = await readGenesis();
    const state_changes = genesis_file.genesis

    const genesis_len = state_changes.length

    genesis_file.genesis = []
    await write_file(`genesis_block.json`, genesis_file)

    let files_written = 0
    const chunkSize = 300000;

    let chunk_len = 0

    for (let i = 0; i < state_changes.length; i += chunkSize) {
        const chunk = state_changes.slice(i, i + chunkSize);
        await write_file(`state_changes_${files_written + 1}.json`, chunk)
        chunk_len += chunk.length
        files_written += 1
    }

    console.log(`${files_written} state file written.`)
    console.log(`${genesis_len} state changes written into ${files_written} chunks with ${chunk_len} size.`)

})()
