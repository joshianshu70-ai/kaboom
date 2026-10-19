// AgentX84 is a non-proxy deployment. Slot 13 was derived from its project
// Solidity storage layout and checked against its live owner and price slots.
export const METADATA_BASE_URI = 'https://kaboom.thehouseofjoshi.com/collection/metadata/';
export async function readMetadataBaseURI(provider, address) {
  const word = await provider.getStorage(address, 13);
  const value = BigInt(word);
  const length = value % 2n ? Number((value - 1n) / 2n) : Number(value % 256n) / 2;
  if (length > 2048) throw Error('Unexpected NFT metadata storage layout.');
  let hex;
  if (value % 2n === 0n) hex = word.slice(2, 2 + length * 2);
  else {
    // keccak256(bytes32(uint256(13))) is the first storage word of the string.
    const start = BigInt('0xd7b6990105719101dabeb77144f2a3385c8033acd3af97e9423a695e81ad1eb5');
    const words = await Promise.all(Array.from({ length: Math.ceil(length / 32) }, (_, i) => provider.getStorage(address, start + BigInt(i))));
    hex = words.map(w => w.slice(2)).join('').slice(0, length * 2);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(hex.match(/../g) || [], b => parseInt(b, 16)));
}
