import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { DifficultySelector } from "@/features/bill-difficulty/client/components/difficulty-selector";

/**
 * デスクトップメニュー: 難易度切り替え (画面右上)
 */
export async function DesktopMenuDifficultyToggle() {
  const currentLevel = await getDifficultyLevel();

  return (
    <div className="fixed top-6 right-6 z-50 w-83">
      <div
        className="bg-white flex items-center gap-6 font-bold text-black"
        style={{
          borderRadius: "50px",
          padding: "20px 24px 20px 36px",
        }}
      >
        <DifficultySelector
          currentLevel={currentLevel}
          label="説明をもっと詳しく"
          labelStyle={{
            fontSize: "20px",
            marginRight: "44px",
          }}
        />
      </div>
    </div>
  );
}
