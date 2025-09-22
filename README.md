# project-swarm

Este tutorial visa criar uma rede do Hyperledger Fabric simples com 2 organizações, 2 peers em cada uma um orderer.

Além disso também ensina a fazer o deploy do chaincode abaixo:
```js
'use strict';
const shim = require('fabric-shim');
const util = require('util');

/**
 * Marble asset management chaincode written in node.js, implementing {@link ChaincodeInterface}.
 * @type {SimpleChaincode}
 * @extends {ChaincodeInterface}
 */
let Chaincode = class {
    /**
     * Called during chaincode instantiate and upgrade. This method can be used
     * to initialize asset states.
     * @async
     * @param {ChaincodeStub} stub The chaincode stub is implemented by the fabric-shim
     * library and passed to the {@link ChaincodeInterface} calls by the Hyperledger Fabric platform. The stub
     * encapsulates the APIs between the chaincode implementation and the Fabric peer.
     * @return {Promise<SuccessResponse>} Returns a promise of a response indicating the result of the invocation.
     */
    async Init(stub) {
        let ret = stub.getFunctionAndParameters();
        console.info(ret);
        console.info('=========== Instantiated Marbles Chaincode ===========');
        return shim.success();
    }

    /**
     * Called throughout the life time of the chaincode to carry out business
     * transaction logic and effect the asset states.* The provided functions are the following: initMarble, delete, transferMarble, readMarble, getMarblesByRange,
     * transferMarblesBasedOnColor, queryMarblesByOwner, queryMarbles, getHistoryForMarble.
     * @async
     * @param {ChaincodeStub} stub The chaincode stub is implemented by the fabric-shim
     * library and passed to the {@link ChaincodeInterface} calls by the Hyperledger Fabric platform. The stub
     * encapsulates the APIs between the chaincode implementation and the Fabric peer.
     * @return {Promise<SuccessResponse | ErrorResponse>} Returns a promise of a response indicating the result of the invocation.
     */
    async Invoke(stub) {
        console.info('Transaction ID: ' + stub.getTxID());
        console.info(util.format('Args: %j', stub.getArgs()));

        let ret = stub.getFunctionAndParameters();
        console.info(ret);

        let method = this[ret.fcn];
        if (!method) {
            console.log('no function of name:' + ret.fcn + ' found');
            throw new Error('Received unknown function ' + ret.fcn + ' invocation');
        }
        try {
            let payload = await method(stub, ret.params, this);
            return shim.success(payload);
        } catch (err) {
            console.log(err);
            return shim.error(err);
        }
    }

    /**
     * Creates a new patient with the given attributes.
     * @async
     * @param {ChaincodeStub} stub The chaincode stub.
     * @param {String[]} args The arguments of the function. Index 0: rowId. Index 1: subjectId.
     * Index 2: gender. Index 3: dob. Index 4: dod. Index 5: dodHosp. Index 6: dodSsn.
     * Index 7: expireFlag.
     */
    async insertPatient(stub, args) {
        if (args.length !== 8) {
            throw new Error('Incorrect number of arguments. Expecting 8');
        }
        // ==== Input sanitation ====
        console.log('--- start init patient ---');
        if (args[0].length <= 0) {
            throw new Error('1st argument must be a non-empty string');
        }
        if (args[1].length <= 0) {
            throw new Error('2nd argument must be a non-empty string');
        }
        if (args[2].length <= 0) {
            throw new Error('3rd argument must be a non-empty string');
        }
        if (args[3].length <= 0) {
            throw new Error('4rd argument must be a non-empty string');
        }
        if (args[7].length <= 0) {
            throw new Error('8rd argument must be a non-empty string');
        }

        let rowId = args[0];
        let subjectId = args[1];
        let gender = args[2];
        let dob = args[3];
        let dod = args[4];
        let dodHosp = args[5];
        let dodSsn = args[6];
        let expireFlag = parseInt(args[7]);

        // // ==== Check if an input already exists ====
        // let inputState = await stub.getState(subjectId);
        // if (inputState.toString()) {
        //     throw new Error('This input already exists: ' + subjectId);
        // }

        // ==== Create an object and marshal to JSON ====
        let input = {};
        input.docType = 'patients';
        input.rowId = rowId;
        input.subjectId = subjectId;
        input.gender = gender;
        input.dob = dob;
        input.dod = dod;
        input.dodHosp = dodHosp;
        input.dodSsn = dodSsn;
        input.expireFlag = expireFlag;

        // === Save an input to state ===
        await stub.putState(subjectId, Buffer.from(JSON.stringify(input)));
        let indexName = 'docType~subjectId';
        let subjectNameIndexKey = await stub.createCompositeKey(indexName, [input.docType, input.subjectId]);
        console.info(subjectNameIndexKey);
        //  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
        //  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
        await stub.putState(indexName, Buffer.from(subjectNameIndexKey));
        // ==== Marble saved and indexed. Return success ====
        console.info('- end init patient');

        return Buffer.from(JSON.stringify(input));
    };

    /**
     * Creates a dictionary of items with the given attributes.
     * @async
     * @param {ChaincodeStub} stub The chaincode stub.
     * @param {String[]} args The arguments of the function. Index 0: rowId. Index 1: itemid.
     * Index 2: label. Index 3: abbreviation. Index 4: dbsource. Index 5: linksto.
     * Index 6: category. Index 7: unitname. Index 8: paramType. Index 9: conceptid
     */
    async insertDitem(stub, args) {
        if (args.length !== 10) {
            throw new Error('Incorrect number of arguments. Expecting 10');
        }
        // ==== Input sanitation ====
        console.log('--- start init item dictionary ---');
        if (args[0].length <= 0) {
            throw new Error('1st argument must be a non-empty string');
        }
        if (args[1].length <= 0) {
            throw new Error('2nd argument must be a non-empty string');
        }

        let rowId = args[0];
        let itemid = args[1];
        let label = args[2];
        let abbreviation = args[3];
        let dbsource = args[4];
        let linksto = args[5];
        let category = args[6];
        let unitname = args[7];
        let paramType = args[8];
        let conceptid = args[9];

        // // ==== Check if an input already exists ====
        // let inputState = await stub.getState(itemid);
        // if (inputState.toString()) {
        //     throw new Error('This input already exists: ' + itemid);
        // }

        // ==== Create an object and marshal to JSON ====
        let input = {};
        input.docType = 'd_items';
        input.rowId = rowId;
        input.itemid = itemid;
        input.label = label;
        input.abbreviation = abbreviation;
        input.dbsource = dbsource;
        input.linksto = linksto;
        input.category  = category;
        input.unitname = unitname;
        input.paramType = paramType;
        input.conceptid = conceptid;

        // === Save an input to state ===
        await stub.putState(itemid, Buffer.from(JSON.stringify(input)));
        let indexName = 'itemid';
        let subjectNameIndexKey = await stub.createCompositeKey(indexName, [input.itemid]);
        console.info(subjectNameIndexKey);
        //  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
        //  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
        await stub.putState(subjectNameIndexKey, Buffer.from('\u0000'));
        // ==== Marble saved and indexed. Return success ====
        console.info('- end init item dictionary');

        return Buffer.from(JSON.stringify(input));
    };

    /**
     * Creates a new prescription with the given attributes.
     * @async
     * @param {ChaincodeStub} stub The chaincode stub.
     * @param {String[]} args The arguments of the function. Index 0: rowId. Index 1: subjectId.
     * Index 2: hadmId. Index 3: icustayId. Index 4: startdate. Index 5: enddate. Index 6: drugType.
     * Index 7: drug. Index 8: drugNamePoe. Index 9: drugNameGeneric. Index 10: formularyDrugCd.
     * Index 11: gsn. Index 12: ndc. Index 13: prodStrength. Index 14: doseValRx.
     * Index 15: doseUnitRx. Index 16: formValDisp. Index 17: formUnitDisp.
     * Index 18: route.
     */
    async insertPrescription(stub, args) {
        if (args.length !== 19) {
            throw new Error('Incorrect number of arguments. Expecting 19');
        }
        // ==== Input sanitation ====
        console.log('--- start init prescription ---');
        if (args[0].length <= 0) {
            throw new Error('1st argument must be a non-empty string');
        }
        if (args[1].length <= 0) {
            throw new Error('2nd argument must be a non-empty string');
        }
        if (args[2].length <= 0) {
            throw new Error('3rd argument must be a non-empty string');
        }
        if (args[6].length <= 0) {
            throw new Error('7rd argument must be a non-empty string');
        }
        if (args[7].length <= 0) {
            throw new Error('8rd argument must be a non-empty string');
        }

        let rowId = args[0];
        let subjectId = args[1];
        let hadmId = args[2];
        let icustayId = args[3];
        let startdate = args[4];
        let enddate = args[5];
        let drugType = args[6];
        let drug = args[7];
        let drugNamePoe = args[8];
        let drugNameGeneric = args[9];
        let formularyDrugCd = args[10];
        let gsn = args[11];
        let ndc = args[12];
        let prodStrength = args[13];
        let doseValRx = args[14];
        let doseUnitRx = args[15];
        let formValDisp = args[16];
        let formUnitDisp = args[17];
        let route = args[18];

        // // ==== Check if an input already exists ====
        // let inputState = await stub.getState(rowId);
        // if (inputState.toString()) {
        //     throw new Error('This input already exists: ' + rowId);
        // }

        // ==== Create an object and marshal to JSON ====
        let input = {};
        input.docType = 'prescription';
        input.rowId = rowId;
        input.subjectId = subjectId;
        input.hadmId = hadmId;
        input.icustayId = icustayId;
        input.startdate = startdate;
        input.enddate = enddate;
        input.drugType = drugType;
        input.drug = drug;
        input.drugNamePoe = drugNamePoe;
        input.drugNameGeneric = drugNameGeneric;
        input.formularyDrugCd = formularyDrugCd;
        input.gsn = gsn;
        input.ndc = ndc;
        input.prodStrength = prodStrength;
        input.doseValRx = doseValRx;
        input.doseUnitRx = doseUnitRx;
        input.formValDisp = formValDisp;
        input.formUnitDisp = formUnitDisp;
        input.route = route;

        // === Save an input to state ===
        await stub.putState(rowId, Buffer.from(JSON.stringify(input)));
        let indexName = 'rowId';
        let subjectNameIndexKey = await stub.createCompositeKey(indexName, [input.rowId]);
        console.info(subjectNameIndexKey);
        //  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
        //  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
        await stub.putState(subjectNameIndexKey, Buffer.from('\u0000'));
        // ==== Marble saved and indexed. Return success ====
        console.info('- end init prescription');

        return Buffer.from(JSON.stringify(input));
    };


    /**
     * Creates a new input event mv with the given attributes.
     * @async
     * @param {ChaincodeStub} stub The chaincode stub.
     * @param {String[]} args The arguments of the function. Index 0: rowId. Index 1: subjectId.
     * Index 2: hadmId. Index 3: icustayId. Index 4: starttime. Index 5: endtime. Index 6: itemid.
     * Index 7: amount. Index 8: amountuom. Index 9: rate. Index 10: rateuom.
     * Index 11: storetime. Index 12: cgid. Index 13: orderid. Index 14: linkorderid.
     * Index 15: ordercategoryname. Index 16: secondarycategoryname. Index 17: ordercomponenttypedescription.
     * Index 18: ordercategorydescription. Index 19: patientweight. Index 20: totalamount. Index 21: totalamountuom.
     * Index 22: isopenbag. Index 23: continueinnextdept. Index 24: cancelreason. Index 25: statusdescription.
     * Index 26: commentsEditedby. Index 27: commentsCanceledby. Index 28: commentsDate.
     * Index 29: originalamount. Index 30: originalrate.
     */
    async insertInputeventMv(stub, args) {
        if (args.length !== 31) {
            throw new Error('Incorrect number of arguments. Expecting 31');
        }
        // ==== Input sanitation ====
        console.log('--- start init input event mv ---');
        if (args[0].length <= 0) {
            throw new Error('1st argument must be a non-empty string');
        }
        if (args[1].length <= 0) {
            throw new Error('2nd argument must be a non-empty string');
        }

        let rowId = args[0];
        let subjectId = args[1];
        let hadmId = args[2];
        let icustayId = args[3];
        let starttime = args[4]
        let endtime = args[5];
        let itemid = args[6];
        let amount = args[7];
        let amountuom = args[8];
        let rate = args[9];
        let rateuom = args[10];
        let storetime = args[11];
        let cgid = args[12];
        let orderid = args[13];
        let linkorderid = args[14];
        let ordercategoryname = args[15];
        let secondarycategoryname = args[16];
        let ordercomponenttypedescription = args[17];
        let ordercategorydescription = args[18];
        let patientweight = args[19];
        let totalamount = args[20];
        let totalamountuom = args[21];
        let isopenbag = args[22];
        let continueinnextdept = args[23];
        let cancelreason = args[24];
        let statusdescription = args[25];
        let commentsEditedby = args[26];
        let commentsCanceledby = args[27];
        let commentsDate = args[28];
        let originalamount = args[29];
        let originalrate = args[30];

        // // ==== Check if an input already exists ====
        // let inputState = await stub.getState(rowId);
        // if (inputState.toString()) {
        //     throw new Error('This input already exists: ' + rowId);
        // }

        // ==== Create an object and marshal to JSON ====
        let input = {};
        input.docType = 'inputeventmv';
        input.rowId = rowId;
        input.subjectId = subjectId;
        input.hadmId = hadmId;
        input.icustayId = icustayId;
        input.starttime = starttime;
        input.endtime = endtime;
        input.itemid = itemid;
        input.amount = amount;
        input.amountuom = amountuom;
        input.rate = rate;
        input.rateuom = rateuom;
        input.storetime = storetime;
        input.cgid = cgid;
        input.orderid = orderid;
        input.linkorderid = linkorderid;
        input.ordercategoryname = ordercategoryname;
        input.secondarycategoryname = secondarycategoryname;
        input.ordercomponenttypedescription = ordercomponenttypedescription;
        input.ordercategorydescription = ordercategorydescription;
        input.patientweight = patientweight;
        input.totalamount = totalamount;
        input.totalamountuom = totalamountuom;
        input.isopenbag = isopenbag;
        input.continueinnextdept = continueinnextdept;
        input.cancelreason = cancelreason;
        input.statusdescription = statusdescription;
        input.commentsEditedby = commentsEditedby;
        input.commentsCanceledby = commentsCanceledby;
        input.commentsDate = commentsDate;
        input.originalamount = originalamount;
        input.originalrate = originalrate;

        // === Save an input to state ===
        await stub.putState(rowId, Buffer.from(JSON.stringify(input)));
        let indexName = 'rowId';
        let subjectNameIndexKey = await stub.createCompositeKey(indexName, [input.rowId]);
        console.info(subjectNameIndexKey);
        //  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
        //  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
        await stub.putState(subjectNameIndexKey, Buffer.from('\u0000'));
        // ==== Marble saved and indexed. Return success ====
        console.info('- end init input event mv');

        return Buffer.from(JSON.stringify(input));
    };

    /**
     * Creates a new input event cv with the given attributes.
     * @async
     * @param {ChaincodeStub} stub The chaincode stub.
     * @param {String[]} args The arguments of the function. Index 0: rowId. Index 1: subjectId.
     * Index 2: hadmId. Index 3: icustayId. Index 4: charttime. Index 5: itemid. Index 6: amount.
     * Index 7: amountuom. Index 8: rate. Index 9: rateuom. Index 10: storetime.
     * Index 11: cgid. Index 12: orderid. Index 13: linkorderid. Index 14: stopped.
     * Index 15: newbottle. Index 16: originalamountuom. Index 17: originalroute.
     * Index 18: originalrate. Index 19: originalrateuom. Index 20: originalsite.
     */
    async insertInputeventCv(stub, args) {
        if (args.length !== 21) {
            throw new Error('Incorrect number of arguments. Expecting 21');
        }
        // ==== Input sanitation ====
        console.log('--- start init input event cv ---');
        if (args[0].length <= 0) {
            throw new Error('1st argument must be a non-empty string');
        }
        if (args[1].length <= 0) {
            throw new Error('2nd argument must be a non-empty string');
        }

        let rowId = args[0];
        let subjectId = args[1];
        let hadmId = args[2];
        let icustayId = args[3];
        let charttime = args[4]
        let itemid = args[5];
        let amount = args[6];
        let amountuom = args[7];
        let rate = args[8];
        let rateuom = args[9];
        let storetime = args[10];
        let cgid = args[11];
        let orderid = args[12];
        let linkorderid = args[13];
        let stopped = args[14];
        let newbottle = args[15];
        let originalamountuom = args[16];
        let originalroute = args[17];
        let originalrate = args[18];
        let originalrateuom = args[19];
        let originalsite = args[20];

        // ==== Check if an input already exists ====
        let inputState = await stub.getState(rowId);
        if (inputState.toString()) {
            throw new Error('This input already exists: ' + rowId);
        }

        // ==== Create an object and marshal to JSON ====
        let input = {};
        input.docType = 'inputeventcv';
        input.rowId = rowId;
        input.subjectId = subjectId;
        input.hadmId = hadmId;
        input.icustayId = icustayId;
        input.charttime = charttime;
        input.itemid = itemid;
        input.amount = amount;
        input.amountuom = amountuom;
        input.rate = rate;
        input.rateuom = rateuom;
        input.storetime = storetime;
        input.cgid = cgid;
        input.orderid = orderid;
        input.linkorderid = linkorderid;
        input.stopped = stopped;
        input.newbottle = newbottle;
        input.originalamountuom = originalamountuom;
        input.originalroute = originalroute;
        input.originalrate = originalrate;
        input.originalrateuom = originalrateuom;
        input.originalsite = originalsite;

        // === Save an input to state ===
        await stub.putState(rowId, Buffer.from(JSON.stringify(input)));
        let indexName = 'rowId';
        let subjectNameIndexKey = await stub.createCompositeKey(indexName, [input.rowId]);
        console.info(subjectNameIndexKey);
        //  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
        //  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
        await stub.putState(subjectNameIndexKey, Buffer.from('\u0000'));
        // ==== Marble saved and indexed. Return success ====
        console.info('- end init input event cv');
    };


    /**
    * Gets the results of a specified iterator.* @async
    * @param {Object} iterator The iterator to use.
    * @param {Boolean} isHistory Specifies whether the iterator returns history entries or not.
    * @return {Promise<Object[]>} The array of results in JSON format.
    */
    async getAllResults(iterator, isHistory) {
       let allResults = [];
       let hasNext = true;
        while (hasNext) {
           let res;
           try {
               res = await iterator.next();
            } catch (err) {
               hasNext = false;
               continue;
            }

            if (res.value && res.value.value.toString()) {
               let jsonRes = {};
               console.log(res.value.value.toString('utf8'));

                if (isHistory && isHistory === true) {
                   jsonRes.TxId = res.value.tx_id;
                   jsonRes.Timestamp = res.value.timestamp;
                   jsonRes.IsDelete = res.value.is_delete.toString();
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
            if (res.done) {
               console.log('end of data');
               await iterator.close();
               console.info(allResults);
               return allResults;
            }
        }
    }

   /**
    * Executes the provided query string.
    * Result set is built and returned as a byte array containing the JSON results.
    * @async
    * @param {ChaincodeStub} stub The chaincode stub.
    * @param {String} queryString The query string to execute.
    * @param {Chaincode} thisObject The chaincode object context.
    * @return {Promise<Buffer>} The results of the specified query.
    */
    async getQueryResultForQueryString(stub, queryString, thisObject) {

       console.info('- getQueryResultForQueryString queryString:\n' + queryString);
       let resultsIterator = await stub.getQueryResult(queryString);

       let results = await thisObject.getAllResults(resultsIterator, false);

       return Buffer.from(JSON.stringify(results));
    }

    /**
     * Queries for patient based on a passed id.
     * @async
     * @param {ChaincodeStub} stub The chaincode stub.
     * @param {String[]} args The arguments of the function. Index 0: patient id.
     * @param {Chaincode} thisObject The chaincode object context.
     * @return {Promise<Buffer>} The patient of the specified id.
     */
    async queryPatientById(stub, args, thisClass) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting patient id.');
        }

        let subjectId  = args[0];
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'patients';
        queryString.selector.subjectId = subjectId;
        let method = thisClass['getQueryResultForQueryString'];
        let queryResults = await method(stub, JSON.stringify(queryString), thisClass);

        return queryResults;
    }

    /**
     * Retrieves the information about a patient.
     * @async
     * @param {ChaincodeStub} stub The chaincode stub.
     * @param {String[]} args The arguments of the function. Index 0: subejctId.
     * @return {Promise<Object[]>} The byte representation of the marble.
     */
     async readPatient(stub, args) {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting subjectId');
        }

        //let docType = args[0];
        let subjectId = args[0];
        if (!subjectId) {
            throw new Error('Patient id must not be empty');
        }
        // let docTypeResultsIterator = await stub.getStateByPartialCompositeKey('docType~subjectId', [docType]);

        // //let method = thisClass['transferMarble'];
        // // Iterate through result set and for each marble found, transfer to newOwner
        // //while (true) {
        // let responseRange = await docTypeResultsIterator;
        // if (!responseRange || !responseRange.value || !responseRange.value.key) {
        //     return;
        // }
        // // console.log(responseRange.value.key);

        // // // let value = res.value.value.toString('utf8');
        // let objectType;
        // let attributes;
        // ({
        //     objectType,
        //     attributes
        // } = await stub.splitCompositeKey(responseRange.value.key));

        // return Buffer.from(JSON.stringify(responseRange));

        //let returneddocType = attributes[0];
        //let returnedsubjectId = attributes[1];
        //console.info(util.format('- found a marble from index:%s color:%s name:%s\n', objectType, returneddocType, returnedsubjectId));

            // Now call the transfer function for the found marble.
            // Re-use the same function that is used to transfer individual marbles
            //let response = await method(stub, [returnedMarbleName, newOwner]);
        //}

        let patientAsBytes = await stub.getState(subjectId);
        if (!patientAsBytes.toString()) {
            let jsonResp = {};
            jsonResp.Error = 'Patient does not exist: ' + subjectId;
            throw new Error(JSON.stringify(jsonResp));
        }
        console.info('=======================================');
        console.log(patientAsBytes.toString());
        console.info('=======================================');
        return patientAsBytes;

        //return docTypeResultsIterator;
    }




};

shim.start(new Chaincode());

```

