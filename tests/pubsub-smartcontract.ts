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

  const createEvent = async (author, hashtag, content) => {
      const eventAccount = anchor.web3.Keypair.generate();
      await program.rpc.createEvent(hashtag, content, {
          accounts: {
              event: eventAccount.publicKey,
              author,
              systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [eventAccount],
      });

      return eventAccount
  }

  it('can create a new event', async () => {
      // Call the "create event" instruction.
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

      // Fetch the account details of the created event.
      const fetchedEventAccount = await program.account.event.fetch(eventAccount.publicKey);

      // Ensure it has the right data.
      assert.equal(fetchedEventAccount.author.toBase58(), provider.wallet.publicKey.toBase58());
      assert.equal(fetchedEventAccount.hashtag, hashTag);
      assert.equal(fetchedEventAccount.content, content);
      assert.ok(fetchedEventAccount.timestamp);
  });

  it('can create a new event without a hashtag', async () => {
      // Call the "create event" instruction.
      const eventAccount = anchor.web3.Keypair.generate();
      const hashTag = ''
      const content = '...'
      await program.rpc.createEvent(hashTag, content, {
          accounts: {
              event: eventAccount.publicKey,
              author: provider.wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [eventAccount],
      });

      // Fetch the account details of the created event.
      const fetchedEventAccount = await program.account.event.fetch(eventAccount.publicKey);

      // Ensure it has the right data.
      assert.equal(fetchedEventAccount.author.toBase58(), provider.wallet.publicKey.toBase58());
      assert.equal(fetchedEventAccount.hashtag, hashTag);
      assert.equal(fetchedEventAccount.content, content);
      assert.ok(fetchedEventAccount.timestamp);
  });

  it('can create a new event from a different author', async () => {
      // Generate another user and airdrop them some SOL.
      const otherUser = anchor.web3.Keypair.generate();
      const receipt = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000);
      await program.provider.connection.confirmTransaction(receipt);
      const hashTag = ''
      const content = '...'
      // Call the "create event" instruction on behalf of this other user.
      const eventAccount = anchor.web3.Keypair.generate();
      await program.rpc.createEvent(hashTag, content, {
          accounts: {
              event: eventAccount.publicKey,
              author: otherUser.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [otherUser, eventAccount],
      });

      // Fetch the account details of the created event.
      const fetchedEventAccount = await program.account.event.fetch(eventAccount.publicKey);

      // Ensure it has the right data.
      assert.equal(fetchedEventAccount.author.toBase58(), otherUser.publicKey.toBase58());
      assert.equal(fetchedEventAccount.hashtag, hashTag);
      assert.equal(fetchedEventAccount.content, content);
      assert.ok(fetchedEventAccount.timestamp);
  });

  it('cannot provide a hashtag with more than 50 characters', async () => {
      try {
          const event = anchor.web3.Keypair.generate();
          const hashtagWith51Chars = 'x'.repeat(51);
          await program.rpc.createEvent(hashtagWith51Chars, 'Hummus, am I right?', {
              accounts: {
                  event: event.publicKey,
                  author: provider.wallet.publicKey,
                  systemProgram: anchor.web3.SystemProgram.programId,
              },
              signers: [event],
          });
      } catch (error) {
          assert.equal(error.error.errorMessage, 'The provided hashtag should be 50 characters long maximum.');
          return;
      }

      assert.fail('The instruction should have failed with a 51-character topic.');
  });

  it('cannot provide a content with more than 300 characters', async () => {
      try {
          const event = anchor.web3.Keypair.generate();
          const contentWith301Chars = 'x'.repeat(301);
          await program.rpc.createEvent('veganism', contentWith301Chars, {
              accounts: {
                  event: event.publicKey,
                  author: provider.wallet.publicKey,
                  systemProgram: anchor.web3.SystemProgram.programId,
              },
              signers: [event],
          });
      } catch (error) {
          assert.equal(error.error.errorMessage, 'The provided content should be 300 characters long maximum.');
          return;
      }

      assert.fail('The instruction should have failed with a 301-character content.');
  });

  it('can fetch all event', async () => {
      const eventAccounts = await program.account.event.all();
      assert.equal(eventAccounts.length, 3);
  });

  it('can filter event by author', async () => {
      const authorPublicKey = provider.wallet.publicKey
      const eventAccounts = await program.account.event.all([
          {
              memcmp: {
                  offset: 8, // Discriminator.
                  bytes: authorPublicKey.toBase58(),
              }
          }
      ]);

      assert.equal(eventAccounts.length, 2);
      assert.ok(eventAccounts.every(eventAccount => {
          return eventAccount.account.author.toBase58() === authorPublicKey.toBase58()
      }))
  });

  it('can filter event by hashtag', async () => {
      const eventAccounts = await program.account.event.all([
          {
              memcmp: {
                  offset: 8 + // Discriminator.
                      32 + // Author public key.
                      8 + // Timestamp.
                      4, // hashtag string prefix.
                  bytes: bs58.encode(Buffer.from('solana')),
              }
          }
      ]);

      assert.equal(eventAccounts.length, 1);
      assert.ok(eventAccounts.every(eventAccount => {
          return eventAccount.account.hashtag === 'solana'
      }))
  });

  it('can update a event', async () => {
      // Send a event and fetch its account.
      const author = provider.wallet.publicKey;
      const event = await createEvent(author, 'web2', 'Hello World!');
      const eventAccount = await program.account.event.fetch(event.publicKey);

      // Ensure it has the right data.
      assert.equal(eventAccount.hashtag, 'web2');
      assert.equal(eventAccount.content, 'Hello World!');

      // Update the Event.
      await program.rpc.updateEvent('solana', 'gm everyone!', {
          accounts: {
              event: event.publicKey,
              author,
          },
      });

      // Ensure the updated event has the updated data.
      const updatedEventAccount = await program.account.event.fetch(event.publicKey);
      assert.equal(updatedEventAccount.hashtag, 'solana');
      assert.equal(updatedEventAccount.content, 'gm everyone!');
  });

  it('cannot update someone else\'s event', async () => {
      // Send a event.
      const author = provider.wallet.publicKey;
      const event = await createEvent(author, 'solana', 'Solana is awesome!');

      // Update the Event.
      try {
          await program.rpc.updateEvent('eth', 'Ethereum is awesome!', {
              accounts: {
                  event: event.publicKey,
                  author: anchor.web3.Keypair.generate().publicKey,
              },
          });
          assert.fail('We were able to update someone else\'s event.');
      } catch (error) {
          // Ensure the event account kept the initial data.
          const eventAccount = await program.account.event.fetch(event.publicKey);
          assert.equal(eventAccount.hashtag, 'solana');
          assert.equal(eventAccount.content, 'Solana is awesome!');
      }
  });

  it('can delete a event', async () => {
      // Create a new event.
      const author = provider.wallet.publicKey;
      const event = await createEvent(author, 'solana', 'gm');

      // Delete the Event.
      await program.rpc.deleteEvent({
          accounts: {
              event: event.publicKey,
              author,
          },
      });

      // Ensure fetching the event account returns null.
      const eventAccount = await program.account.event.fetchNullable(event.publicKey);
      assert.ok(eventAccount === null);
  });

  it('cannot delete someone else\'s event', async () => {
      // Create a new event.
      const author = provider.wallet.publicKey;
      const event = await createEvent(author, 'solana', 'gm');

      // Try to delete the Event from a different author.
      try {
          await program.rpc.deleteEvent({
              accounts: {
                  event: event.publicKey,
                  author: anchor.web3.Keypair.generate().publicKey,
              },
          });
          assert.fail('We were able to delete someone else\'s event.');
      } catch (error) {
          // Ensure the event account still exists with the right data.
          const eventAccount = await program.account.event.fetch(event.publicKey);
          assert.equal(eventAccount.hashtag, 'solana');
          assert.equal(eventAccount.content, 'gm');
      }
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
