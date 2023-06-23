const { Contract } = require('fabric-contract-api');
const fs = require('fs');
const path = require('path');

class MedicalDataContract extends Contract {
  async initLedger(ctx) {
    const collectionConfig = this.loadCollectionConfig(ctx);
    const data = [
      {
        id: '1',
        patientID: 'patient1',
        patientName: 'John Doe',
        diagnosis: 'Fever',
        medications: ['Medicine A', 'Medicine B'],
      },
      {
        id: '2',
        patientID: 'patient2',
        patientName: 'Jane Smith',
        diagnosis: 'Headache',
        medications: ['Medicine C', 'Medicine D'],
      },
    ];

    for (const item of data) {
      await ctx.stub.putPrivateData(collectionConfig.name, item.id, Buffer.from(JSON.stringify(item)));
    }
  }

  async getMedicalData(ctx, id) {
    const collectionConfig = this.loadCollectionConfig(ctx);
    const dataJSON = await ctx.stub.getPrivateData(collectionConfig.name, id);
    if (!dataJSON || dataJSON.length === 0) {
      throw new Error(`Medical data with ID ${id} does not exist.`);
    }
    const data = JSON.parse(dataJSON.toString());
    return data;
  }

  async getMedicalDataByPatientID(ctx, patientID) {
    const collectionConfig = this.loadCollectionConfig(ctx);
    const query = {
      selector: {
        patientID: patientID,
      },
    };
    const iterator = await ctx.stub.getPrivateDataQueryResult(collectionConfig.name, JSON.stringify(query));
    const results = [];
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value.toString()) {
        const data = JSON.parse(res.value.value.toString('utf8'));
        results.push(data);
      }
      if (res.done) {
        await iterator.close();
        return results;
      }
    }
  }

  async createMedicalData(ctx, id, patientID, patientName, diagnosis, medications) {
    const collectionConfig = this.loadCollectionConfig(ctx);
    const data = {
      id,
      patientID,
      patientName,
      diagnosis,
      medications,
    };
    await ctx.stub.putPrivateData(collectionConfig.name, id, Buffer.from(JSON.stringify(data)));
  }

  async transferMedicalData(ctx, id, newOwner) {
    const collectionConfig = this.loadCollectionConfig(ctx);
    const dataJSON = await ctx.stub.getPrivateData(collectionConfig.name, id);
    
    if (!dataJSON || dataJSON.length === 0) {
      throw new Error(`Medical data with ID ${id} does not exist.`);
    }

    await ctx.stub.putPrivateData(newOwner, id, Buffer.from(JSON.stringify(data)));
  }

  loadCollectionConfig(ctx) {
    const mspID = ctx.stub.getMspID();
    const collectionConfigPath = path.join(__dirname, '..', 'collection_config.json');
    const collectionConfigContent = fs.readFileSync(collectionConfigPath, 'utf8');
    console.log(mspID);
    const collectionConfig = JSON.parse(collectionConfigContent);

    const collection = collectionConfig.find((config) => config.policy.includes(mspID));
    if (collection) {
      return collection;
    }
  }
  
}

module.exports = MedicalDataContract;
