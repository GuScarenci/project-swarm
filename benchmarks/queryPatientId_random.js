'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const fs = require("fs");
const path = require('path');

class QueryPatientIdWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.patientIds = []; // Array para guardar apenas os IDs dos pacientes
    }

    /**
     * Lê o arquivo PATIENTS.csv uma vez e extrai todos os subjectId para a memória.
     */
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        const csvPath = path.resolve(__dirname, 'data', 'PATIENTS.csv');
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        
        // Converte o CSV em um array de IDs
        this.patientIds = fileContent
            .split(/\r?\n/)         // Quebra em linhas
            .slice(1)               // Pula a linha do cabeçalho
            .filter(line => line)   // Remove linhas em branco
            .map(line => line.split(',')[1]); // Pega apenas a segunda coluna (subjectId)

        console.log(`Worker ${workerIndex}: Carregados ${this.patientIds.length} IDs de pacientes para consulta.`);
    }

    /**
     * A cada transação, sorteia um ID válido do array e o consulta.
     */
    async submitTransaction() {
        // Pega um ID aleatório do array de IDs válidos
        const randomIndex = Math.floor(Math.random() * this.patientIds.length);
        const patientIdToQuery = this.patientIds[randomIndex];

        const myArgs = {
            contractId: this.roundArguments.contractId,
            // A função readPatient é mais direta para buscar por chave primária
            contractFunction: 'readPatient', 
            contractArguments: [patientIdToQuery]
        };
        
        // Para queries, use sendRequests, o Caliper identifica como "somente leitura"
        await this.sutAdapter.sendRequests(myArgs);
    }
}

/**
 * Ponto de entrada para o Caliper.
 * @returns {WorkloadModuleBase}
 */
function createWorkloadModule() {
    return new QueryPatientIdWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
