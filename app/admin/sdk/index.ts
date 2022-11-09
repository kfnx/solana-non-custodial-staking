import { PublicKey } from "@solana/web3.js";
export * from "./accounts";
export * from "./errors";
export * from "./instructions";

/**
 * Program address
 *
 * @category constants
 * @category generated
 */
export const PROGRAM_ADDRESS = "stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E";
// export const PROGRAM_ADDRESS = "stk4YMX6gbb5EL9T2d2UN4AWrGu2p8PzZCF4JQumAfJ";

/**
 * Program public key
 *
 * @category constants
 * @category generated
 */
export const PROGRAM_ID = new PublicKey(PROGRAM_ADDRESS);
