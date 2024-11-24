import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Customer registration test",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('waste-payment', 'register-customer', [], wallet1.address)
        ]);
        
        block.receipts[0].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Add funds and check balance",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('waste-payment', 'register-customer', [], wallet1.address),
            Tx.contractCall('waste-payment', 'add-funds', [types.uint(100)], wallet1.address),
            Tx.contractCall('waste-payment', 'get-customer-balance', [types.principal(wallet1.address)], wallet1.address)
        ]);
        
        block.receipts[1].result.expectOk().expectBool(true);
        block.receipts[2].result.expectOk().expectUint(100);
    }
});

Clarinet.test({
    name: "Record collection and payment processing",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('waste-payment', 'register-customer', [], wallet1.address),
            Tx.contractCall('waste-payment', 'add-funds', [types.uint(100)], wallet1.address),
            Tx.contractCall('waste-payment', 'record-collection', [types.principal(wallet1.address)], deployer.address)
        ]);
        
        block.receipts[2].result.expectOk().expectBool(true);
        
        let historyBlock = chain.mineBlock([
            Tx.contractCall('waste-payment', 'get-collection-history', [types.principal(wallet1.address)], wallet1.address)
        ]);
        
        const history = historyBlock.receipts[0].result.expectOk().expectSome();
        assertEquals(history['collections-count'], types.uint(1));
    }
});
