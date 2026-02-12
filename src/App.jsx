import { useState, useEffect } from "react";


function App() {
 const [words, setWords] = useState(() => {
  const saved = localStorage.getItem("hpWords");
  return saved
    ? JSON.parse(saved)
    : [
        { id: 1, english: "wand", japanese: "杖", tags: ["魔法道具"] },
        { id: 2, english: "spell", japanese: "呪文", tags: ["魔法"] },
      ];
  });


  const [english, setEnglish] = useState("");
  const [japanese, setJapanese] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [flippedId, setFlippedId] = useState(null);
  const [selectedTag, setSelectedTag] = useState("all");
  const [bulkInput, setBulkInput] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [translationResult, setTranslationResult] = useState("");
  const [editingId, setEditingId] = useState(null);


useEffect(() => {
  localStorage.setItem("hpWords", JSON.stringify(words));
}, [words]);

  const addWord = () => {
    if (!english || !japanese) return;

    const tagsArray = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    if (editingId) {
      // 🔥 更新モード
      setWords(
        words.map((word) =>
          word.id === editingId
            ? { ...word, english, japanese, tags: tagsArray }
            : word
        )
      );
      setEditingId(null);
    } else {
      // 🔥 新規追加モード
      const newWord = {
        id: Date.now(),
        english,
        japanese,
        tags: tagsArray,
      };

      setWords([...words, newWord]);
    }

    setEnglish("");
    setJapanese("");
    setTagInput("");
  };

  const addBulkWords = () => {
    if (!translationResult.trim()) return;

    const lines = translationResult.split("\n");

    const newWords = lines
      .map((line) => {
        const [english, japanese] = line.split("-").map((item) => item.trim());

        if (!english || !japanese) return null;

        return {
          id: Date.now() + Math.random(),
          english,
          japanese,
          tags: [],
        };
      })
      .filter(Boolean);

    setWords([...words, ...newWords]);
    setTranslationResult("");
  };


  const generateTranslationRequest = () => {
  if (!bulkInput.trim()) return;

  const text = `以下の英単語を日本語に訳してください。\n\n${bulkInput}`;
  setGeneratedText(text);
  };


  // 🔥 全タグ取得（重複なし）
  const allTags = [...new Set(words.flatMap((word) => word.tags))];

  // 🔥 フィルター
  const filteredWords =
    selectedTag === "all"
      ? words
      : words.filter((word) => word.tags.includes(selectedTag));

  return (
    <div
  style={{
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
  }}
>

      <h1>🪄 ハリポタ英単語帳</h1>

      {/* 追加フォーム */}
      <hr />

<h2>📷 単語まとめ入力</h2>

<textarea
  rows="6"
  placeholder="改行区切りで英単語を入力"
  value={bulkInput}
  onChange={(e) => setBulkInput(e.target.value)}
  style={{ width: "100%", marginBottom: "10px" }}
/>

<button onClick={generateTranslationRequest}>
  翻訳依頼文を生成
</button>

<hr />

<h2>📝 翻訳結果を貼り付け</h2>

<textarea
  rows="6"
  placeholder="例: cry - 泣く"
  value={translationResult}
  onChange={(e) => setTranslationResult(e.target.value)}
  style={{ width: "100%", marginBottom: "10px" }}
/>

<button onClick={addBulkWords}>
  一括追加
</button>


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


        <div
      style={{
        marginBottom: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <input
        type="text"
        placeholder="英単語"
        value={english}
        onChange={(e) => setEnglish(e.target.value)}
        style={{ padding: "12px", fontSize: "16px" }}
      />

      <input
        type="text"
        placeholder="日本語"
        value={japanese}
        onChange={(e) => setJapanese(e.target.value)}
        style={{ padding: "12px", fontSize: "16px" }}
      />

      <input
        type="text"
        placeholder="タグ（カンマ区切り）"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        style={{ padding: "12px", fontSize: "16px" }}
      />

      <button
        onClick={addWord}
        style={{
          padding: "14px",
          fontSize: "16px",
          backgroundColor: "#8b5a2b",
          color: "white",
          border: "none",
          borderRadius: "8px",
        }}
      >
        {editingId ? "更新する" : "追加"}
      </button>
    </div>

      
      {/* 🔥 タグフィルター */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setSelectedTag("all")}>
          すべて
        </button>
        {allTags.map((tag, index) => (
          <button
            key={index}
            onClick={() => setSelectedTag(tag)}
            style={{ marginLeft: "10px" }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* カード表示 */}
      {filteredWords.map((word) => {
        const isFlipped = flippedId === word.id;

        return (
          <div
            key={word.id}
            onClick={() =>
              setFlippedId(isFlipped ? null : word.id)
            }
            style={{
              border: "2px solid black",
              padding: "24px",
              fontSize: "18px",
              marginBottom: "20px",
              borderRadius: "12px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "#f5f5dc",
            }}
          >
            <h2>
              {isFlipped ? word.japanese : word.english}
            </h2>

            <div style={{ marginTop: "10px" }}>
              {word.tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    marginRight: "8px",
                    padding: "4px 8px",
                    backgroundColor: "#d2b48c",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <small>（タップで切り替え）</small>
           <div style={{ marginTop: "10px" }}>
              <button
               onClick={(e) => {
                  e.stopPropagation();
                  setEnglish(word.english);
                  setJapanese(word.japanese);
                  setTagInput(word.tags.join(","));
                  setEditingId(word.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{ marginRight: "10px" }}
              >
                編集
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setWords(words.filter((w) => w.id !== word.id));
                }}
              >
                削除
              </button>
            </div>

          </div>
        );
      })}
    </div>
  );
}

export default App;
