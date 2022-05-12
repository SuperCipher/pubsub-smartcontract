import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PubsubSmartcontract } from "../target/types/pubsub_smartcontract";
import * as assert from "assert";

describe("pubsub-smartcontract", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  const program = anchor.workspace.PubsubSmartcontract as Program<PubsubSmartcontract>;

  // const createEvent = async (author, hashtag, content) => {
  //     const eventAccount = anchor.web3.Keypair.generate();
  //     await program.rpc.createEvent(hashtag, content, {
  //         accounts: {
  //             event: eventAccount.publicKey,
  //             author,
  //             systemProgram: anchor.web3.SystemProgram.programId,
  //         },
  //         signers: [eventAccount],
  //     });
  //
  //     return eventAccount
  // }

  it('can create a new event', async () => {
      // Call the "SendTweet" instruction.
      const eventAccount = anchor.web3.Keypair.generate();
      const hashTag = 'solana'
      const content = 'IF Solana CEO resigned THEN notify me with mainstream news URL'
      await program.rpc.createEvent(hashTag, content, {
          accounts: {
              event: eventAccount.publicKey,
              author: provider.wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [eventAccount],
      });

      // Fetch the account details of the created tweet.
      const fetchedEventAccount = await program.account.event.fetch(eventAccount.publicKey);

      // Ensure it has the right data.
      assert.equal(fetchedEventAccount.author.toBase58(), provider.wallet.publicKey.toBase58());
      assert.equal(fetchedEventAccount.hashtag, hashTag);
      assert.equal(fetchedEventAccount.content, content);
      assert.ok(fetchedEventAccount.timestamp);
  });


  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
