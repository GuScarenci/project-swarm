'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const fs = require("fs");
const path = require('path');

class InsertDitemWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.ditemData = [];
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        const csvPath = path.resolve(__dirname, 'data', 'D_ITEMS.csv');
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        this.ditemData = fileContent.split(/\r?\n/).slice(1).filter(line => line);
        console.log(`Worker ${workerIndex}: Carregados ${this.ditemData.length} registros de d_items.`);
    }

    async submitTransaction() {
        const randomIndex = Math.floor(Math.random() * this.ditemData.length);
        const line = this.ditemData[randomIndex];
        const entries = line.split(",");

        const myArgs = {
            contractId: this.roundArguments.contractId,
            contractFunction: 'insertDitem',
            contractArguments: [
                entries[0], entries[1], entries[2],
                entries[3], entries[4], entries[5], 
                entries[6], entries[7], entries[8], 
                entries[9]
            ],
        };
        
        await this.sutAdapter.sendRequests(myArgs);
    }
}

function createWorkloadModule() {
    return new InsertDitemWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;

