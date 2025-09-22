'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const fs = require("fs");
const path = require('path');
const readline = require('readline'); // Módulo para ler linha por linha

class InsertInputeventMvWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.inputeventData = [];
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        return new Promise((resolve, reject) => {
            const csvPath = path.resolve(__dirname, 'data', 'INPUTEVENTS_MV.csv');
            console.log(`Worker ${workerIndex}: Lendo o arquivo de eventos em modo streaming: ${csvPath}`);

            const fileStream = fs.createReadStream(csvPath);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            let isFirstLine = true;
            rl.on('line', (line) => {
                if (isFirstLine) {
                    isFirstLine = false;
                    return;
                }
                if (line) {
                    this.inputeventData.push(line);
                }
            });

            rl.on('close', () => {
                console.log(`Worker ${workerIndex}: Carregados ${this.inputeventData.length} registros de eventos.`);
                resolve();
            });

            rl.on('error', (err) => {
                console.error(`Worker ${workerIndex}: Erro ao ler o arquivo de eventos.`, err);
                reject(err);
            });
        });
    }

    async submitTransaction() {
        const randomIndex = Math.floor(Math.random() * this.inputeventData.length);
        const line = this.inputeventData[randomIndex];
        const entries = line.split(",");

        const myArgs = {
            contractId: this.roundArguments.contractId,
            contractFunction: 'insertInputeventMv', // Verifique se este é o nome correto da função
            contractArguments: entries, // Passa todas as 31 colunas
        };
        
        await this.sutAdapter.sendRequests(myArgs);
    }
}

function createWorkloadModule() {
    return new InsertInputeventMvWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
