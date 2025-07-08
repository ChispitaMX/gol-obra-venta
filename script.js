import { Connection, PublicKey, Transaction } from "https://esm.sh/@solana/web3.js?bundle";
// Exponer Transaction para la consola
window.Transaction = Transaction;

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const OBRAGOL_MINT = new PublicKey("TuMintAddressAquí");
const USDT_MINT    = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"); // USDT SPL
const RAYDIUM_PROGRAM_ID = new PublicKey("9WwWcMha7rTq6VpCTvZdUehzQWiygkgzarWVWq3CrkJi");

let connection, provider, userPubkey;

const connectBtn = document.getElementById("connect-button");
const statusEl = document.getElementById("wallet-status");
const usdtInput = document.getElementById("usdt-amount");
const obragoSpan = document.getElementById("obragol-amount");
const buyBtn = document.getElementById("buy-button");

// Conectar Phantom
connectBtn.addEventListener("click", async () => {
  if (window.solana && window.solana.isPhantom) {
    provider = window.solana;
    await provider.connect();
    userPubkey = provider.publicKey;
    connection = new Connection(RPC_ENDPOINT, "confirmed");
    statusEl.textContent = `Wallet conectada: ${userPubkey.toString()}`;
    statusEl.classList.remove("disconnected");
    statusEl.classList.add("connected");
    buyBtn.disabled = false;
  } else {
    statusEl.textContent = "Wallet Phantom no encontrada";
    statusEl.classList.remove("connected");
    statusEl.classList.add("disconnected");
    buyBtn.disabled = true;
  }
});

// Calcular OBRAGOL a recibir
usdtInput.addEventListener("input", () => {
  const usdt = +usdtInput.value || 0;
  obragoSpan.textContent = (usdt * 1000).toLocaleString("es");
});

// Comprar OBRAGOL
buyBtn.addEventListener("click", async () => {
  try {
    const usdtAmount = +usdtInput.value;
    if (usdtAmount <= 0) throw new Error("Ingresa un monto mayor a 0");
    const transaction = new Transaction();
    // Aquí irían las instrucciones reales de intercambio en Raydium
    transaction.feePayer = userPubkey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    const signedTx = await provider.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txId, "confirmed");
    alert("✅ ¡Compra enviada! TxID: " + txId);
  } catch (err) {
    console.error(err);
    alert("Error al realizar la compra: " + err.message);
  }
});
