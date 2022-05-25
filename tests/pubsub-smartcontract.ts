import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PubsubSmartcontract } from "../target/types/pubsub_smartcontract";
import * as assert from "assert";
import * as bs58 from "bs58";

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

  it('can publish a new event', async () => {
      // Call the "create event" instruction.
      const eventAccount = anchor.web3.Keypair.generate();
      const hashTag = 'solana'
      const content = 'IF Solana hedge fund sales token THEN notify me with mainstream media news URL'
      const vault = anchor.web3.Keypair.generate();

      console.log(`eventAccount publicKey ${(await program.provider.connection.getBalance(eventAccount.publicKey))} SOL`);
      console.log(`provider.wallet.publicKey ${(await program.provider.connection.getBalance(provider.wallet.publicKey))} SOL`);

      await program.rpc.publish(hashTag, content, {
          accounts: {
              event: eventAccount.publicKey,
              author: provider.wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [eventAccount],
      });
      console.log(`eventAccount publicKey ${(await program.provider.connection.getBalance(eventAccount.publicKey))} SOL`);
      console.log(`provider.wallet.publicKey ${(await program.provider.connection.getBalance(provider.wallet.publicKey))} SOL`);

      // Fetch the account details of the created event.
      const fetchedEventAccount = await program.account.event.fetch(eventAccount.publicKey);

      // Ensure it has the right data.
      assert.equal(fetchedEventAccount.author.toBase58(), provider.wallet.publicKey.toBase58());
      assert.equal(fetchedEventAccount.hashtag, hashTag);
      assert.equal(fetchedEventAccount.content, content);
      assert.ok(fetchedEventAccount.timestamp);

      const notifierAccount = anchor.web3.Keypair.generate();
      const eventKey = eventAccount.publicKey
      const proof = 'IF Solana CEO resigned THEN notify me with mainstream news URL'

      await program.rpc.notify( proof, {
          accounts: {
              notification: notifierAccount.publicKey,
              notifier: provider.wallet.publicKey,
              event: eventAccount.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [notifierAccount],
      });

      // Fetch the account details of the created event.
      const fetchedNotificationAccount = await program.account.notification.fetch(notifierAccount.publicKey);

      // Ensure it has the right data.
      assert.equal(fetchedNotificationAccount.notifier.toBase58(), provider.wallet.publicKey.toBase58());
      assert.equal(fetchedNotificationAccount.eventKey.toBase58(), eventKey.toBase58());
      assert.equal(fetchedNotificationAccount.proof, proof);
      assert.ok(fetchedNotificationAccount.timestamp);

  });

  // it('can notify publisher', async () => {
  //     // Call the "create event" instruction.
  //     const notifierAccount = anchor.web3.Keypair.generate();
  //     const eventAccount = anchor.web3.Keypair.generate();
  //     const eventKey = eventAccount.publicKey
  //     const proof = 'IF Solana CEO resigned THEN notify me with mainstream news URL'
  //
  //     await program.rpc.notify( proof, eventKey, {
  //         accounts: {
  //             notification: notifierAccount.publicKey,
  //             notifier: provider.wallet.publicKey,
  //             systemProgram: anchor.web3.SystemProgram.programId,
  //         },
  //         signers: [notifierAccount],
  //     });
  //
  //     // Fetch the account details of the created event.
  //     const fetchedEventAccount = await program.account.notification.fetch(notifierAccount.publicKey);
  //
  //     // Ensure it has the right data.
  //     assert.equal(fetchedEventAccount.notifier.toBase58(), provider.wallet.publicKey.toBase58());
  //     assert.equal(fetchedEventAccount.eventKey.toBase58(), eventKey.toBase58());
  //     assert.equal(fetchedEventAccount.proof, proof);
  //     assert.ok(fetchedEventAccount.timestamp);
  // });

  // it('can create a new event without a hashtag', async () => {
  //     // Call the "create event" instruction.
  //     const eventAccount = anchor.web3.Keypair.generate();
  //     const hashTag = ''
  //     const content = '...'
  //     await program.rpc.createEvent(hashTag, content, {
  //         accounts: {
  //             event: eventAccount.publicKey,
  //             author: provider.wallet.publicKey,
  //             systemProgram: anchor.web3.SystemProgram.programId,
  //         },
  //         signers: [eventAccount],
  //     });
  //
  //     // Fetch the account details of the created event.
  //     const fetchedEventAccount = await program.account.event.fetch(eventAccount.publicKey);
  //
  //     // Ensure it has the right data.
  //     assert.equal(fetchedEventAccount.author.toBase58(), provider.wallet.publicKey.toBase58());
  //     assert.equal(fetchedEventAccount.hashtag, hashTag);
  //     assert.equal(fetchedEventAccount.content, content);
  //     assert.ok(fetchedEventAccount.timestamp);
  // });
  //
  // it('can create a new event from a different author', async () => {
  //     // Generate another user and airdrop them some SOL.
  //     const otherUser = anchor.web3.Keypair.generate();
  //     const receipt = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000);
  //     await program.provider.connection.confirmTransaction(receipt);
  //     const hashTag = ''
  //     const content = '...'
  //     // Call the "create event" instruction on behalf of this other user.
  //     const eventAccount = anchor.web3.Keypair.generate();
  //     await program.rpc.createEvent(hashTag, content, {
  //         accounts: {
  //             event: eventAccount.publicKey,
  //             author: otherUser.publicKey,
  //             systemProgram: anchor.web3.SystemProgram.programId,
  //         },
  //         signers: [otherUser, eventAccount],
  //     });
  //
  //     // Fetch the account details of the created event.
  //     const fetchedEventAccount = await program.account.event.fetch(eventAccount.publicKey);
  //
  //     // Ensure it has the right data.
  //     assert.equal(fetchedEventAccount.author.toBase58(), otherUser.publicKey.toBase58());
  //     assert.equal(fetchedEventAccount.hashtag, hashTag);
  //     assert.equal(fetchedEventAccount.content, content);
  //     assert.ok(fetchedEventAccount.timestamp);
  // });

  // it('cannot provide a hashtag with more than 50 characters', async () => {
  //     try {
  //         const event = anchor.web3.Keypair.generate();
  //         const hashtagWith51Chars = 'x'.repeat(51);
  //         await program.rpc.createEvent(hashtagWith51Chars, 'Hummus, am I right?', {
  //             accounts: {
  //                 event: event.publicKey,
  //                 author: provider.wallet.publicKey,
  //                 systemProgram: anchor.web3.SystemProgram.programId,
  //             },
  //             signers: [event],
  //         });
  //     } catch (error) {
  //         assert.equal(error.error.errorMessage, 'The provided hashtag should be 50 characters long maximum.');
  //         return;
  //     }
  //
  //     assert.fail('The instruction should have failed with a 51-character topic.');
  // });
  //
  // it('cannot provide a content with more than 300 characters', async () => {
  //     try {
  //         const event = anchor.web3.Keypair.generate();
  //         const contentWith301Chars = 'x'.repeat(301);
  //         await program.rpc.createEvent('veganism', contentWith301Chars, {
  //             accounts: {
  //                 event: event.publicKey,
  //                 author: provider.wallet.publicKey,
  //                 systemProgram: anchor.web3.SystemProgram.programId,
  //             },
  //             signers: [event],
  //         });
  //     } catch (error) {
  //         assert.equal(error.error.errorMessage, 'The provided content should be 300 characters long maximum.');
  //         return;
  //     }
  //
  //     assert.fail('The instruction should have failed with a 301-character content.');
  // });
  //
  // it('can fetch all event', async () => {
  //     const eventAccounts = await program.account.event.all();
  //     assert.equal(eventAccounts.length, 3);
  // });
  //
  // it('can filter event by author', async () => {
  //     const authorPublicKey = provider.wallet.publicKey
  //     const eventAccounts = await program.account.event.all([
  //         {
  //             memcmp: {
  //                 offset: 8, // Discriminator.
  //                 bytes: authorPublicKey.toBase58(),
  //             }
  //         }
  //     ]);
  //
  //     assert.equal(eventAccounts.length, 2);
  //     assert.ok(eventAccounts.every(eventAccount => {
  //         return eventAccount.account.author.toBase58() === authorPublicKey.toBase58()
  //     }))
  // });
  //
  // it('can filter event by hashtag', async () => {
  //     const eventAccounts = await program.account.event.all([
  //         {
  //             memcmp: {
  //                 offset: 8 + // Discriminator.
  //                     32 + // Author public key.
  //                     8 + // Timestamp.
  //                     4, // hashtag string prefix.
  //                 bytes: bs58.encode(Buffer.from('solana')),
  //             }
  //         }
  //     ]);
  //
  //     assert.equal(eventAccounts.length, 1);
  //     assert.ok(eventAccounts.every(eventAccount => {
  //         return eventAccount.account.hashtag === 'solana'
  //     }))
  // });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