Nesse projeto, cada nó da rede rodará em uma máquina virtual separada, estas estão na mesma rede.

# 1. Pré-requisitos ( Em TODAS as 4 VMs)

1. Instale softwares que são pré-requisitos
```bash
# INSTALL GIT
$ sudo apt-get install git
#INSTALL CURL
$ sudo apt-get install curl
#INSTALL DOCKER
sudo apt-get -y install docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker <username>
```

2.  Instale o Fabric e os exemplos do Fabric
```bash
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh

./install-fabric.sh -h
```

3. Arraste a pasta `bin` dentro de fabric-samples para um local mais acessível e depois adcione esse diretório a variável PATH:
```bash
export PATH=${PWD}/../bin:$PATH
```

4. Instale o Node.js na VM1:
```bash
sudo apt-get install -y nodejs
```

## Configure o Docker Swarm:

1. Na VM 1 (Manager):
Anote o endereço IP local desta VM
```bash
docker swarm init --advertise-addr [IP_DA_SUA_VM_1]
```
O comando acima irá gerar um token de join, algo como: 
```bash
docker swarm join --token SWMTKN-1-abc... [IP_DA_SUA_VM_1]:2377
```
 **Copie este comando completo.**
 Nas VMs 2, 3 e 4 (Workers): Cole e execute o comando `docker swarm join...` que você copiou do manager.
 3. Verifique o Swarm na VM1:
