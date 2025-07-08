import { Connection, PublicKey, Transaction } from "https://esm.sh/@solana/web3.js?bundle";
// ——> Exponer Transaction para la consola:
window.Transaction = Transaction;

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const OBRAGOL_MINT = new PublicKey("TuMintAddressAquí");
const USDT_MINT    = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"); // USDT SPL
const RAYDIUM_PROGRAM_ID = new PublicKey("9WwWcMha7rTq6VpCTvZdUehzQWiygkgzarWVWq3CrkJi");

let connection, provider, userPubkey;

window.addEventListener("load", async () => {
  // Detectar Phantom
  if (window.solana && window.solana.isPhantom) {
    provider = window.solana;
    await provider.connect();
    userPubkey = provider.publicKey;
    connection = new Connection(RPC_ENDPOINT, "confirmed");
    document.getElementById("wallet-status")
      .textContent = `Wallet conectada: ${userPubkey.toString()}`;
    document.getElementById("wallet-status")
      .classList.add("connected");
  } else {
    const status = document.getElementById("wallet-status");
    status.textContent = "Wallet Phantom no encontrada";
    status.classList.add("disconnected");
    document.getElementById("buy-button").disabled = true;
    return;
  }

  // Actualizar cálculo
  const inp = document.getElementById("usdt-amount");
  const out = document.getElementById("obragol-amount");
  inp.addEventListener("input", () => {
    const usdt = +inp.value;
    out.textContent = (usdt * 1000).toLocaleString("es");
  });
});

document.getElementById("buy-button").addEventListener("click", async () => {
  try {
    const usdtAmount = +document.getElementById("usdt-amount").value;
    const obragolAmount = usdtAmount * 1000;

    // Construir transacción Raydium
    const transaction = new Transaction();
    // Aquí irían las instrucciones reales de intercambio en Raydium.
    // Ejemplo placeholder:
    // transaction.add(
    //   Raydium.makeSwapInstruction({
    //     // params...
    //   })
    // );

    transaction.feePayer = userPubkey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    // Firmar y enviar
    const signedTx = await provider.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txId, "confirmed");

    alert("✅ ¡Compra enviada! TxID: " + txId);
  } catch (err) {
    console.error(err);
    alert("Error al realizar la compra: " + err.message);
  }
});
