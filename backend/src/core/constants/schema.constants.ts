import { PortableDid } from "@web5/dids";

export const USER = "users";
export const WALLET = "wallets";
export const WALLET_TRANSACTION = "wallettransactions";
export const WALLET_ACCOUNT = "walletaccounts";
export const WALLET_CURRENCY = "walletcurrencies";

export const PFI = "pfis";
export const OFFERING = "offerings";
export const EXCHANGE = "exchanges";

export const BANK = "banks";
export const TRANSFER_RECORD = "transferrecords";
export const CHARGE_RECORD = "chargerecords";

export const REVENUE = "revenues";

export const portableDid = {
  uri: "did:dht:6sm9u9bfanu3st6pybw9hdc8bpg9fhqjqouownkkuaehmkbh46py",
  document: {
    id: "did:dht:6sm9u9bfanu3st6pybw9hdc8bpg9fhqjqouownkkuaehmkbh46py",
    verificationMethod: [
      {
        id: "did:dht:6sm9u9bfanu3st6pybw9hdc8bpg9fhqjqouownkkuaehmkbh46py#0",
        type: "JsonWebKey",
        controller:
          "did:dht:6sm9u9bfanu3st6pybw9hdc8bpg9fhqjqouownkkuaehmkbh46py",
        publicKeyJwk: {
          crv: "Ed25519",
          kty: "OKP",
          x: "9Zf5_CXAp5tHzQBp_g2HC03y8cl0JwoJSp4Rxag815o",
          kid: "7FRGl2eRz_WyhusGOmZyk-iLqMyzgzhQc9JvqgzBN80",
          alg: "EdDSA",
        },
      },
    ],
    authentication: [
      "did:dht:6sm9u9bfanu3st6pybw9hdc8bpg9fhqjqouownkkuaehmkbh46py#0",
    ],
    assertionMethod: [
      "did:dht:6sm9u9bfanu3st6pybw9hdc8bpg9fhqjqouownkkuaehmkbh46py#0",
    ],
    capabilityDelegation: [
      "did:dht:6sm9u9bfanu3st6pybw9hdc8bpg9fhqjqouownkkuaehmkbh46py#0",
    ],
    capabilityInvocation: [
      "did:dht:6sm9u9bfanu3st6pybw9hdc8bpg9fhqjqouownkkuaehmkbh46py#0",
    ],
  },
  metadata: { published: true, versionId: "1724298564" },
  privateKeys: [
    {
      crv: "Ed25519",
      d: "nQgDs0XAQRAX1oMhia7Qy_rr5ACe4PNjKqbyqCJ1N_8",
      kty: "OKP",
      x: "9Zf5_CXAp5tHzQBp_g2HC03y8cl0JwoJSp4Rxag815o",
      kid: "7FRGl2eRz_WyhusGOmZyk-iLqMyzgzhQc9JvqgzBN80",
      alg: "EdDSA",
    },
  ],
} as PortableDid;