```bash
 docker node ls
```
 
## Gerando os artefatos da Rede (Apenas na VM1).
1. Crie uma Estrutura de Pastas:
```bash
mkdir ~/fabric-network
cd ~/fabric-network
```

2. Crie o `crypto-config.yaml`:
Este arquivo define a topologia da rede (organizações, peers).
```yaml
# Crie um arquivo chamado crypto-config.yaml

OrdererOrgs:
  - Name: Orderer
    Domain: example.com
    Specs:
      - Hostname: orderer

PeerOrgs:
  - Name: Org1
    Domain: org1.example.com
    EnableNodeOUs: true
    Template:
      Count: 2 # Cria peer0 e peer1
    Users:
      Count: 1

  - Name: Org2
    Domain: org2.example.com
    EnableNodeOUs: true
    Template:
      Count: 2 # Cria peer0 e peer1
    Users:
      Count: 1
```

3. Crie o `configtx.yaml`:
Este arquivo define o canal e o bloco gênesis.
```yaml
Organizations:
    - &OrdererOrg
        Name: OrdererMSP
        ID: OrdererMSP
        MSPDir: crypto-config/ordererOrganizations/example.com/msp
        Policies:
            Readers: {Type: Signature, Rule: "OR('OrdererMSP.member')"}
            Writers: {Type: Signature, Rule: "OR('OrdererMSP.member')"}
            Admins: {Type: Signature, Rule: "OR('OrdererMSP.admin')"}

    - &Org1
        Name: Org1MSP
        ID: Org1MSP
        MSPDir: crypto-config/peerOrganizations/org1.example.com/msp
        Policies:
            Readers: {Type: Signature, Rule: "OR('Org1MSP.admin', 'Org1MSP.peer', 'Org1MSP.client')"}
            Writers: {Type: Signature, Rule: "OR('Org1MSP.admin', 'Org1MSP.client')"}
            Admins: {Type: Signature, Rule: "OR('Org1MSP.admin')"}
            Endorsement: {Type: Signature, Rule: "OR('Org1MSP.peer')"}
        AnchorPeers:
            - Host: peer0.org1.example.com
              Port: 7051

    - &Org2
        Name: Org2MSP
        ID: Org2MSP
        MSPDir: crypto-config/peerOrganizations/org2.example.com/msp
        Policies:
            Readers: {Type: Signature, Rule: "OR('Org2MSP.admin', 'Org2MSP.peer', 'Org2MSP.client')"}
            Writers: {Type: Signature, Rule: "OR('Org2MSP.admin', 'Org2MSP.client')"}
            Admins: {Type: Signature, Rule: "OR('Org2MSP.admin')"}
            Endorsement: {Type: Signature, Rule: "OR('Org2MSP.peer')"}
        AnchorPeers:
            - Host: peer0.org2.example.com
              Port: 9051

Capabilities:
    Channel: &ChannelCapabilities
        V2_0: true
    Orderer: &OrdererCapabilities
        V2_0: true
    Application: &ApplicationCapabilities
        V2_0: true

Channel: &ChannelDefaults
    Policies:
        Readers: {Type: ImplicitMeta, Rule: "ANY Readers"}
        Writers: {Type: ImplicitMeta, Rule: "ANY Writers"}
        Admins: {Type: ImplicitMeta, Rule: "MAJORITY Admins"}
    Capabilities:
        <<: *ChannelCapabilities

Application: &ApplicationDefaults
    Organizations:
    Policies:
        Readers: {Type: ImplicitMeta, Rule: "ANY Readers"}
        Writers: {Type: ImplicitMeta, Rule: "ANY Writers"}
        Admins: {Type: ImplicitMeta, Rule: "MAJORITY Admins"}
        # A MUDANÇA CRUCIAL PARA O NOSSO WORKAROUND:
        LifecycleEndorsement: {Type: ImplicitMeta, Rule: "ANY Endorsement"}
        Endorsement: {Type: ImplicitMeta, Rule: "MAJORITY Endorsement"}
    Capabilities:
        <<: *ApplicationCapabilities

Orderer: &OrdererDefaults
    OrdererType: etcdraft
    EtcdRaft:
        Consenters:
        - Host: orderer.example.com
          Port: 7050
          ClientTLSCert: crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
          ServerTLSCert: crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
    Addresses:
        - orderer.example.com:7050
    BatchTimeout: 2s
    BatchSize:
        MaxMessageCount: 10
        AbsoluteMaxBytes: 99 MB
        PreferredMaxBytes: 512 KB
    Organizations:
    Policies:
        Readers: {Type: ImplicitMeta, Rule: "ANY Readers"}
        Writers: {Type: ImplicitMeta, Rule: "ANY Writers"}
        Admins: {Type: ImplicitMeta, Rule: "MAJORITY Admins"}
        BlockValidation: {Type: ImplicitMeta, Rule: "ANY Writers"}

Profiles:
    TwoOrgsOrdererGenesis:
        <<: *ChannelDefaults
        Orderer:
            <<: *OrdererDefaults
            Organizations:
                - *OrdererOrg
            Capabilities:
                <<: *OrdererCapabilities
        Consortiums:
            SampleConsortium:
                Organizations:
                    - *Org1
                    - *Org2
    TwoOrgsChannel:
        <<: *ChannelDefaults
        Consortium: SampleConsortium
        Application:
            <<: *ApplicationDefaults
            Organizations:
                - *Org1
                - *Org2
            Capabilities:
                <<: *ApplicationCapabilities

```

