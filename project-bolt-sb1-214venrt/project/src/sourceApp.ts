/** Fleet app identifier — change per white-label deploy. */
export const SOURCE_APP = 'nakalai' as const;

export type SourceAppId = typeof SOURCE_APP | string;

export const PAYMENT_STATUS_KEY = `${SOURCE_APP}_mock_payment_paid`;
export const PAYMENT_RECEIPT_KEY = `${SOURCE_APP}_payment_receipt`;
