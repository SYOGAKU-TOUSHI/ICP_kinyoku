import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as counter_idl, canisterId as counter_canister_id } from "../../declarations/todo_app_backend";

// --- Actor 設定 (変更なし) ---
const network = process.env.DFX_NETWORK || (process.env.NODE_ENV === "production" ? "ic" : "local");
const isLocal = network === "local";
const host = isLocal ? "http://127.0.0.1:4943" : "https://ic0.app";
const canisterId = isLocal ? counter_canister_id : process.env.CANISTER_ID_TODO_APP_BACKEND;

const agent = new HttpAgent({ host });

if (isLocal) {
  agent.fetchRootKey().catch(err => {
    console.warn("Unable to fetch root key. Check local replica.");
    console.error(err);
  });
}

const counter = Actor.createActor(counter_idl, {
  agent,
  canisterId,
});

// ★★★ 初期化済みフラグ ★★★
let isInitialized = false;

// DOMContentLoaded イベントリスナー
document.addEventListener("DOMContentLoaded", () => {
  // ★★★ 初期化済みなら何もしない ★★★
  if (isInitialized) {
    console.log("DOM already initialized, skipping setup.");
    return;
  }
  isInitialized = true; // 初期化フラグを立てる
  console.log("DOM fully loaded and parsed - initializing setup");


  // --- DOM 要素の取得 ---
  const countDisplay = document.getElementById("count-display");
  const incrementButton = document.getElementById("increment-button");

  // --- 関数定義 ---
  async function loadCount() {
    try {
      countDisplay.textContent = "Loading...";
      const currentCount = await counter.getCount();
      console.log("### Count loaded: ", Number(currentCount));
      countDisplay.textContent = Number(currentCount).toLocaleString();
    } catch (error) {
      console.error("Failed to load count:", error);
      countDisplay.textContent = "Error";
    }
  }

  // --- イベントリスナーの設定 ---
  const handleIncrementClick = async () => {
    console.log("### Button clicked, calling increment... ###");
    incrementButton.disabled = true;
    countDisplay.textContent = "Sending...";

    try {
      await counter.increment();
      console.log("### increment call finished. ###");
      console.log("### Calling loadCount... ###");
      await loadCount(); // try ブロック内に戻す
      console.log("### loadCount finished. ###");
    } catch (error) {
      console.error("Failed to increment count:", error);
      countDisplay.textContent = "Error";
      alert(`Failed to increment: ${error.message || error}`);
    } finally {
      incrementButton.disabled = false;
    }
  };

  incrementButton.addEventListener("click", handleIncrementClick);

  // --- 初期化 ---
  loadCount();

});
