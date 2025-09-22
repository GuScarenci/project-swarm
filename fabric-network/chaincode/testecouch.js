/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// The Contract class is the heart of the high-level contract API
const { Contract } = require('fabric-contract-api');

class TesteCouch extends Contract {

    /**
     * Optional: A constructor can be used to set the contract's unique namespace
     */
    constructor() {
        // Unique name to distinguish this smart contract from others
        super('org.example.testecouch');
    }

    /**
     * initLedger is an optional function to initialize the ledger.
     * In the new API, this is just a regular transaction function that you would call once.
     * @param {Context} ctx the transaction context
     */
    async initLedger(ctx) {
        console.info('=========== Initialized TesteCouch Chaincode ===========');
        return { success: true, message: 'Ledger Initialized Successfully' };
    }

    /**
     * Creates a new patient with the given attributes.
     * @param {Context} ctx The transaction context.
     * @param {string} rowId Unique row identifier.
     * @param {string} subjectId The patient's subject ID, used as the key.
     * @param {string} gender Patient's gender.
     * @param {string} dob Patient's date of birth.
     * @param {string} dod Patient's date of death (can be empty).
     * @param {string} dodHosp Hospital of death (can be empty).
     * @param {string} dodSsn SSN record of death (can be empty).
     * @param {string} expireFlag '0' or '1' indicating status.
     */
    async insertPatient(ctx, rowId, subjectId, gender, dob, dod, dodHosp, dodSsn, expireFlag) {
        console.info('--- start insert patient ---');

        const input = {
            docType: 'patients',
            rowId: rowId,
            subjectId: subjectId,
            gender: gender,
            dob: dob,
            dod: dod,
            dodHosp: dodHosp,
            dodSsn: dodSsn,
            expireFlag: parseInt(expireFlag),
        };

        // Use ctx.stub to access the ledger API
        await ctx.stub.putState(subjectId, Buffer.from(JSON.stringify(input)));

        console.info(`- end insert patient, created: ${subjectId}`);
        return JSON.stringify(input);
    }

    /**
     * Creates a dictionary of items with the given attributes.
     * @param {Context} ctx The transaction context.
     * @param {string} rowId
     * @param {string} itemid The item ID, used as the key.
     * @param {string} label
     * @param {string} abbreviation
     * @param {string} dbsource
     * @param {string} linksto
     * @param {string} category
     * @param {string} unitname
     * @param {string} paramType
     * @param {string} conceptid
     */
    async insertDitem(ctx, rowId, itemid, label, abbreviation, dbsource, linksto, category, unitname, paramType, conceptid) {
        console.info('--- start insert d_item ---');

        const input = {
            docType: 'd_items',
            rowId,
            itemid,
            label,
            abbreviation,
            dbsource,
            linksto,
            category,
            unitname,
            paramType,
            conceptid,
        };

        await ctx.stub.putState(itemid, Buffer.from(JSON.stringify(input)));
        console.info(`- end insert d_item, created: ${itemid}`);
        return JSON.stringify(input);
    }


    /**
     * Retrieves information about a patient by their subject ID.
     * @param {Context} ctx The transaction context.
     * @param {string} subjectId The ID of the patient to retrieve.
     */
    async readPatient(ctx, subjectId) {
        if (!subjectId) {
            throw new Error('Patient subjectId must not be empty');
        }

        const patientAsBytes = await ctx.stub.getState(subjectId);
        if (!patientAsBytes || patientAsBytes.length === 0) {
            throw new Error(`Patient with ID ${subjectId} does not exist`);
        }

        console.log(`Read patient: ${patientAsBytes.toString()}`);
        return patientAsBytes.toString();
    }

    /**
     * Queries for patients using a CouchDB selector query.
     * This is a more flexible way to query than the original `queryPatientById`.
     * @param {Context} ctx The transaction context.
     * @param {string} queryString The CouchDB selector query string.
     */
    async queryPatients(ctx, queryString) {
        console.info('- getQueryResultForQueryString queryString:\n' + queryString);
        const resultsIterator = await ctx.stub.getQueryResult(queryString);
        const results = await this._getAllResults(resultsIterator, false);
        return JSON.stringify(results);
    }

/**
     * Creates a new prescription with the given attributes.
     * @param {Context} ctx The transaction context.
     */
    async insertPrescription(ctx, rowId, subjectId, hadmId, icustayId, startdate, enddate, drugType, drug, drugNamePoe, drugNameGeneric, formularyDrugCd, gsn, ndc, prodStrength, doseValRx, doseUnitRx, formValDisp, formUnitDisp, route) {
        console.info('--- start insert prescription ---');

        const input = {
            docType: 'prescription',
            rowId, subjectId, hadmId, icustayId, startdate, enddate, drugType, drug, drugNamePoe,
            drugNameGeneric, formularyDrugCd, gsn, ndc, prodStrength, doseValRx, doseUnitRx,
            formValDisp, formUnitDisp, route
        };

        await ctx.stub.putState(rowId, Buffer.from(JSON.stringify(input)));
        console.info(`- end insert prescription, created: ${rowId}`);
        return JSON.stringify(input);
    }

    /**
     * Creates a new input event mv with the given attributes.
     * @param {Context} ctx The transaction context.
     */
    async insertInputeventMv(ctx, rowId, subjectId, hadmId, icustayId, starttime, endtime, itemid, amount, amountuom, rate, rateuom, storetime, cgid, orderid, linkorderid, ordercategoryname, secondarycategoryname, ordercomponenttypedescription, ordercategorydescription, patientweight, totalamount, totalamountuom, isopenbag, continueinnextdept, cancelreason, statusdescription, commentsEditedby, commentsCanceledby, commentsDate, originalamount, originalrate) {
        console.info('--- start insert inputevent_mv ---');
        
        const input = {
            docType: 'inputevent_mv',
            rowId, subjectId, hadmId, icustayId, starttime, endtime, itemid, amount, amountuom, rate, rateuom,
            storetime, cgid, orderid, linkorderid, ordercategoryname, secondarycategoryname, ordercomponenttypedescription,
            ordercategorydescription, patientweight, totalamount, totalamountuom, isopenbag, continueinnextdept,
            cancelreason, statusdescription, commentsEditedby, commentsCanceledby, commentsDate, originalamount, originalrate
        };

        await ctx.stub.putState(rowId, Buffer.from(JSON.stringify(input)));
        console.info(`- end insert inputevent_mv, created: ${rowId}`);
        return JSON.stringify(input);
    }


    // =========================================================================================
    // HELPER FUNCTIONS
    // =========================================================================================

    /**
     * Helper function to process an iterator and return all results as an array.
     * @param {StateQueryIterator} iterator The iterator to process.
     * @param {boolean} isHistory Specifies whether the iterator returns history entries.
     * @private
     */
    async _getAllResults(iterator, isHistory) {
        const allResults = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                const jsonRes = {};
                console.log(res.value.value.toString('utf8'));

                if (isHistory) {
                    jsonRes.TxId = res.value.tx_id;
                    jsonRes.Timestamp = res.value.timestamp;
                    try {
                        jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            res = await iterator.next();
        }
        iterator.close();
        return allResults;
    }
}

// Critical line for the new API: export the contract class in a 'contracts' array
module.exports.contracts = [TesteCouch];
