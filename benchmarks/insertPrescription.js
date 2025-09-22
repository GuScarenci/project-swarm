'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const fs = require("fs");
const path = require('path');
const readline = require('readline'); // Módulo para ler linha por linha

class InsertPrescriptionWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.prescriptionData = [];
    }

    // Usaremos uma Promise para garantir que o arquivo seja lido completamente antes de iniciar
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        return new Promise((resolve, reject) => {
            const csvPath = path.resolve(__dirname, 'data', 'PRESCRIPTIONS.csv');
            console.log(`Worker ${workerIndex}: Lendo o arquivo de prescrições em modo streaming: ${csvPath}`);
            
            const fileStream = fs.createReadStream(csvPath);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            let isFirstLine = true;
            rl.on('line', (line) => {
                // Pula a linha do cabeçalho
                if (isFirstLine) {
                    isFirstLine = false;
                    return;
                }
                // Adiciona a linha de dados ao array
                if (line) {
                    this.prescriptionData.push(line);
                }
            });

            rl.on('close', () => {
                console.log(`Worker ${workerIndex}: Carregados ${this.prescriptionData.length} registros de prescrições.`);
                resolve(); // Resolve a Promise quando o arquivo terminar de ser lido
            });

            rl.on('error', (err) => {
                console.error(`Worker ${workerIndex}: Erro ao ler o arquivo de prescrições.`, err);
                reject(err); // Rejeita a Promise em caso de erro
            });
        });
    }

    async submitTransaction() {
        const randomIndex = Math.floor(Math.random() * this.prescriptionData.length);
        const line = this.prescriptionData[randomIndex];
        const entries = line.split(",");

        const myArgs = {
            contractId: this.roundArguments.contractId,
            contractFunction: 'insertPrescription',
            contractArguments: entries, // Passa todas as 19 colunas
        };
        
        await this.sutAdapter.sendRequests(myArgs);
    }
}

function createWorkloadModule() {
    return new InsertPrescriptionWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
