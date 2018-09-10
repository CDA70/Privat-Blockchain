/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);



/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{

    constructor(){
        this.blockHeight = -1;
        let _self = this;
        this.getBlockHeight().then(function (height) {
            if (height === -1) {
                _self.addBlock(new Block("First block in the chain - Genesis block"));
                console.log('The Genesis block is created!');
            } 
            else _self.blockHeight = height;
        });
              
    }

    // Get block height
    async getBlockHeight(){
        return await this.getBlockHeightFromLevelDB()
    }

    // addBlock
    async addBlock(newBlock){
        let height = parseInt(await this.getBlockHeight())

        newBlock.time = new Date().getTime().toString().slice(0, -3);
        
        newBlock.height = height + 1//this.blockHeight+1;

        if (height > -1) {
          let previousBlock = await this.getBlock(height);
          newBlock.previousBlockHash = previousBlock.hash;
        }
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        this.addDataToLevelDB(newBlock.height, JSON.stringify(newBlock))

    }

    async getBlock(blockHeight) {
        return JSON.parse(await this.getLevelDBData(blockHeight))
    }
    
    
    async validateBlock(blockHeight){
        return new Promise((resolve, reject) => {
            this.getBlock(blockHeight).then((block) => {
                // get block hash
                let blockHash = block.hash;
                // remove block hash to test block integrity
                block.hash = '';
                // generate block hash
                let validBlockHash = SHA256(JSON.stringify(block)).toString();
                // Compare
                console.log("    block Hash      : " + blockHash);
                console.log("    Valid block Hash: " + validBlockHash);
                if (blockHash === validBlockHash) {
                    console.log("Block #" + blockHeight + " is valid");
                    resolve(true);
                } else {
                    console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
                    reject(false);
                }
            }).catch((err) => {
                reject(err);
            })
        })
    }
    
    
     // Validate blockchain
    async validateChain(){
        let errorLog = [];

        const height = await this.getBlockHeight();
        
        for (var i = 0; i < height; i++) {
          
           // validate block
           if (!this.validateBlock(i)) errorLog.push(i);

           if ( i == height - 1) break;
           // compare blocks hash link

           let blockHash = await this.getBlock(i).hash;
           let previousHash = await this.getBlock(i + 1).previousBlockHash;
           
           if (blockHash !== previousHash) {
               errorLog.push(i);
          }
        }
        
        if (errorLog.length > 0) {
            console.log('Block errors = ' + errorLog.length);
            console.log('Blocks: ' + errorLog);
        } else {
            console.log('No errors detected');
        }
    }
   

    /* ===== level DB  ================================
    |   persistent data functions 		         	   |
    |  ===============================================*/

    getLevelDBData(key){
        return new Promise((resolve, reject) => {
          db.get(key, (err, value) => {
            if (err) {
              reject(err)
            }
            resolve(value)
          })
        })
    }
    
    getBlockHeightFromLevelDB(){
        return new Promise((resolve, reject) => {
            //initialize heigth at -1
            let height = -1;
            db.createReadStream().on('data', (data) => {
               height = height + 1;
            }).on('error', (error) => {
               reject(error)
            }).on('close', () => {
               resolve(height);
            })
        })
    }

    addDataToLevelDB(key, value) {
        return new Promise((resolve, reject) => {
            db.put(key,value, (error) => {
                if (error) {
                    reject(error)
                }
            })
            resolve(value)
        })
    }

      showAllBlocks() {
        db.createReadStream().on('data',  function (data){
           console.log("block number: " + data.key + ": " + data.value);
        }).on('error', function (error) {
            return console.log('unable to read data stream', error)
        });
      }

}
// run loop to test the code
/*
let blockchain = new Blockchain()

(function theLoop (i) {
    setTimeout(function () {
        let blockTest = new Block("Test Block - " + (i + 1));
            blockchain.addBlock(blockTest).then((result) => {
            console.log(result);
            i++;
            if (i < 10) theLoop(i);
        });
    }, 1000);
  })(0);
  

  setTimeout(function() { 
      blockchain.validateChain()
  }, 10)
  */





  