4. Gere os Artefatos:
```bash
# Gerar os certificados e chaves
cryptogen generate --config=./crypto-config.yaml

# Criar a pasta para os artefatos do canal
mkdir channel-artifacts

# Gerar o bloco gênesis
configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./channel-artifacts/genesis.block -channelID system-channel

# Gerar a transação de criação do canal
configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/mychannel.tx -channelID mychannel

# Gerar os anchor peers para cada organização
configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP
configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors.tx -channelID mychannel -asOrg Org2MSP
```
Agora temos as pastas `crypto-config` e  `channel-artifacts` prontas.

## 4. Preparando o Chaincode e o Arquivo de Deploy

Na pasta `\chaincode` salve o código e o `package.json`
```
{
    "name": "testecouch",
    "version": "1.0.0",
    "description": "testeCouch chaincode implemented in node.js",
    "main": "testecouch.js",
    "engines": {
        "node": ">=18"
    },
    "scripts": {
        "start": "fabric-chaincode-node start"
    },
    "license": "Apache-2.0",
    "dependencies": {
        "fabric-shim": "~2.5.5"
    }
}

```

3. Crie o Arquivo `docker-compose-swarm.yaml`:

```yaml
version: '3.7'

volumes:
  peer0-org1-data:
  peer1-org1-data:
  peer0-org2-data:
  peer1-org2-data:
  couchdb0-org1-data: # <-- ADICIONADO
  couchdb1-org1-data: # <-- ADICIONADO
  couchdb0-org2-data: # <-- ADICIONADO
  couchdb1-org2-data: # <-- ADICIONADO

networks:
  fabric-net:
    driver: overlay
    attachable: true

services:
  orderer:
    image: hyperledger/fabric-orderer:2.5.5
    hostname: orderer.example.com
    # ... (configuração do orderer continua a mesma) ...
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_GENESISMETHOD=file
      - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
      - ORDERER_GENERAL_TLS_ENABLED=true
      - ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
    volumes:
      - ./channel-artifacts/genesis.block:/var/hyperledger/orderer/orderer.genesis.block
      - ./crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp:/var/hyperledger/orderer/msp
      - ./crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/:/var/hyperledger/orderer/tls
    ports:
      - 7050:7050
    networks:
      - fabric-net
    deploy:
      placement:
        constraints:
          - node.hostname == hal13-vm1

  couchdb0-org1: # <-- SERVIÇO NOVO
    image: couchdb:3.3.3
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=adminpw
    ports:
      - "5984:5984"
    volumes:
      - couchdb0-org1-data:/opt/couchdb/data
    networks:
      - fabric-net
    deploy:
      placement:
        constraints:
          - node.hostname == hal13-vm1

  peer0-org1:
    image: hyperledger/fabric-peer:2.5.5
    hostname: peer0.org1.example.com
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=fabric_fabric-net
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_ID=peer0.org1.example.com
      - CORE_PEER_ADDRESS=peer0.org1.example.com:7051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:7051
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer1-org1:8051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.org1.example.com:7051
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_PEER_MSPCONFIGPATH=/var/hyperledger/fabric/msp
      - CORE_LEDGER_STATE_STATEDATABASE=CouchDB # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb0-org1:5984 # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=admin # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=adminpw # <-- ADICIONADO
    volumes:
      - /var/run/:/host/var/run/
      - peer0-org1-data:/var/hyperledger/production
      - ./crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp:/var/hyperledger/fabric/msp
      - ./crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls:/var/hyperledger/fabric/config/tls
    ports:
      - 7051:7051
    networks:
      - fabric-net
    deploy:
      placement:
        constraints:
          - node.hostname == hal13-vm1

  couchdb1-org1: # <-- SERVIÇO NOVO
    image: couchdb:3.3.3
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=adminpw
    ports:
      - "6984:5984"
    volumes:
      - couchdb1-org1-data:/opt/couchdb/data
    networks:
      - fabric-net
    deploy:
      placement:
        constraints:
          - node.hostname == hal13-vm2

  peer1-org1:
    image: hyperledger/fabric-peer:2.5.5
    hostname: peer1.org1.example.com
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=fabric_fabric-net
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_ID=peer1.org1.example.com
      - CORE_PEER_ADDRESS=peer1.org1.example.com:8051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:8051
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0-org1:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer1.org1.example.com:8051
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_PEER_MSPCONFIGPATH=/var/hyperledger/fabric/msp
      - CORE_LEDGER_STATE_STATEDATABASE=CouchDB # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb1-org1:5984 # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=admin # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=adminpw # <-- ADICIONADO
    volumes:
      - /var/run/:/host/var/run/
      - peer1-org1-data:/var/hyperledger/production
      - ./crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/msp:/var/hyperledger/fabric/msp
      - ./crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls:/var/hyperledger/fabric/config/tls
    ports:
      - 8051:8051
    networks:
      - fabric-net
    deploy:
      placement:
        constraints:
          - node.hostname == hal13-vm2

  couchdb0-org2: # <-- SERVIÇO NOVO
    image: couchdb:3.3.3
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=adminpw
    ports:
      - "7984:5984"
    volumes:
      - couchdb0-org2-data:/opt/couchdb/data
    networks:
      - fabric-net
    deploy:
      placement:
        constraints:
          - node.hostname == hal13-vm3

  peer0-org2:
    image: hyperledger/fabric-peer:2.5.5
    hostname: peer0.org2.example.com
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=fabric_fabric-net
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_ID=peer0.org2.example.com
      - CORE_PEER_ADDRESS=peer0.org2.example.com:9051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:9051
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer1-org2:10051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.org2.example.com:9051
      - CORE_PEER_LOCALMSPID=Org2MSP
      - CORE_PEER_MSPCONFIGPATH=/var/hyperledger/fabric/msp
      - CORE_LEDGER_STATE_STATEDATABASE=CouchDB # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb0-org2:5984 # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=admin # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=adminpw # <-- ADICIONADO
    volumes:
      - /var/run/:/host/var/run/
      - peer0-org2-data:/var/hyperledger/production
      - ./crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp:/var/hyperledger/fabric/msp
      - ./crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls:/var/hyperledger/fabric/config/tls
    ports:
      - 9051:9051
    networks:
      - fabric-net
    deploy:
      placement:
        constraints:
          - node.hostname == hal13-vm3

  couchdb1-org2: # <-- SERVIÇO NOVO
    image: couchdb:3.3.3
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=adminpw
    ports:
      - "8984:5984"
    volumes:
      - couchdb1-org2-data:/opt/couchdb/data
    networks:
      - fabric-net
    deploy:
      placement:
        constraints:
          - node.hostname == hal13-vm4

  peer1-org2:
    image: hyperledger/fabric-peer:2.5.5
    hostname: peer1.org2.example.com
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=fabric_fabric-net
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_ID=peer1.org2.example.com
      - CORE_PEER_ADDRESS=peer1.org2.example.com:10051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:10051
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0-org2:9051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer1.org2.example.com:10051
      - CORE_PEER_LOCALMSPID=Org2MSP
      - CORE_PEER_MSPCONFIGPATH=/var/hyperledger/fabric/msp
      - CORE_LEDGER_STATE_STATEDATABASE=CouchDB # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb1-org2:5984 # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=admin # <-- ADICIONADO
      - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=adminpw # <-- ADICIONADO
    volumes:
      - /var/run/:/host/var/run/
      - peer1-org2-data:/var/hyperledger/production
      - ./crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/msp:/var/hyperledger/fabric/msp
      - ./crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls:/var/hyperledger/fabric/config/tls
    ports:
      - 10051:10051
    networks:
      - fabric-net
    deploy:
      placement:
        constraints:
          - node.hostname == hal13-vm4

  cli:
    image: hyperledger/fabric-tools:2.5.5
    # ... (configuração do cli continua a mesma) ...
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=cli
      - CORE_PEER_ADDRESS=peer0-org1:7051
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
        - /var/run/:/host/var/run/
        - ./crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
        - ./channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts
        - ./chaincode:/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode
    networks:
      - fabric-net
    deploy:
      placement:
        constraints:
          - node.hostname == hal13-vm1

```

