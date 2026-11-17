import {
  SUPPLEMENTARY_RESOLUTION_HOUSES,
  type SupplementaryResolution,
} from "../../shared/types";
import { SupplementaryResolutionForm } from "./supplementary-resolution-form";

interface SupplementaryResolutionFormsProps {
  billId: string;
  resolutions: SupplementaryResolution[];
}

/** 附帯決議の入力欄を衆議院・参議院それぞれに並べる。 */
export function SupplementaryResolutionForms({
  billId,
  resolutions,
}: SupplementaryResolutionFormsProps) {
  return SUPPLEMENTARY_RESOLUTION_HOUSES.map((house) => {
    const resolution = resolutions.find((r) => r.house === house) ?? null;
    return (
      <SupplementaryResolutionForm
        // 保存・削除後の refresh で、サーバー側で正規化した値をフォームに反映する
        key={`${house}-${resolution?.updated_at ?? "none"}`}
        billId={billId}
        house={house}
        resolution={resolution}
      />
    );
  });
}
