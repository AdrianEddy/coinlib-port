"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseBitcoinPayments = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const helpers_1 = require("./helpers");
const bitcoinish_1 = require("./bitcoinish");
class BaseBitcoinPayments extends bitcoinish_1.BitcoinishPayments {
    constructor(config) {
        super((0, utils_1.toBitcoinishConfig)(config));
        this.maximumFeeRate = config.maximumFeeRate;
        this.blockcypherToken = config.blockcypherToken;
    }
    async createServiceTransaction() {
        return null;
    }
    isValidAddress(address) {
        return (0, helpers_1.isValidAddress)(address, this.networkType);
    }
    standardizeAddress(address) {
        return (0, helpers_1.standardizeAddress)(address, this.networkType);
    }
    isValidPrivateKey(privateKey) {
        return (0, helpers_1.isValidPrivateKey)(privateKey, this.networkType);
    }
    isValidPublicKey(publicKey) {
        return (0, helpers_1.isValidPublicKey)(publicKey, this.networkType);
    }
    /** Return a string that can be passed into estimateBitcoinTxSize. Override to support multisig */
    getEstimateTxSizeInputKey() {
        return this.addressType;
    }
    estimateTxSize(inputCount, changeOutputCount, externalOutputAddresses) {
        return (0, helpers_1.estimateBitcoinTxSize)({ [this.getEstimateTxSizeInputKey()]: inputCount }, {
            ...(0, bitcoinish_1.countOccurences)(externalOutputAddresses),
            [this.addressType]: changeOutputCount,
        }, this.networkType);
    }
    async getPsbtInputData(utxo, paymentScript, addressType) {
        var _a, _b, _c;
        const result = {
            hash: utxo.txid,
            index: utxo.vout,
            sequence: constants_1.BITCOIN_SEQUENCE_RBF,
        };
        if (/p2wpkh|p2wsh/.test(addressType)) {
            // for segwit inputs, you only need the output script and value as an object.
            const scriptPubKey = (_a = utxo.scriptPubKeyHex) !== null && _a !== void 0 ? _a : (_b = (await this.getApi().getTx(utxo.txid)).vout[utxo.vout]) === null || _b === void 0 ? void 0 : _b.hex;
            if (!scriptPubKey) {
                throw new Error(`Cannot get scriptPubKey for utxo ${utxo.txid}:${utxo.vout}`);
            }
            const utxoValue = this.toBaseDenominationNumber(utxo.value);
            result.witnessUtxo = {
                script: Buffer.from(scriptPubKey, 'hex'),
                value: utxoValue,
            };
        }
        else {
            // for non segwit inputs, you must pass the full transaction buffer
            const txHex = (_c = utxo.txHex) !== null && _c !== void 0 ? _c : (await this.getApi().getTx(utxo.txid)).hex;
            if (!txHex) {
                throw new Error(`Cannot get raw hex of tx for utxo ${utxo.txid}:${utxo.vout}`);
            }
            result.nonWitnessUtxo = Buffer.from(txHex, 'hex');
        }
        if (addressType.startsWith('p2sh-p2wsh')) {
            result.witnessScript = paymentScript.redeem.redeem.output;
            result.redeemScript = paymentScript.redeem.output;
        }
        else if (addressType.startsWith('p2sh')) {
            result.redeemScript = paymentScript.redeem.output;
        }
        else if (addressType.startsWith('p2wsh')) {
            result.witnessScript = paymentScript.redeem.output;
        }
        return result;
    }
    get psbtOptions() {
        return {
            network: this.bitcoinjsNetwork,
            maximumFeeRate: this.maximumFeeRate,
        };
    }
    async buildPsbt(paymentTx, fromIndex) {
        var _a;
        const { inputs, outputs } = paymentTx;
        const psbt = new bitcoin.Psbt(this.psbtOptions);
        for (const input of inputs) {
            const signer = (_a = input.signer) !== null && _a !== void 0 ? _a : fromIndex;
            if (typeof signer === 'undefined') {
                throw new Error('Signer index for utxo is not provided');
            }
            const addressType = this.getAddressType(input.address, signer);
            psbt.addInput(await this.getPsbtInputData(input, this.getPaymentScript(signer, addressType), addressType));
        }
        for (const output of outputs) {
            psbt.addOutput({
                address: output.address,
                value: this.toBaseDenominationNumber(output.value),
            });
        }
        return psbt;
    }
    async serializePaymentTx(tx, fromIndex) {
        return (await this.buildPsbt(tx, fromIndex)).toHex();
    }
}
exports.BaseBitcoinPayments = BaseBitcoinPayments;
//# sourceMappingURL=BaseBitcoinPayments.js.map