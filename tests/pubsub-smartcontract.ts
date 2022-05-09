import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PubsubSmartcontract } from "../target/types/pubsub_smartcontract";

describe("pubsub-smartcontract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.PubsubSmartcontract as Program<PubsubSmartcontract>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
