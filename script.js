import {
    Connection,
    PublicKey,
    clusterApiUrl
} from "https://esm.sh/@solana/web3.js";

import {
    getAssociatedTokenAddress,
    createTransferInstruction
} from "https://esm.sh/@solana/spl-token";

// ----------- CONFIGURACIÓN PRINCIPAL -----------
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
const RECEIVER_WALLET = new PublicKey("8W2ogqdvFSvDfQitX2JyyiCX6hqehZWvrpWTkkYCHGPm");

// Puedes cambiar el RPC si tu navegador bloquea alguno
const RPC_ENDPOINT = "https://rpc.ankr.com/solana"; // CORS friendly
const connection = new Connection(RPC_ENDPOINT, { commitment: "confirmed" });

// ----------- ELEMENTOS DEL DOM -----------
const connectBtn   = document.getElementById("connectWallet");
const buyBtn       = document.getElementById("buyButton");
const usdtInput    = document.getElementById("usdtAmount");
const obragolOutput = document.getElementById("obragolAmount");

// ----------- ESTADO -----------
let wallet   = null;
let provider = null;

// ----------- CONECTAR WALLET -----------
connectBtn.addEventListener("click", async () => {
    if (window.solana?.isPhantom || window.solflare) {
        provider = window.solana?.isPhantom ? window.solana : window.solflare;
        try {
            const resp = await provider.connect();
            wallet = resp.publicKey ?? resp; // Phantom retorna una pubkey, Solflare retorna pubkey directa
            connectBtn.textContent = "Wallet conectada: " + wallet.toString();
        } catch (err) {
            alert("Conexión fallida: " + (err?.message || err));
        }
    } else {
        alert("Instala Phantom o Solflare Wallet para continuar.");
    }
});

// ----------- CALCULAR TOKENS -----------
usdtInput.addEventListener("input", () => {
    const cantidad = parseFloat(usdtInput.value);
    obragolOutput.textContent = isNaN(cantidad) ? 0 : (cantidad / 0.001).toFixed(0); // 0.001 USDT = 1 OBRAGOL
});

// ----------- COMPRAR OBRAGOL -----------
buyBtn.addEventListener("click", async () => {
    if (!wallet) return alert("Conecta tu wallet primero.");

    const cantidad = parseFloat(usdtInput.value);
    if (isNaN(cantidad) || cantidad <= 0) return alert("Ingresa una cantidad válida");

    const cantidadUSDT = Math.round(cantidad * 1e6); // USDT tiene 6 decimales

    try {
        // Cuentas asociadas de USDT
        const senderTokenAccount = await getAssociatedTokenAddress(USDT_MINT, wallet);
        const receiverTokenAccount = await getAssociatedTokenAddress(USDT_MINT, RECEIVER_WALLET);

        // Construir transferencia SPL Token
        const transferIx = createTransferInstruction(
            senderTokenAccount,
            receiverTokenAccount,
            wallet,
            cantidadUSDT
        );

        const transaction = new window.solanaWeb3.Transaction().add(transferIx);
        transaction.feePayer = wallet;

        // Intentamos usar signAndSendTransaction (Phantom) para evitar CORS y blockhash issues
        if (provider.signAndSendTransaction) {
            const { signature } = await provider.signAndSendTransaction(transaction);
            await connection.confirmTransaction(signature, "confirmed");
            alert(`Compra exitosa. TxID: ${signature}`);
        } else {
            // Fallback: manual
            // Necesitamos recentBlockhash solo en este caso
            transaction.recentBlockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
            const signedTx = await provider.signTransaction(transaction);
            const sig = await connection.sendRawTransaction(signedTx.serialize());
            await connection.confirmTransaction(sig, "confirmed");
            alert(`Compra exitosa. TxID: ${sig}`);
        }
    } catch (err) {
        console.error(err);
        alert(`Error al realizar la compra: ${err?.message || err}`);
    }
});
