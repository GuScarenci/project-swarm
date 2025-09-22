'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const fs = require("fs");
const path = require('path');
const { parse } = require('csv-parse/sync'); // Importa o parser síncrono

class InsertPrescriptionWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.prescriptionData = [];
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        const csvPath = path.resolve(__dirname, 'data', 'PRESCRIPTIONS.csv');
        console.log(`Worker ${workerIndex}: Lendo e fazendo o parse do arquivo de prescrições: ${csvPath}`);
        
        const fileContent = fs.readFileSync(csvPath);
        
        // Usa o parser para ler o CSV corretamente
        this.prescriptionData = parse(fileContent, {
            columns: false, // Trata cada linha como um array
            from_line: 2,   // Pula a linha do cabeçalho
            skip_empty_lines: true
        });

        console.log(`Worker ${workerIndex}: Carregados ${this.prescriptionData.length} registros de prescrições.`);
    }

    async submitTransaction() {
        // O parser já retorna um array de arrays, não precisamos mais do .split()
        const randomIndex = Math.floor(Math.random() * this.prescriptionData.length);
        const entries = this.prescriptionData[randomIndex];

        const myArgs = {
            contractId: this.roundArguments.contractId,
            contractFunction: 'insertPrescription',
            contractArguments: entries, // O array 'entries' agora está sempre correto
        };
        
        await this.sutAdapter.sendRequests(myArgs);
    }
}

function createWorkloadModule() {
    return new InsertPrescriptionWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
