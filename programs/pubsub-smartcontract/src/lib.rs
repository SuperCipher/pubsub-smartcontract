use anchor_lang::prelude::*;

declare_id!("AG3tNC1LRV6L4hCR3iixFT7Y5oUTJeHzjvp533Du8X7t");

const DISCRIMINATOR_BYTES: usize = 8;
const PUBLIC_KEY_BYTES: usize = 32;
const TIMESTAMP_BYTES: usize = 8;
const STRING_PREFIX_BYTES: usize = 4; // size of the string in bytes.
const UTF_8_ENCODED_BYTES_PER_CHARACTER: usize = 4;
const MAX_HASHTAG_LENGTH: usize = 50; // 50 UTF-8 characters max.
const MAX_CONTENT_LENGTH: usize = 300; // 300 UTF-8 characters max.
const MAX_PROOF_LENGTH: usize = 300; // 300 UTF-8 characters max.

const MAX_HASHTAG_LENGTH_BYTES: usize = MAX_HASHTAG_LENGTH * UTF_8_ENCODED_BYTES_PER_CHARACTER;
const MAX_CONTENT_LENGTH_BYTES: usize = MAX_CONTENT_LENGTH * UTF_8_ENCODED_BYTES_PER_CHARACTER;
const MAX_PROOF_LENGTH_BYTES: usize = MAX_PROOF_LENGTH * UTF_8_ENCODED_BYTES_PER_CHARACTER;

#[program]
pub mod pubsub_smartcontract {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    // Implement check balance

    // TODO refactor this to event class

    pub fn publish(ctx: Context<CreateEvent>, hashtag: String, content: String) -> Result<()> {
        let event: &mut Account<Event> = &mut ctx.accounts.event;
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();

        if hashtag.chars().count() > MAX_HASHTAG_LENGTH {
            return Err(error!(ErrorCode::HashTagTooLong));
        }

        if content.chars().count() > MAX_CONTENT_LENGTH {
            return Err(error!(ErrorCode::ContentTooLong));
        }

        event.author = *author.key;
        event.timestamp = clock.unix_timestamp;
        event.hashtag = hashtag;
        event.content = content;

        let reward_lamports:u64 = anchor_lang::solana_program::native_token::sol_to_lamports(0.02);
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.author.key(),
            &ctx.accounts.event.key(),
            reward_lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.author.to_account_info(),
                ctx.accounts.event.to_account_info(),
            ],
        );

        Ok(())
    }

    pub fn notify(ctx: Context<Notify>, proof: String) -> Result<()> {
        let notification: &mut Account<Notification> = &mut ctx.accounts.notification;
        let notifier: &Signer = &ctx.accounts.notifier;
        let clock: Clock = Clock::get().unwrap();

        if proof.chars().count() > MAX_PROOF_LENGTH_BYTES {
            return Err(error!(ErrorCode::ProofTooLong));
        }

        notification.notifier = *notifier.key;
        notification.timestamp = clock.unix_timestamp;
        notification.proof = proof;

        Ok(())
    }
}

impl Event {
    const LEN: usize = DISCRIMINATOR_BYTES // https://lorisleiva.com/create-a-solana-dapp-from-scratch/structuring-our-tweet-account#discriminator
        + PUBLIC_KEY_BYTES // Author.
        + TIMESTAMP_BYTES
        + STRING_PREFIX_BYTES + MAX_HASHTAG_LENGTH_BYTES
        + STRING_PREFIX_BYTES + MAX_CONTENT_LENGTH_BYTES;
}

#[account]
pub struct Event {
    pub author: Pubkey,
    pub timestamp: i64,
    pub hashtag: String,
    pub content: String,
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct CreateEvent<'info> {
    #[account(init, payer = author, space = Event::LEN)]
    pub event: Account<'info, Event>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Notification {
    pub notifier: Pubkey,
    pub timestamp: i64,
    pub proof: String,
}

impl Notification {
    const LEN: usize = DISCRIMINATOR_BYTES // https://lorisleiva.com/create-a-solana-dapp-from-scratch/structuring-our-tweet-account#discriminator
        + PUBLIC_KEY_BYTES // notifier.
        + TIMESTAMP_BYTES
        + STRING_PREFIX_BYTES + MAX_PROOF_LENGTH_BYTES;
}

#[derive(Accounts)]
pub struct Notify<'info> {
    #[account(init, payer = notifier, space = Notification::LEN)]
    pub notification: Account<'info, Notification>,
    #[account(mut)]
    pub notifier: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided hashtag should be 50 characters long maximum.")]
    HashTagTooLong,
    #[msg("The provided content should be 300 characters long maximum.")]
    ContentTooLong,
    #[msg("The provided proof should be 300 characters long maximum.")]
    ProofTooLong,
}
