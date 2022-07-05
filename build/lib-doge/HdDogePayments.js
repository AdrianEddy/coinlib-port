"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HdDogePayments = void 0;
const lodash_1 = require("lodash");
const ts_common_1 = require("../ts-common");
const lib_bitcoin_1 = require("../lib-bitcoin");
const bip44_1 = require("./bip44");
const types_1 = require("./types");
const SinglesigDogePayments_1 = require("./SinglesigDogePayments");
const constants_1 = require("./constants");
class HdDogePayments extends SinglesigDogePayments_1.SinglesigDogePayments {
    constructor(config) {
        super(config);
        this.config = config;
        (0, ts_common_1.assertType)(types_1.HdDogePaymentsConfig, config);
        this.derivationPath = config.derivationPath || constants_1.DEFAULT_DERIVATION_PATH;
        if (this.isValidXpub(config.hdKey)) {
            this.xpub = config.hdKey;
            this.xprv = null;
        }
        else if (this.isValidXprv(config.hdKey)) {
            this.xpub = (0, bip44_1.xprvToXpub)(config.hdKey, this.derivationPath, this.bitcoinjsNetwork);
            this.xprv = config.hdKey;
        }
        else {
            const providedPrefix = config.hdKey.slice(0, 4);
            const xpubPrefix = lib_bitcoin_1.bitcoinish.bip32MagicNumberToPrefix(this.bitcoinjsNetwork.bip32.public);
            const xprvPrefix = lib_bitcoin_1.bitcoinish.bip32MagicNumberToPrefix(this.bitcoinjsNetwork.bip32.private);
            let reason = '';
            if (providedPrefix !== xpubPrefix && providedPrefix !== xprvPrefix) {
                reason = ` with prefix ${providedPrefix} but expected ${xprvPrefix} or ${xpubPrefix}`;
            }
            else {
                reason = ` (${(0, bip44_1.validateHdKey)(config.hdKey, this.bitcoinjsNetwork)})`;
            }
            throw new Error(`Invalid ${this.networkType} hdKey provided to bitcoin payments config${reason}`);
        }
        this.hdNode = (0, bip44_1.deriveHDNode)(config.hdKey, this.derivationPath, this.bitcoinjsNetwork);
    }
    isValidXprv(xprv) {
        return xprv.startsWith('xprv') ? (0, bip44_1.isValidXprv)(xprv) : (0, bip44_1.isValidXprv)(xprv, this.bitcoinjsNetwork);
    }
    isValidXpub(xpub) {
        return xpub.startsWith('xpub') ? (0, bip44_1.isValidXpub)(xpub) : (0, bip44_1.isValidXpub)(xpub, this.bitcoinjsNetwork);
    }
    getFullConfig() {
        return {
            ...this.config,
            network: this.networkType,
            derivationPath: this.derivationPath,
        };
    }
    getPublicConfig() {
        return {
            ...(0, lodash_1.omit)(this.getFullConfig(), lib_bitcoin_1.PUBLIC_CONFIG_OMIT_FIELDS),
            hdKey: this.xpub,
        };
    }
    getAccountId(index) {
        return this.xpub;
    }
    getAccountIds(index) {
        return [this.xpub];
    }
    getAddress(index) {
        return (0, bip44_1.deriveAddress)(this.hdNode, index, this.bitcoinjsNetwork);
    }
    getKeyPair(index) {
        return (0, bip44_1.deriveKeyPair)(this.hdNode, index, this.bitcoinjsNetwork);
    }
}
exports.HdDogePayments = HdDogePayments;
//# sourceMappingURL=HdDogePayments.js.map