No lugar de  node.hostname == HOSTANAME, insira o que aparece na coluna HOSTANAME na saída do `docker node ls`. Exemplo:
```
ID HOSTNAME STATUS AVAILABILITY MANAGER STATUS ENGINE VERSION pu5sbg1ucwflr1amikxfp8f4t * hal13-vm1 Ready Active Leader 27.3.1 z8b994fhu7idmstl3tn5q8mtt hal13-vm2 Ready Active ... ughta188f2wqup2gyymim8f61 hal13-vm3 Ready Active ... 5a8320lc7mg6pk8j7cw312gxm hal13-vm4 Ready Active ...
```


As vms tem os diretórios compartilhados, então não é necessário copiar os arquivos de uma VM para a outra. Caso os diretórios não sejam compartilhados, é necessário garantir que as pastas do projeto estejam as mesmas em todas as VMs.

2. Inicie a Rede (na VM 1):
```
docker stack deploy -c docker-compose-swarm.yaml fabric
```

Aguarda alguns minutos. Verifique se tudo subiu com `docker service ls`. Todos os serviçoes devem ter 1/1 na coluna REPLICAS.

3. Entre no CLI e Crie o Canal:
```bash
# Encontre o ID do container CLI 
docker ps -f "name=fabric_cli"
# Entre no container
docker exec -it [ID_DO_CONTAINER_CLI] bash
```

