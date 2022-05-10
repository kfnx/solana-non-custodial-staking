export * from "./pda";
export * from "./user";
export * from "./program-id";

export async function delay(ms: number) {
  await new Promise((response) =>
    setTimeout(() => {
      response(0);
    }, ms)
  );
}
