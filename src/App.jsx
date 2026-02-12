import { useState, useEffect } from "react";
// Firebaseの道具をインポート
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";

// ★ここにFirebaseからコピーした設定をそのまま貼り付けてください★
const firebaseConfig = {
  apiKey: "AIzaSyDq48iEI-SWPRxnt0y5jHyyo72W01NZkzk", 
  authDomain: "hp-vocab-app.firebaseapp.com", 
  projectId: "hp-vocab-app", 
  storageBucket: "hp-vocab-app.firebasestorage.app",
  messagingSenderId: "502037341135",
  appId: "1:502037341135:web:4acd2776030edc3c9668ba"
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [words, setWords] = useState([]);
  const [english, setEnglish] = useState("");
  const [japanese, setJapanese] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [flippedId, setFlippedId] = useState(null);
  const [selectedTag, setSelectedTag] = useState("all");
  const [bulkInput, setBulkInput] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [translationResult, setTranslationResult] = useState("");
  const [editingId, setEditingId] = useState(null);

  // 🔥 Firebaseからリアルタイムでデータを取得（localStorageの代わりにここが動きます）
  useEffect(() => {
    // 作成日時（createdAt）順に並べる設定
    const q = query(collection(db, "words"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const wordList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWords(wordList);
    });
    return () => unsub();
  }, []);

  const addWord = async () => {
    if (!english || !japanese) return;

    const tagsArray = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    if (editingId) {
      // 🔥 Firebase上のデータを更新
      await updateDoc(doc(db, "words", editingId), {
        english,
        japanese,
        tags: tagsArray
      });
      setEditingId(null);
    } else {
      // 🔥 Firebaseに新規追加
      await addDoc(collection(db, "words"), {
        english,
        japanese,
        tags: tagsArray,
        createdAt: serverTimestamp() // 追加した時間を記録
      });
    }

    setEnglish("");
    setJapanese("");
    setTagInput("");
  };

  const addBulkWords = async () => {
    if (!translationResult.trim()) return;

    const lines = translationResult.split("\n");

    // 一括追加もFirebaseへ
    for (const line of lines) {
      const [eng, jpn] = line.split("-").map((item) => item.trim());
      if (eng && jpn) {
        await addDoc(collection(db, "words"), {
          english: eng,
          japanese: jpn,
          tags: [],
          createdAt: serverTimestamp()
        });
      }
    }
    setTranslationResult("");
  };

  const generateTranslationRequest = () => {
    if (!bulkInput.trim()) return;
    const text = `以下の英単語を日本語に訳してください。\n\n${bulkInput}`;
    setGeneratedText(text);
  };

  // 削除機能
  const deleteWord = async (id) => {
    await deleteDoc(doc(db, "words", id));
  };

  const allTags = [...new Set(words.flatMap((word) => word.tags || []))];

  const filteredWords =
    selectedTag === "all"
      ? words
      : words.filter((word) => word.tags.includes(selectedTag));

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>🪄 ハリポタ英単語帳</h1>

      <hr />
      <h2>📷 単語まとめ入力</h2>
      <textarea
        rows="6"
        placeholder="改行区切りで英単語を入力"
        value={bulkInput}
        onChange={(e) => setBulkInput(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />
      <button onClick={generateTranslationRequest}>翻訳依頼文を生成</button>

      <hr />
      <h2>📝 翻訳結果を貼り付け</h2>
      <textarea
        rows="6"
        placeholder="例: cry - 泣く"
        value={translationResult}
        onChange={(e) => setTranslationResult(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />
      <button onClick={addBulkWords}>一括追加</button>

      {generatedText && (
        <div style={{ marginTop: "15px" }}>
          <h3>👇 これをChatGPTに貼って</h3>
          <textarea
            rows="6"
            value={generatedText}
            readOnly
            style={{ width: "100%", marginBottom: "10px" }}
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(generatedText);
              alert("コピーしました！");
            }}
          >
            コピー
          </button>
        </div>
      )}

      <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
        <input type="text" placeholder="英単語" value={english} onChange={(e) => setEnglish(e.target.value)} style={{ padding: "12px", fontSize: "16px" }} />
        <input type="text" placeholder="日本語" value={japanese} onChange={(e) => setJapanese(e.target.value)} style={{ padding: "12px", fontSize: "16px" }} />
        <input type="text" placeholder="タグ（カンマ区切り）" value={tagInput} onChange={(e) => setTagInput(e.target.value)} style={{ padding: "12px", fontSize: "16px" }} />
        <button onClick={addWord} style={{ padding: "14px", fontSize: "16px", backgroundColor: "#8b5a2b", color: "white", border: "none", borderRadius: "8px" }}>
          {editingId ? "更新する" : "追加"}
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setSelectedTag("all")}>すべて</button>
        {allTags.map((tag, index) => (
          <button key={index} onClick={() => setSelectedTag(tag)} style={{ marginLeft: "10px" }}>{tag}</button>
        ))}
      </div>

      {filteredWords.map((word) => {
        const isFlipped = flippedId === word.id;
        return (
          <div key={word.id} onClick={() => setFlippedId(isFlipped ? null : word.id)} style={{ border: "2px solid black", padding: "24px", fontSize: "18px", marginBottom: "20px", borderRadius: "12px", textAlign: "center", cursor: "pointer", backgroundColor: "#f5f5dc" }}>
            <h2>{isFlipped ? word.japanese : word.english}</h2>
            <div style={{ marginTop: "10px" }}>
              {(word.tags || []).map((tag, index) => (
                <span key={index} style={{ marginRight: "8px", padding: "4px 8px", backgroundColor: "#d2b48c", borderRadius: "8px", fontSize: "12px" }}>{tag}</span>
              ))}
            </div>
            <small>（タップで切り替え）</small>
            <div style={{ marginTop: "10px" }}>
              <button onClick={(e) => { e.stopPropagation(); setEnglish(word.english); setJapanese(word.japanese); setTagInput(word.tags.join(",")); setEditingId(word.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ marginRight: "10px" }}>編集</button>
              <button onClick={(e) => { e.stopPropagation(); deleteWord(word.id); }}>削除</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default App;