Dentro do contêiner CLI:
```bash
# Variáveis de ambiente para o Orderer
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem 
export ORDERER_HOSTNAME_OVERRIDE=orderer.example.com

# Criar o canal
peer channel create -o orderer:7050 -c mychannel \
-f ./channel-artifacts/mychannel.tx \
--tls \
--cafile $ORDERER_CA \
--clientauth \
--certfile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/tls/client.crt \
--keyfile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/tls/client.key \
--ordererTLSHostnameOverride orderer.example.com
```

Junte os Outros Peers ao Canal:
```bash
# Juntar peer0.org1
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0-org1:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org1.example.com

# Tente o join novamente
peer channel join -b mychannel.block


# Juntar peer1.org1
export CORE_PEER_ADDRESS=peer1.org1.example.com:8051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer1.org1.example.com
peer channel join -b mychannel.block

# Juntar peer0.org2
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=peer0.org2.example.com:9051
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org2.example.com
peer channel join -b mychannel.block

# Juntar peer1.org2
export CORE_PEER_ADDRESS=peer1.org2.example.com:10051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer1.org2.example.com
peer channel join -b mychannel.block
```

5. Instale e Aprove o Chaincode:
O processo agora é o de lifecycle do chaincode
```bash

# Volte para o contexto da Org1 para administrar
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org1.example.com

# Empacote o chaincode
peer lifecycle chaincode package testecouch.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode --lang node --label testecouch_1.0

# Instale em todos os peers
peer lifecycle chaincode install testecouch.tar.gz

export CORE_PEER_ADDRESS=peer1.org1.example.com:8051
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer1.org1.example.com
peer lifecycle chaincode install testecouch.tar.gz

# Mude para Org2
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=peer0.org2.example.com:9051
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org2.example.com
peer lifecycle chaincode install testecouch.tar.gz


export CORE_PEER_ADDRESS=peer1.org2.example.com:10051
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer1.org2.example.com
peer lifecycle chaincode install testecouch.tar.gz

# Descubra o PACKAGE_ID (será o mesmo para todos)
peer lifecycle chaincode queryinstalled
# Copie o Package ID, será algo como: mimic_1:xxxxxxxx
export CC_PACKAGE_ID=[COLE_O_PACKAGE_ID_AQUI]
```

