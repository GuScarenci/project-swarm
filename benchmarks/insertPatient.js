'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const fs = require("fs");
const path = require('path');

// Contador global para o índice da transação
let txIndex = 0;

class InsertPatientLinearWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.patientData = [];
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
        
        const csvPath = path.resolve(__dirname, 'data', 'PATIENTS.csv');
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        this.patientData = fileContent.split(/\r?\n/).slice(1).filter(line => line);
    }

    async submitTransaction() {
        // Usa o índice sequencial e depois o incrementa
        const line = this.patientData[txIndex % this.patientData.length];
        txIndex++;
        
        const entries = line.split(",");

        const myArgs = {
            contractId: this.roundArguments.contractId,
            contractFunction: 'insertPatient',
            contractArguments: entries.slice(0, 8), // Garante 8 argumentos
        };
        
        await this.sutAdapter.sendRequests(myArgs);
    }
}

function createWorkloadModule() {
    return new InsertPatientLinearWorkload();
}
module.exports.createWorkloadModule = createWorkloadModule;
