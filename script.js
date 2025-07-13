import { Connection, PublicKey, Transaction } from "https://esm.sh/@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction } from "https://esm.sh/@solana/spl-token";

const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
const RECEIVER = new PublicKey("8W2ogqdvFSvDfQitX2JyyiCX6hqehZWvrpWTkkYCHGPm");
const RPC = "https://rpc.ankr.com/solana";
const connection = new Connection(RPC, { commitment: "confirmed" });

const connectBtn = document.getElementById("connectWallet");
const buyBtn = document.getElementById("buyButton");
const usdtInput = document.getElementById("usdtAmount");
const obragolOutput = document.getElementById("obragolAmount");

let provider = null;
let wallet = null;

connectBtn.addEventListener("click", async () => {
  if (window.solana?.isPhantom || window.solflare) {
    provider = window.solana?.isPhantom ? window.solana : window.solflare;
    try {
      const resp = await provider.connect();
      wallet = resp.publicKey ?? resp;
      connectBtn.textContent = "Wallet: " + wallet.toString().slice(-6);
    } catch (e) {
      alert("Error al conectar: " + e.message);
    }
  }
});

usdtInput.addEventListener("input", () => {
  const val = +usdtInput.value;
  obragolOutput.textContent = isNaN(val) ? 0 : (val/0.001).toFixed(0);
});

buyBtn.addEventListener("click", async () => {
  if (!wallet) return alert("Conecta tu wallet primero.");
  const val = parseFloat(usdtInput.value);
  if (!val || val <= 0) return alert("Cantidad inválida");
  const uAmount = Math.round(val * 1e6);

  try {
    const sender = await getAssociatedTokenAddress(USDT_MINT, wallet);
    const receiverAcct = await getAssociatedTokenAddress(USDT_MINT, RECEIVER);
    const ix = createTransferInstruction(sender, receiverAcct, wallet, uAmount);

    let tx = new Transaction().add(ix);
    tx.feePayer = wallet;
    tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;

    let sig;
    if (provider.signAndSendTransaction) {
      const { signature } = await provider.signAndSendTransaction(tx);
      sig = signature;
    } else {
      const signed = await provider.signTransaction(tx);
      sig = await connection.sendRawTransaction(signed.serialize());
    }
    await connection.confirmTransaction(sig, "confirmed");
    alert("Compra exitosa! TxID:
" + sig);
  } catch (e) {
    console.error(e);
    alert("Error al enviar USDT: " + e.message);
  }
});