# APROVE E FAÇA O COMMIT

```
peer lifecycle chaincode approveformyorg -o orderer:7050 --tls \
--cafile $ORDERER_CA --channelID mychannel --name testecouch \
--version 1.0 --sequence 1 --waitForEvent \
--package-id $CC_PACKAGE_ID \
--signature-policy "OR('Org1MSP.peer', 'Org2MSP.peer')" \
--ordererTLSHostnameOverride orderer.example.com

peer lifecycle chaincode approveformyorg -o orderer:7050 --tls \
--cafile $ORDERER_CA --channelID mychannel --name testecouch \
--version 1.0 --sequence 1 --waitForEvent \
--package-id $CC_PACKAGE_ID \
--signature-policy "OR('Org1MSP.peer', 'Org2MSP.peer')" \
--ordererTLSHostnameOverride orderer.example.com

peer lifecycle chaincode commit -o orderer:7050 --tls \
--cafile $ORDERER_CA --channelID mychannel --name testecouch --version 1.0 --sequence 1 \
--signature-policy "OR('Org1MSP.peer', 'Org2MSP.peer')" \
--peerAddresses peer0-org1:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
--ordererTLSHostnameOverride orderer.example.com

```


```bash
# --- Instalar no peer0.org1 ---
# Garanta que o contexto está correto para o peer0 da Org1
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0-org1:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

# A linha que faltava:
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org1.example.com

# Tente o install novamente
peer lifecycle chaincode install testecouch.tar.gz


# --- Instalar no peer1.org1 ---
export CORE_PEER_ADDRESS=peer1-org1:8051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer1.org1.example.com

peer lifecycle chaincode install testecouch.tar.gz


# --- Instalar no peer0.org2 ---
# Mude para o contexto da Org2
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=peer0-org2:9051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org2.example.com

peer lifecycle chaincode install testecouch.tar.gz


# --- Instalar no peer1.org2 ---
export CORE_PEER_ADDRESS=peer1-org2:10051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer1.org2.example.com

peer lifecycle chaincode install testecouch.tar.gz
```


