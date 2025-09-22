'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const fs = require("fs");
const path = require('path');

// Contador global zerado para a rodada de query
let txIndexQuery = 0;

class QueryPatientLinearWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.patientIds = [];
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        const csvPath = path.resolve(__dirname, 'data', 'PATIENTS.csv');
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        this.patientIds = fileContent.split(/\r?\n/).slice(1).filter(line => line).map(line => line.split(',')[1]);
    }

    async submitTransaction() {
        // Usa o índice sequencial para pegar o mesmo ID que foi inserido
        const patientIdToQuery = this.patientIds[txIndexQuery % this.patientIds.length];
        txIndexQuery++;

        const myArgs = {
            contractId: this.roundArguments.contractId,
            contractFunction: 'readPatient',
            contractArguments: [patientIdToQuery]
        };
        
        await this.sutAdapter.sendRequests(myArgs);
    }
}

function createWorkloadModule() {
    return new QueryPatientLinearWorkload();
}
module.exports.createWorkloadModule = createWorkloadModule;
