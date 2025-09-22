'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const fs = require("fs");
const path = require('path');

class InsertPatientWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.patientData = [];
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        const csvPath = path.resolve(__dirname, 'data', 'PATIENTS.csv');
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        this.patientData = fileContent.split(/\r?\n/).slice(1).filter(line => line);
        console.log(`Worker ${workerIndex}: Carregados ${this.patientData.length} registros de pacientes.`);
    }

    async submitTransaction() {
        // Pega uma linha aleatória do array de dados
        const randomIndex = Math.floor(Math.random() * this.patientData.length);
        const line = this.patientData[randomIndex];
        const entries = line.split(",");

        const myArgs = {
            contractId: this.roundArguments.contractId, // 'testecouch'
            contractFunction: 'insertPatient',
            contractArguments: [
                entries[0], entries[1], entries[2],
                entries[3], entries[4], entries[5],
                entries[6], entries[7]
            ],
        };
        
        await this.sutAdapter.sendRequests(myArgs);
    }
}

function createWorkloadModule() {
    return new InsertPatientWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