Teste o Benchmark

```
npx caliper launch manager --caliper-workspace . --caliper-networkconfig network-config.yaml --caliper-benchconfig config.yaml
```

```bash
# --- 1. Definir o contexto e variáveis ---
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0-org1:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

# --- 2. Re-empacote o chaincode ---
# Desta vez, ele VAI incluir o node_modules
peer lifecycle chaincode package testecouch.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode --lang node --label testecouch_1.0

# --- 3. Instale o novo pacote em todos os peers ---
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org1.example.com
peer lifecycle chaincode install testecouch.tar.gz
# ... instale nos outros 3 peers, mudando as variáveis de ambiente para cada um ...

# --- 4. Aprove a NOVA definição (sequence 2) ---
# O Package ID agora será DIFERENTE
peer lifecycle chaincode queryinstalled
export CC_PACKAGE_ID=<COLE_O_NOVO_E_DIFERENTE_PACKAGE_ID_AQUI>
# (Faça o approve para Org1 e Org2 com --sequence 2)

# --- 5. Faça o COMMIT da nova sequência ---
# (Faça o commit com --sequence 2)

# --- 6. Teste Final ---
# (Execute o invoke e o query)
```

6. Aprove o chaincode:
```bash
peer lifecycle chaincode commit -o orderer:7050 --tls \ --cafile $ORDERER_CA --channelID mychannel --name testecouch --version 1.0 --sequence 1 \ --peerAddresses peer0-org1:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \ --ordererTLSHostnameOverride orderer.example.com
```
6. Teste o chaincode:
```bash
# Invocando uma transação para inserir um paciente
peer chaincode invoke -o orderer.example.com:7050 --tls --cafile $ORDERER_CA -C mychannel -n mimic \
--peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
--peerAddresses peer0.org2.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
-c '{"function":"insertPatient","Args":["101", "P001", "M", "1980-01-01", "", "", "", "0"]}'

# Consultando o paciente
peer chaincode query -C mychannel -n mimic -c '{"function":"queryPatientById","Args":["P001"]}'
```

